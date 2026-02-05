/**
 * Ops Alerts Queue Worker - SQS consumer for ops alert routing.
 *
 * Runs block alert notifications from the ops alerts queue when
 * `PLANE_B_OPS_ALERT_QUEUE_MODE=queue` is enabled.
 */

import { context as otelContext } from '@opentelemetry/api'
import { setTimeout as sleep } from 'timers/promises'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { deleteMessages, receiveJsonMessages, sendToDLQ } from '../shared/sqs'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { notifyBlockAlert } from '../plane-b/src/collectors/alert-routing'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter, resolveJitterMs } from '../shared/worker-jitter'

type OpsAlertsQueueMessage = {
  alertId: string
  providerId: string
  corridorId: string
  amountBucket: number | null
  httpStatus: number | null
  blockReason: string | null
  bronzeObjectKey: string | null
  requestId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

const logger = createLogger('script.ops-alerts-queue-worker')
const queueUrl = config.queues.opsAlerts.url
const queueMode = config.queues.opsAlerts.mode
initTracing('ops-alerts-queue-worker')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.OPS_ALERTS_QUEUE_BATCH_SIZE, 10)
const idleSleepMs = toNumber(process.env.OPS_ALERTS_QUEUE_IDLE_SLEEP_MS, 1000)
const lockTtlSeconds = toNumber(process.env.OPS_ALERTS_QUEUE_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = toNumber(process.env.OPS_ALERTS_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000)
const loopJitterMs = resolveJitterMs(process.env.OPS_ALERTS_QUEUE_LOOP_JITTER_MS)
const messageJitterMs = resolveJitterMs(process.env.OPS_ALERTS_QUEUE_MESSAGE_JITTER_MS)
let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
  forceExitTimer = setTimeout(() => {
    logger.warn('shutdown_forced', { timeout_ms: shutdownTimeoutMs })
    process.exit(1)
  }, shutdownTimeoutMs)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

const validatePayload = (payload: OpsAlertsQueueMessage | null): payload is OpsAlertsQueueMessage => {
  if (!payload) return false
  if (!payload.alertId || !payload.providerId || !payload.corridorId) return false
  return true
}

export const runOpsAlertsQueueWorkerLoop = async () => {
  if (queueMode !== 'queue') {
    logger.warn('ops_alerts_worker_disabled', { mode: queueMode })
    return
  }

  if (!queueUrl) {
    logger.warn('ops_alerts_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const lock = new WorkerLock('ops-alerts-queue-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('ops_alerts_worker_skipped', { reason: 'lock_already_held' })
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'ops-alerts-queue-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeBUrl)

  try {
    logger.info('ops_alerts_worker_start', { batch_size: batchSize })
    while (!shutdownRequested) {
      await applyJitter(logger, 'ops_alerts_queue_loop', loopJitterMs)
      const messages = await receiveJsonMessages<OpsAlertsQueueMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []

      for (const message of messages) {
        const payload = message.payload
        if (!validatePayload(payload)) {
          logger.warn('ops_alerts_item_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        await applyJitter(logger, 'ops_alerts_queue_message', messageJitterMs)

        const runWithSpan = async () => startSpan(
          'ops-alerts.queue.message',
          async () => {
            try {
              await withWorkerRetry(
                () => notifyBlockAlert(pool, payload.alertId, { force: true }),
                {
                  maxRetries: 3,
                  initialDelayMs: 1000,
                  maxDelayMs: 30000,
                },
              )
              await recordWorkerMetric('ops-alerts-queue-worker', 'message_processed', 1)
              deleteHandles.push(message.receiptHandle)
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error))
              logger.error('ops_alerts_item_failed', {
                message_id: message.messageId,
                alert_id: payload.alertId,
                error: err.message,
              })
              await recordWorkerMetric('ops-alerts-queue-worker', 'message_failed', 1)

              // Send to DLQ
              await sendToDLQ(queueUrl!, message, err)
              await recordWorkerMetric('ops-alerts-queue-worker', 'dlq_sent', 1)
            }
          },
          { attributes: { message_id: message.messageId } },
        )

        if (message.traceContext) {
          await otelContext.with(message.traceContext, runWithSpan)
        } else {
          await runWithSpan()
        }
      }

      await deleteMessages(queueUrl, deleteHandles)
    }
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release()
    await pool.end()
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
  }
}

if (require.main === module) {
  runOpsAlertsQueueWorkerLoop()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error('ops_alerts_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
