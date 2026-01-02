/**
 * Gold Publisher Batch Job - Publishes aggregated Silver data to Gold export tables.
 *
 * This job aggregates Silver quote data into Gold export tables after applying
 * publisher gates (N>=3, dominance checks, time bucketing).
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:publisher-job
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_PUBLISHER_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 600 = 10 minutes)
 *
 * **Features**:
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Distributed locking (prevents concurrent runs)
 * - Comprehensive logging with metrics
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { GoldPublisher } from '../plane-c/src/services/gold-publisher'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.GOLD_PUBLISHER_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-publisher-job')

let shutdownRequested = false
let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

const run = async (): Promise<void> => {
  if (shutdownRequested) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('gold-publisher-job', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend()
      .then((extended) => {
        if (!extended && config.redis.url) {
          logger.warn('lock_extend_failed', { lock_key: 'gold-publisher-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-publisher-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeCUrl)
  const publisher = new GoldPublisher(pool)

  const startTime = Date.now()
  try {
    const result = await publisher.processAllCorridors()
    const durationMs = Date.now() - startTime

    logger.info('job_complete', {
      published: result.published,
      withheld: result.withheld,
      errors: result.errors,
      duration_ms: durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('job_failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
    })
    throw error
  } finally {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release()
    }
    await pool.end()
  }
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    logger.error('job_fatal_error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })

