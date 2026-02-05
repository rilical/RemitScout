/**
 * Alert Evaluation Worker - SQS consumer for alert evaluations.
 *
 * Processes alert evaluation jobs from the alert evaluation queue.
 * Intended to be triggered by EventBridge (scheduler) and run in Lambda/ECS.
 */

import { setTimeout as sleep } from 'timers/promises'
import { context as otelContext } from '@opentelemetry/api'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import {
  createVisibilityTimeoutExtender,
  deleteMessages,
  getQueueDepth,
  receiveJsonMessages,
  sendToDLQ,
} from '../shared/sqs'
import { applyJitter, resolveJitterMs } from '../shared/worker-jitter'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordQueueDepthMetric, recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { evaluateAlertsForFrequency } from '../plane-a/src/services/alert-evaluator'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing, startSpan } from '../shared/tracing'

type AlertEvaluationMessage = {
  frequency: 'weekly' | 'daily'
  timeBucket?: number
}

const logger = createLogger('script.alert-evaluation-worker')
const queueUrl = config.alerts.evaluation.queueUrl
const evaluationEnabled = config.alerts.evaluation.enabled

initTracing('alert-evaluation-worker')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = config.alerts.evaluation.batchSize
const idleSleepMs = toNumber(process.env.ALERT_EVALUATION_IDLE_SLEEP_MS, 1000)
const loopJitterMs = resolveJitterMs(process.env.ALERT_EVALUATION_LOOP_JITTER_MS, 0)
const messageJitterMs = resolveJitterMs(process.env.ALERT_EVALUATION_MESSAGE_JITTER_MS, 0)
const lockTtlSeconds = toNumber(process.env.ALERT_EVALUATION_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = toNumber(process.env.ALERT_EVALUATION_SHUTDOWN_TIMEOUT_MS, 30000)

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: shutdownTimeoutMs,
  logger,
})

const resolveQueueName = (url: string) => {
  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1] || url
}

const validatePayload = (payload: AlertEvaluationMessage | null): payload is AlertEvaluationMessage => {
  if (!payload) return false
  if (payload.frequency !== 'weekly' && payload.frequency !== 'daily') {
    return false
  }
  if (payload.timeBucket !== undefined && !Number.isFinite(payload.timeBucket)) {
    return false
  }
  return true
}

const runQueueWorker = async (options?: { once?: boolean }) => {
  if (!evaluationEnabled) {
    logger.warn('alert_evaluation_worker_disabled', { reason: 'disabled' })
    return
  }

  if (!queueUrl) {
    logger.warn('alert_evaluation_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const lock = new WorkerLock('alert-evaluation-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('alert_evaluation_worker_skipped', { reason: 'lock_already_held' })
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'alert-evaluation-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeAUrl)

  try {
    logger.info('alert_evaluation_worker_start', { batch_size: batchSize })

    while (!isShutdownRequested()) {
      await applyJitter(logger, 'alert_evaluation_loop', loopJitterMs)
      const queueDepth = await getQueueDepth(queueUrl)
      const queueName = resolveQueueName(queueUrl)
      await recordQueueDepthMetric(queueName, queueDepth)

      const messages = await receiveJsonMessages<AlertEvaluationMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        if (options?.once) {
          break
        }
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []

      for (const message of messages) {
        if (!validatePayload(message.payload)) {
          logger.warn('alert_evaluation_message_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const { frequency, timeBucket } = message.payload
        await applyJitter(logger, 'alert_evaluation_message', messageJitterMs)

        const handleMessage = async () => {
          const stopExtending = createVisibilityTimeoutExtender(
            queueUrl,
            message.receiptHandle,
            () => logger.debug('visibility_extended', { message_id: message.messageId }),
          )

          try {
            await withWorkerRetry(
              () => evaluateAlertsForFrequency(pool, frequency, timeBucket),
              { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 30000 },
            )
            stopExtending()
            await recordWorkerMetric('alert-evaluation-worker', 'message_processed', 1)
            deleteHandles.push(message.receiptHandle)
          } catch (error) {
            stopExtending()
            const err = error instanceof Error ? error : new Error(String(error))
            logger.error('alert_evaluation_failed', {
              message_id: message.messageId,
              frequency,
              error: err.message,
            })
            await recordWorkerMetric('alert-evaluation-worker', 'message_failed', 1)
            await sendToDLQ(queueUrl, message, err)
            await recordWorkerMetric('alert-evaluation-worker', 'dlq_sent', 1)
          }
        }

        const messageContext = message.traceContext ?? otelContext.active()
        await otelContext.with(messageContext, () =>
          startSpan('alert-evaluation.message', async (span) => {
            if (typeof span.setAttributes === 'function') {
              span.setAttributes({
                'message.id': message.messageId,
                'alert.frequency': frequency,
              })
            }
            if (timeBucket !== undefined && typeof span.setAttribute === 'function') {
              span.setAttribute('alert.time_bucket', timeBucket)
            }
            await handleMessage()
          }),
        )
      }

      await deleteMessages(queueUrl, deleteHandles)

      if (options?.once) {
        break
      }
    }
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release()
    await pool.end()
  }
}

export const runAlertEvaluationWorker = async (options?: { once?: boolean }) => {
  await runQueueWorker(options)
}

if (!process.env.VITEST && require.main === module) {
  runAlertEvaluationWorker()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('alert_evaluation_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
