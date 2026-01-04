/**
 * Notifications Queue Worker - SQS consumer for notification fanout.
 *
 * Runs webhook delivery from the notifications queue when
 * `PLANE_B_NOTIFICATIONS_QUEUE_MODE=queue` is enabled.
 */

import { setTimeout as sleep } from 'timers/promises'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { deleteMessages, receiveJsonMessages, sendToDLQ, createVisibilityTimeoutExtender } from '../shared/sqs'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { dispatchQueuedSignal, type NotificationsQueueMessage } from '../plane-b/src/notifications/dispatcher'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'

const logger = createLogger('script.notifications-queue-worker')
const queueUrl = config.queues.notifications.url
const queueMode = config.queues.notifications.mode

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.NOTIFICATIONS_QUEUE_BATCH_SIZE, 10)
const idleSleepMs = toNumber(process.env.NOTIFICATIONS_QUEUE_IDLE_SLEEP_MS, 1000)
const lockTtlSeconds = toNumber(process.env.NOTIFICATIONS_QUEUE_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = toNumber(process.env.NOTIFICATIONS_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000)
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

const validatePayload = (payload: NotificationsQueueMessage | null): payload is NotificationsQueueMessage => {
  if (!payload) return false
  if (!payload.providerId || !payload.corridorId) return false
  if (!payload.signalType) return false
  if (typeof payload.anomaly?.zScore !== 'number') return false
  return true
}

const runWorker = async () => {
  if (queueMode !== 'queue') {
    logger.warn('notifications_worker_disabled', { mode: queueMode })
    return
  }

  if (!queueUrl) {
    logger.warn('notifications_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const lock = new WorkerLock('notifications-queue-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('notifications_worker_skipped', { reason: 'lock_already_held' })
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'notifications-queue-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeBUrl)

  try {
    logger.info('notifications_worker_start', { batch_size: batchSize })
    while (!shutdownRequested) {
      const messages = await receiveJsonMessages<NotificationsQueueMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []

      for (const message of messages) {
        if (!validatePayload(message.payload)) {
          logger.warn('notifications_item_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        // Extend visibility timeout for slow webhook deliveries
        const stopExtending = createVisibilityTimeoutExtender(
          queueUrl!,
          message.receiptHandle,
          () => logger.debug('visibility_extended', { message_id: message.messageId }),
        )

        try {
          await withWorkerRetry(
            () => dispatchQueuedSignal(pool, message.payload),
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

runWorker()
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
