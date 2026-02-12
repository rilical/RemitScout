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
import {
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  createVisibilityTimeoutExtender,
  drainAndStop,
  type VisibilityTimeoutExtender,
} from '../shared/sqs'
import { dispatchQueuedSignal, type NotificationsQueueMessage } from '../plane-b/src/notifications/dispatcher'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { initErrorTracking } from '../shared/error-tracker'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter } from '../shared/worker-jitter'

const logger = createLogger('script.notifications-queue-worker')
const queueUrl = config.queues.notifications.url
const queueMode = config.queues.notifications.mode
initTracing('notifications-queue-worker')
initErrorTracking('notifications-queue-worker')

const batchSize = config.workers.notificationsQueueWorker.batchSize
const idleSleepMs = config.workers.notificationsQueueWorker.idleSleepMs
const shutdownTimeoutMs = config.workers.notificationsQueueWorker.shutdownTimeoutMs
const loopJitterMs = config.workers.notificationsQueueWorker.loopJitterMs
const messageJitterMs = config.workers.notificationsQueueWorker.messageJitterMs
const healthEnabled = config.workers.health.enabled
const healthPort = config.workers.health.port
const isLambdaRuntime = config.runtime.isLambda
let healthServer: { close: () => Promise<void> } | null = null
const activeExtenders = new Set<VisibilityTimeoutExtender>()
const shutdown = createShutdownHandler({
  name: 'notifications-queue-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    await Promise.allSettled(Array.from(activeExtenders, (extender) => drainAndStop(extender)))
  },
})
const { signal: shutdownSignal } = shutdown

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
    logger.info('notifications_worker_start', { batch_size: batchSize })
    while (!shutdown.isShuttingDown()) {
      await applyJitter(logger, 'notifications_queue_loop', loopJitterMs)
      const { messages, error: receiveError } = await receiveJsonMessages<NotificationsQueueMessage>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }
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
            const extender = createVisibilityTimeoutExtender(
              queueUrl!,
              message.receiptHandle,
              () => logger.debug('visibility_extended', { message_id: message.messageId }),
            )
            activeExtenders.add(extender)

            try {
              await withWorkerRetry(
                () => dispatchQueuedSignal(pool, payload),
                {
                  maxRetries: 3,
                  initialDelayMs: 1000,
                  maxDelayMs: 30000,
                  signal: shutdownSignal,
                  operation: 'notifications.queue.dispatch',
                },
              )
              await recordWorkerMetric('notifications-queue-worker', 'message_processed', 1)
              deleteHandles.push(message.receiptHandle)
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error))
              logger.error('notifications_item_failed', {
                message_id: message.messageId,
                error: err.message,
              })
              await recordWorkerMetric('notifications-queue-worker', 'message_failed', 1)

              // Send to DLQ
              await sendToDLQ(queueUrl!, message, err)
              await recordWorkerMetric('notifications-queue-worker', 'dlq_sent', 1)
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
  runNotificationsQueueWorkerLoop()
    .catch((error) => {
      logger.error('notifications_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
