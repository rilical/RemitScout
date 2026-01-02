/**
 * B2C Refresh Worker - Standalone worker for near-real-time quote refresh processing.
 *
 * This worker processes on-demand B2C quote refresh requests from the queue.
 * Designed to run as a cron job or scheduled task, separate from the main
 * Plane B ingestion loop.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend b2c:refresh-worker
 * ```
 *
 * **Environment Variables**:
 * - `B2C_REFRESH_LIMIT`: Maximum requests to process per run (default: 25)
 * - `PLANE_B_B2C_REFRESH_MAX_RETRIES`: Max retries for failed requests (default: 3)
 * - `B2C_REFRESH_HEALTH_ENABLED`: Set to `0` to disable health/metrics server
 * - `HEALTH_PORT`: Health/metrics port (default: 8080)
 *
 * **Features**:
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Distributed locking (prevents concurrent runs)
 * - Health and metrics endpoints
 * - Queue depth and per-request metrics
 */

import { processQuoteRefreshQueue, type QuoteRefreshQueueEvent } from '../plane-b/src/quote-refresh'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from './b2c-refresh-worker-health'
import { recordRequest, updateQueueDepth } from './b2c-refresh-worker-metrics'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const limit = toNumber(process.env.B2C_REFRESH_LIMIT, config.planeB.b2cRefreshBatchLimit)
const maxRetries = config.planeB.b2cRefreshMaxRetries
const logger = createLogger('script.b2c-refresh-worker')
const lockTtlSeconds = 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = 30000
const healthEnabled = process.env.B2C_REFRESH_HEALTH_ENABLED !== '0'
const healthPort = toNumber(process.env.HEALTH_PORT, 8080)

let shutdownRequested = false
let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let forceExitTimer: ReturnType<typeof setTimeout> | null = null
let healthServer: { close: () => Promise<void> } | null = null

/**
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */
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

const handleRequestFinished = (event: QuoteRefreshQueueEvent) => {
  recordRequest({
    providerId: event.providerId,
    status: event.status,
    durationSeconds: event.durationSeconds,
    skipReason: event.skipReason,
  })
}

const handleQueueDepth = (depth: number) => {
  updateQueueDepth(depth)
}

/**
 * Main worker execution function.
 */
const run = async (): Promise<number> => {
  if (shutdownRequested) {
    logger.info('worker_skipped', { reason: 'shutdown_requested' })
    return 0
  }

  lock = new WorkerLock('b2c-refresh-worker', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('worker_skipped', { reason: 'lock_already_held' })
    return 0
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend()
      .then((extended) => {
        if (!extended && config.redis.url) {
          logger.warn('lock_extend_failed', { lock_key: 'b2c-refresh-worker' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'b2c-refresh-worker',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  const startTime = Date.now()
  try {
    const count = await processQuoteRefreshQueue({
      limit,
      maxRetries,
      onRequestFinished: handleRequestFinished,
      onQueueDepth: handleQueueDepth,
    })
    const durationMs = Date.now() - startTime
    const requestsPerSecond = durationMs > 0 ? count / (durationMs / 1000) : 0

    logger.info('worker_complete', {
      processed_count: count,
      duration_ms: durationMs,
      requests_per_second: requestsPerSecond.toFixed(2),
    })

    return count
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('worker_failed', {
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
  }
}

const closeHealthServer = async () => {
  if (!healthServer) return
  try {
    await healthServer.close()
  } catch (error) {
    logger.warn('health_server_close_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const main = async () => {
  if (healthEnabled) {
    try {
      healthServer = await startHealthServer({ port: healthPort, logger })
    } catch (error) {
      logger.warn('health_server_unavailable', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  let exitCode = 0
  try {
    await run()
  } catch (error) {
    exitCode = 1
    logger.error('worker_fatal_error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  } finally {
    await closeHealthServer()
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
  }

  process.exit(exitCode)
}

void main()
