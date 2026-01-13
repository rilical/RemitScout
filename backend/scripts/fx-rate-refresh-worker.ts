/**
 * FX Rate Refresh Worker - Processes FX rate refresh requests from the queue.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend fx:rate-refresh-worker
 * ```
 *
 * **Environment Variables**:
 * - `FX_RATE_REFRESH_LIMIT`: Max requests per run (default: 50)
 * - `FX_RATE_REFRESH_CONCURRENCY`: Parallel requests per run (default: 5)
 * - `FX_RATE_REFRESH_MAX_RETRIES`: Max retries for failed requests (default: 3)
 * - `FX_RATE_REFRESH_LOOP`: Set to `1` to keep the worker running
 * - `FX_RATE_REFRESH_LOOP_DELAY_MS`: Delay when work was processed (default: 250)
 * - `FX_RATE_REFRESH_IDLE_DELAY_MS`: Delay when no work was processed (default: 750)
 * - `FX_RATE_REFRESH_LOCK_MODE`: `auto` (default), `single`, or `none`
 */

import { processFxRateRefreshQueue } from '../plane-b/src/fx-rate-refresh'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const limit = toNumber(process.env.FX_RATE_REFRESH_LIMIT, 50)
const maxRetries = toNumber(process.env.FX_RATE_REFRESH_MAX_RETRIES, 3)
const concurrency = toNumber(process.env.FX_RATE_REFRESH_CONCURRENCY, 5)
const logger = createLogger('script.fx-rate-refresh-worker')
const lockTtlSeconds = 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = 30000

const lockModeRaw = (process.env.FX_RATE_REFRESH_LOCK_MODE || 'auto').toLowerCase()
const lockMode =
  lockModeRaw === 'none' || lockModeRaw === 'off'
    ? 'none'
    : lockModeRaw === 'single'
      ? 'single'
      : 'auto'
const queueMode = config.queues.fxRateRefreshMode
const queueUrl = config.queues.fxRateRefreshUrl
const useQueue = queueMode === 'queue' && Boolean(queueUrl)
const useLock = lockMode === 'single' || (lockMode === 'auto' && !useQueue)
const loopEnabled = toBoolean(process.env.FX_RATE_REFRESH_LOOP)
const loopDelayMs = Math.max(50, toNumber(process.env.FX_RATE_REFRESH_LOOP_DELAY_MS, 250))
const idleDelayMs = Math.max(loopDelayMs, toNumber(process.env.FX_RATE_REFRESH_IDLE_DELAY_MS, 750))

let shutdownRequested = false
let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
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

export const runFxRateRefreshWorker = async (): Promise<number> => {
  if (shutdownRequested) {
    logger.info('worker_skipped', { reason: 'shutdown_requested' })
    return 0
  }

  logger.info('worker_lock_mode', {
    lock_mode: lockMode,
    lock_enabled: useLock,
    queue_mode: queueMode,
    queue_url_set: Boolean(queueUrl),
  })

  if (useLock) {
    lock = new WorkerLock('fx-rate-refresh-worker', lockTtlSeconds)
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
            logger.warn('lock_extend_failed', { lock_key: 'fx-rate-refresh-worker' })
          }
        })
        .catch((error) => {
          logger.warn('lock_extend_failed', {
            lock_key: 'fx-rate-refresh-worker',
            error: error instanceof Error ? error.message : String(error),
          })
        })
    }, lockRefreshMs)
  }

  const startTime = Date.now()
  try {
    const count = await processFxRateRefreshQueue({
      limit,
      maxRetries,
      concurrency,
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

const main = async () => {
  let exitCode = 0
  try {
    if (loopEnabled) {
      while (!shutdownRequested) {
        const processed = await runFxRateRefreshWorker()
        if (shutdownRequested) {
          break
        }
        const delayMs = processed > 0 ? loopDelayMs : idleDelayMs
        await sleep(delayMs)
      }
    } else {
      await runFxRateRefreshWorker()
    }
  } catch (error) {
    exitCode = 1
    logger.error('worker_fatal_error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  } finally {
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
  }

  process.exit(exitCode)
}

if (require.main === module) {
  void main()
}
