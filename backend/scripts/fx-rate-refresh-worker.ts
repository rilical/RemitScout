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
import { startHealthServer } from '../shared/health-server'
import { applyJitter } from '../shared/worker-jitter'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { emitOpsEvent } from '../shared/ops-events'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const limit = config.workers.fxRateRefreshWorker.limit
const maxRetries = config.workers.fxRateRefreshWorker.maxRetries
const concurrency = config.workers.fxRateRefreshWorker.concurrency
const logger = createLogger('script.fx-rate-refresh-worker')
const lockTtlSeconds = 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = 30000

const lockModeRaw = (config.workers.fxRateRefreshWorker.lockMode || 'auto').toLowerCase()
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
const loopEnabled = config.workers.fxRateRefreshWorker.loopEnabled
const loopDelayMs = config.workers.fxRateRefreshWorker.loopDelayMs
const idleDelayMs = Math.max(loopDelayMs, config.workers.fxRateRefreshWorker.idleDelayMs)
const backpressureThreshold = Math.max(
  1,
  config.workers.fxRateRefreshWorker.backpressureThreshold || limit * 5,
)

initTracing('fx-rate-refresh-worker')
initErrorTracking('fx-rate-refresh-worker')
const loopJitterMs = config.workers.fxRateRefreshWorker.loopJitterMs
const healthEnabled = config.workers.health.enabled
const healthPort = config.workers.health.port
const isLambdaRuntime = config.runtime.isLambda

const shutdown = createShutdownHandler({
  name: 'fx-rate-refresh-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
})
const { signal: shutdownSignal } = shutdown

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let fxBackpressureActive = false

const handleQueueDepth = (depth: number) => {
  const active = depth >= backpressureThreshold

  recordCloudWatchMetric({
    name: 'worker_backpressure_active',
    value: active ? 1 : 0,
    unit: 'Count',
    dimensions: {
      worker: 'fx-rate-refresh-worker',
      environment: config.envName || config.env,
    },
  })

  if (active) {
    recordCloudWatchMetric({
      name: 'worker_backpressure',
      value: 1,
      unit: 'Count',
      dimensions: {
        worker: 'fx-rate-refresh-worker',
        reason: 'queue_depth',
        environment: config.envName || config.env,
      },
    })
  }

  if (active && !fxBackpressureActive) {
    logger.warn('worker_backpressure', {
      worker: 'fx-rate-refresh-worker',
      reason: 'queue_depth',
      queue_depth: depth,
      threshold: backpressureThreshold,
    })
    emitOpsEvent({
      type: 'backpressure',
      component: 'fx-rate-refresh-worker',
      details: {
        reason: 'queue_depth',
        queue_depth: depth,
        threshold: backpressureThreshold,
      },
    })
  }

  fxBackpressureActive = active
}

export const runFxRateRefreshWorker = async (): Promise<number> => {
  if (shutdown.isShuttingDown()) {
    logger.info('worker_skipped', { reason: 'shutdown_requested' })
    return 0
  }

  logger.info('worker_lock_mode', {
    lock_mode: lockMode,
    lock_enabled: useLock,
    queue_mode: queueMode,
    queue_url_set: Boolean(queueUrl),
    backpressure_threshold: backpressureThreshold,
  })

  if (useLock) {
    lock = new WorkerLock('fx-rate-refresh-worker', lockTtlSeconds)
    const acquired = await lock.acquireLock(60_000)

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
      onQueueDepth: handleQueueDepth,
      signal: shutdownSignal,
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

export const runFxRateRefreshWorkerLoop = async (): Promise<number> => {
  let exitCode = 0
  try {
    if (!isLambdaRuntime && healthEnabled) {
      try {
        healthServer = await startHealthServer({
          port: healthPort,
          logger,
          loggerName: 'fx-rate-refresh-worker',
          enableDatabaseCheck: true,
          enableRedisCheck: true,
          enableSqsCheck: useQueue,
          sqsQueueUrl: useQueue ? queueUrl : undefined,
        })
      } catch (error) {
        logger.warn('health_server_start_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    if (loopEnabled) {
      while (!shutdown.isShuttingDown()) {
        await applyJitter(logger, 'fx_rate_refresh_loop', loopJitterMs)
        const processed = await runFxRateRefreshWorker()
        if (shutdown.isShuttingDown()) {
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

  return exitCode
}

if (require.main === module) {
  runFxRateRefreshWorkerLoop()
    .then((code) => process.exit(code))
    .catch((error) => {
      logger.error('worker_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
