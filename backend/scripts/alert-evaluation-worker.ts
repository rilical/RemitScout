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
import { startHealthServer } from '../shared/health-server'
import {
  createVisibilityTimeoutExtender,
  deleteMessages,
  getQueueDepth,
  receiveJsonMessages,
  sendToDLQ,
} from '../shared/sqs'
import { applyJitter } from '../shared/worker-jitter'
import { recordQueueDepthMetric, recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { evaluateAlertsForFrequency } from '../plane-a/src/services/alert-evaluator'
import { createShutdownHandler } from '../shared/shutdown'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing, startSpan } from '../shared/tracing'

type AlertEvaluationMessage = {
  frequency: 'weekly' | 'daily'
  timeBucket?: number
}

const logger = createLogger('script.alert-evaluation-worker')
const queueUrl = config.alerts.evaluation.queueUrl
const evaluationEnabled = config.alerts.evaluation.enabled

initTracing('alert-evaluation-worker')
initErrorTracking('alert-evaluation-worker')

const batchSize = config.alerts.evaluation.batchSize
const idleSleepMs = config.workers.alertEvaluationWorker.idleSleepMs
const loopJitterMs = config.workers.alertEvaluationWorker.loopJitterMs
const messageJitterMs = config.workers.alertEvaluationWorker.messageJitterMs
const shutdownTimeoutMs = config.workers.alertEvaluationWorker.shutdownTimeoutMs
const healthEnabled = config.workers.health.enabled
const healthPort = config.workers.health.port
const isLambdaRuntime = config.runtime.isLambda
let healthServer: { close: () => Promise<void> } | null = null

const { isShutdownRequested, signal: shutdownSignal } = createShutdownHandler({
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

  if (!isLambdaRuntime && healthEnabled) {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'alert-evaluation-worker',
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

  const pool = createPool(config.db.planeAUrl)

  try {
    logger.info('alert_evaluation_worker_start', { batch_size: batchSize })

    while (!isShutdownRequested()) {
      await applyJitter(logger, 'alert_evaluation_loop', loopJitterMs)
      const queueDepth = await getQueueDepth(queueUrl)
      const queueName = resolveQueueName(queueUrl)
      await recordQueueDepthMetric(queueName, queueDepth)

      const { messages, error: receiveError } = await receiveJsonMessages<AlertEvaluationMessage>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }
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
              {
                maxRetries: 3,
                initialDelayMs: 1000,
                maxDelayMs: 30000,
                signal: shutdownSignal,
                operation: 'alert-evaluation.evaluate',
              },
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
            deleteHandles.push(message.receiptHandle)
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

      const { failed } = await deleteMessages(queueUrl, deleteHandles)
      if (failed.length > 0) {
        logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
      }

      if (options?.once) {
        break
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
  }
}

export const runAlertEvaluationWorker = async (options?: { once?: boolean }) => {
  await runQueueWorker(options)
}

if (config.env !== 'test' && require.main === module) {
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
