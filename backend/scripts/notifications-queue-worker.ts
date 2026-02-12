/**
 * Notifications Queue Worker - SQS consumer for notification fanout.
 *
 * Runs webhook delivery from the notifications queue when
 * `PLANE_B_NOTIFICATIONS_QUEUE_MODE=queue` is enabled.
 */

import { context as otelContext } from '@opentelemetry/api'
import { setTimeout as sleep } from 'timers/promises'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from '../shared/health-server'
import { deleteMessages, receiveJsonMessages, sendToDLQ, createVisibilityTimeoutExtender } from '../shared/sqs'
import { dispatchQueuedSignal, type NotificationsQueueMessage } from '../plane-b/src/notifications/dispatcher'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter, resolveJitterMs } from '../shared/worker-jitter'

const logger = createLogger('script.notifications-queue-worker')
const queueUrl = config.queues.notifications.url
const queueMode = config.queues.notifications.mode
initTracing('notifications-queue-worker')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.NOTIFICATIONS_QUEUE_BATCH_SIZE, 10)
const idleSleepMs = toNumber(process.env.NOTIFICATIONS_QUEUE_IDLE_SLEEP_MS, 1000)
const shutdownTimeoutMs = toNumber(process.env.NOTIFICATIONS_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000)
const loopJitterMs = resolveJitterMs(process.env.NOTIFICATIONS_QUEUE_LOOP_JITTER_MS)
const messageJitterMs = resolveJitterMs(process.env.NOTIFICATIONS_QUEUE_MESSAGE_JITTER_MS)
const healthEnabled = process.env.WORKER_HEALTH_ENABLED !== '0'
const healthPort = toNumber(process.env.HEALTH_PORT, 8080)
const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null
let healthServer: { close: () => Promise<void> } | null = null

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

const validatePayload = (payload: NotificationsQueueMessage | null): payload is NotificationsQueueMessage => {
  if (!payload) return false
  if (!payload.providerId || !payload.corridorId) return false
  if (!payload.signalType) return false
  if (typeof payload.anomaly?.zScore !== 'number') return false
  return true
}

export const runNotificationsQueueWorkerLoop = async () => {
  if (queueMode !== 'queue') {
    logger.warn('notifications_worker_disabled', { mode: queueMode })
    return
  }

  if (!queueUrl) {
    logger.warn('notifications_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  if (!isLambdaRuntime && healthEnabled) {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'notifications-queue-worker',
        enableDatabaseCheck: true,
        enableRedisCheck: true,
      })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const pool = createPool(config.db.planeBUrl)

  try {
    logger.info('notifications_worker_start', { batch_size: batchSize })
    while (!shutdownRequested) {
      await applyJitter(logger, 'notifications_queue_loop', loopJitterMs)
      const messages = await receiveJsonMessages<NotificationsQueueMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []

      for (const message of messages) {
        const payload = message.payload
        if (!validatePayload(payload)) {
          logger.warn('notifications_item_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        await applyJitter(logger, 'notifications_queue_message', messageJitterMs)

        const runWithSpan = async () => startSpan(
          'notifications.queue.message',
          async () => {
            // Extend visibility timeout for slow webhook deliveries
            const stopExtending = createVisibilityTimeoutExtender(
              queueUrl!,
              message.receiptHandle,
              () => logger.debug('visibility_extended', { message_id: message.messageId }),
            )

            try {
              await withWorkerRetry(
                () => dispatchQueuedSignal(pool, payload),
                {
                  maxRetries: 3,
                  initialDelayMs: 1000,
                  maxDelayMs: 30000,
                },
              )
              stopExtending()
              await recordWorkerMetric('notifications-queue-worker', 'message_processed', 1)
              deleteHandles.push(message.receiptHandle)
            } catch (error) {
              stopExtending()
              const err = error instanceof Error ? error : new Error(String(error))
              logger.error('notifications_item_failed', {
                message_id: message.messageId,
                error: err.message,
              })
              await recordWorkerMetric('notifications-queue-worker', 'message_failed', 1)

              // Send to DLQ
              await sendToDLQ(queueUrl!, message, err)
              await recordWorkerMetric('notifications-queue-worker', 'dlq_sent', 1)
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
    await pool.end()
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
  }
}

if (require.main === module) {
  runNotificationsQueueWorkerLoop()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error('notifications_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
