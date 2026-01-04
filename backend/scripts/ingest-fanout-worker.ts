/**
 * Ingest Fanout Worker - SQS consumer for ingestion shard payloads.
 *
 * Runs provider collection tasks from the ingest fanout queue when
 * `PLANE_B_INGEST_FANOUT_QUEUE_MODE=queue` is enabled.
 */

import { setTimeout as sleep } from 'timers/promises'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { deleteMessages, receiveJsonMessages, sendToDLQ, createVisibilityTimeoutExtender } from '../shared/sqs'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { providerRegistry } from '../plane-b/src/providers'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'

type IngestFanoutMessage = {
  providerId: string
  collectorType: string
  corridors: string[]
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  priorityTier?: string
  shardIndex?: number
  requestedAt?: string
}

const logger = createLogger('script.ingest-fanout-worker')
const queueUrl = config.queues.ingestFanout.url
const queueMode = config.queues.ingestFanout.mode

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.INGEST_FANOUT_BATCH_SIZE, 5)
const idleSleepMs = toNumber(process.env.INGEST_FANOUT_IDLE_SLEEP_MS, 1000)
const lockTtlSeconds = toNumber(process.env.INGEST_FANOUT_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = toNumber(process.env.INGEST_FANOUT_SHUTDOWN_TIMEOUT_MS, 30000)
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

const providerById = new Map(providerRegistry.map(provider => [provider.providerId, provider]))

const validatePayload = (payload: IngestFanoutMessage | null): payload is IngestFanoutMessage => {
  if (!payload) return false
  if (!payload.providerId || !payload.collectorType) return false
  if (!payload.payinMethod || !payload.payoutMethod) return false
  if (!Array.isArray(payload.corridors) || payload.corridors.length === 0) return false
  if (!Array.isArray(payload.amountBuckets) || payload.amountBuckets.length === 0) return false
  return true
}

const processMessage = async (
  pool: ReturnType<typeof createPool>,
  message: { messageId: string; receiptHandle: string; payload: IngestFanoutMessage },
): Promise<boolean> => {
  const { payload } = message
  const provider = providerById.get(payload.providerId)
  if (!provider) {
    logger.warn('fanout_provider_missing', { provider_id: payload.providerId })
    return true // Delete invalid messages
  }

  try {
    // Extend visibility timeout for long-running operations
    const stopExtending = createVisibilityTimeoutExtender(
      queueUrl!,
      message.receiptHandle,
      () => logger.debug('visibility_extended', { message_id: message.messageId }),
    )

    try {
      const ok = await withWorkerRetry(
        () => provider.run({
          pool,
          collectorType: payload.collectorType,
          corridors: payload.corridors,
          amountBuckets: payload.amountBuckets,
          payinMethod: payload.payinMethod,
          payoutMethod: payload.payoutMethod,
          freshnessSloMinutes: payload.freshnessSloMinutes,
          freshnessSloEnabled: payload.freshnessSloEnabled,
          rpmOverride: payload.rpmOverride,
          perCorridorRpmOverride: payload.perCorridorRpmOverride,
        }),
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
        },
      )

      stopExtending()
      await recordWorkerMetric('ingest-fanout-worker', 'message_processed', 1)
      logger.info('fanout_item_done', {
        provider_id: payload.providerId,
        collector_type: payload.collectorType,
        corridors: payload.corridors.length,
        priority_tier: payload.priorityTier,
        shard_index: payload.shardIndex ?? null,
        ok,
      })
      return true
    } finally {
      stopExtending()
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('fanout_item_failed', {
      provider_id: payload.providerId,
      collector_type: payload.collectorType,
      error: err.message,
    })
    await recordWorkerMetric('ingest-fanout-worker', 'message_failed', 1)
    
    // Send to DLQ
    await sendToDLQ(queueUrl!, {
      messageId: message.messageId,
      receiptHandle: message.receiptHandle,
      payload: message.payload,
      attributes: {},
      raw: {} as any,
    }, err)
    await recordWorkerMetric('ingest-fanout-worker', 'dlq_sent', 1)
    
    return false
  }
}

const runWorker = async () => {
  if (queueMode !== 'queue') {
    logger.warn('fanout_worker_disabled', { mode: queueMode })
    return
  }

  if (!queueUrl) {
    logger.warn('fanout_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const lock = new WorkerLock('ingest-fanout-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('fanout_worker_skipped', { reason: 'lock_already_held' })
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'ingest-fanout-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeBUrl)

  try {
    logger.info('fanout_worker_start', { batch_size: batchSize })
    while (!shutdownRequested) {
      const messages = await receiveJsonMessages<IngestFanoutMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []

      for (const message of messages) {
        if (!validatePayload(message.payload)) {
          logger.warn('fanout_item_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const processed = await processMessage(pool, message)
        if (processed) {
          deleteHandles.push(message.receiptHandle)
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
    logger.error('fanout_worker_fatal', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
