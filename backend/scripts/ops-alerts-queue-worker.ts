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
import { startHealthServer } from '../shared/health-server'
import {
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  createVisibilityTimeoutExtender,
  drainAndStop,
  getQueueDepth,
  type VisibilityTimeoutExtender,
} from '../shared/sqs'
import { notifyBlockAlert } from '../plane-b/src/collectors/alert-routing'
import { recordQueueDepthMetric, recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { initErrorTracking } from '../shared/error-tracker'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter } from '../shared/worker-jitter'

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
initErrorTracking('ops-alerts-queue-worker')

const batchSize = config.workers.opsAlertsQueueWorker.batchSize
const idleSleepMs = config.workers.opsAlertsQueueWorker.idleSleepMs
const shutdownTimeoutMs = config.workers.opsAlertsQueueWorker.shutdownTimeoutMs
const loopJitterMs = config.workers.opsAlertsQueueWorker.loopJitterMs
const messageJitterMs = config.workers.opsAlertsQueueWorker.messageJitterMs
const healthEnabled = config.workers.health.enabled
const healthPort = config.workers.health.port
const isLambdaRuntime = config.runtime.isLambda
let healthServer: { close: () => Promise<void> } | null = null
const activeExtenders = new Set<VisibilityTimeoutExtender>()
const shutdown = createShutdownHandler({
  name: 'ops-alerts-queue-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    await Promise.allSettled(Array.from(activeExtenders, (extender) => drainAndStop(extender)))
  },
})
const { signal: shutdownSignal } = shutdown

const validatePayload = (payload: OpsAlertsQueueMessage | null): payload is OpsAlertsQueueMessage => {
  if (!payload) return false
  if (!payload.alertId || !payload.providerId || !payload.corridorId) return false
  return true
}

const getQueueNameFromUrl = (url: string): string => {
  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'ops-alerts'
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

  if (!isLambdaRuntime && healthEnabled && process.env.HEALTH_SERVER_STARTED !== '1') {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'ops-alerts-queue-worker',
        enableDatabaseCheck: true,
        enableRedisCheck: true,
        enableSqsCheck: true,
        sqsQueueUrl: queueUrl,
      })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const pool = createPool(config.db.planeBUrl)

  try {
    logger.info('ops_alerts_worker_start', { batch_size: batchSize })
    while (!shutdown.isShuttingDown()) {
      await applyJitter(logger, 'ops_alerts_queue_loop', loopJitterMs)
      const { messages, error: receiveError } = await receiveJsonMessages<OpsAlertsQueueMessage>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }
      const queueDepth = await getQueueDepth(queueUrl)
      await recordQueueDepthMetric(getQueueNameFromUrl(queueUrl), queueDepth)
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
            const extender = createVisibilityTimeoutExtender(
              queueUrl!,
              message.receiptHandle,
              () => logger.debug('visibility_extended', { message_id: message.messageId }),
            )
            activeExtenders.add(extender)
            try {
              await withWorkerRetry(
                () => notifyBlockAlert(pool, payload.alertId, { force: true }),
                {
                  maxRetries: 3,
                  initialDelayMs: 1000,
                  maxDelayMs: 30000,
                  signal: shutdownSignal,
                  operation: 'ops-alerts.queue.notify',
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

              // Send to DLQ and delete source message to prevent duplicate DLQ copies
              await sendToDLQ(queueUrl!, message, err)
              await recordWorkerMetric('ops-alerts-queue-worker', 'dlq_sent', 1)
              deleteHandles.push(message.receiptHandle)
            } finally {
              activeExtenders.delete(extender)
              await extender()
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

      const { failed } = await deleteMessages(queueUrl, deleteHandles)
      if (failed.length > 0) {
        logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
      }
    }
  } finally {
    await pool.end()
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (shutdown.isShuttingDown()) {
      await shutdown.shutdown('shutdown_requested')
    }
  }
}

if (require.main === module) {
  runOpsAlertsQueueWorkerLoop()
    .catch((error) => {
      logger.error('ops_alerts_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
