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
 * - `B2C_REFRESH_LIMIT`: Maximum requests to process per run (default: 50)
 * - `B2C_REFRESH_CONCURRENCY`: Parallel requests to process per run (default: 5)
 * - `PLANE_B_B2C_REFRESH_MAX_RETRIES`: Max retries for failed requests (default: 3)
 * - `B2C_REFRESH_LOOP`: Set to `1` to keep the worker running continuously
 * - `B2C_REFRESH_LOOP_DELAY_MS`: Delay between runs when work was processed (default: 250)
 * - `B2C_REFRESH_IDLE_DELAY_MS`: Delay between runs when no work was processed (default: 750)
 * - `B2C_REFRESH_HEALTH_ENABLED`: Set to `0` to disable health/metrics server
 * - `HEALTH_PORT`: Health/metrics port (default: 8080)
 *
 * **Features**:
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Distributed locking (prevents concurrent runs)
 * - Health and metrics endpoints
 * - Queue depth and per-request metrics
 */

import type { QuoteRefreshQueueEvent } from '../plane-b/src/quote-refresh'
import type { WorkerLock as WorkerLockType } from '../plane-b/src/lib/worker-lock'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { applyJitter } from '../shared/worker-jitter'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing } from '../shared/tracing'
import { startHealthServer } from '../shared/health-server'
import { createShutdownHandler } from '../shared/shutdown'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { emitOpsEvent } from '../shared/ops-events'
import { getMetrics, metricsContentType } from './b2c-refresh-worker-metrics'
import { recordRequest, updateQueueDepth } from './b2c-refresh-worker-metrics'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

initErrorTracking('b2c-refresh-worker')
initTracing('b2c-refresh-worker')

const loadPlaneBDeps = async () => {
  try {
    const [quoteRefresh, workerLock] = await Promise.all([
      import('../plane-b/src/quote-refresh'),
      import('../plane-b/src/lib/worker-lock'),
    ])
    return {
      processQuoteRefreshQueue: quoteRefresh.processQuoteRefreshQueue,
      WorkerLock: workerLock.WorkerLock,
    }
  } catch (error) {
    logger.warn('plane_b_dist_import_fallback', {
      error: error instanceof Error ? error.message : String(error),
    })
    const distQuoteRefreshPath = '../plane-b/quote-refresh'
    const distWorkerLockPath = '../plane-b/lib/worker-lock'
    const [quoteRefresh, workerLock] = await Promise.all([
      import(distQuoteRefreshPath),
      import(distWorkerLockPath),
    ])
    return {
      processQuoteRefreshQueue: quoteRefresh.processQuoteRefreshQueue,
      WorkerLock: workerLock.WorkerLock,
    }
  }
}

const limit = config.workers.b2cRefreshWorker.limit
const maxRetries = config.planeB.b2cRefreshMaxRetries
const concurrency = config.workers.b2cRefreshWorker.concurrency
const logger = createLogger('script.b2c-refresh-worker')
const lockTtlSeconds = 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const shutdownTimeoutMs = 30000
const healthEnabled = config.workers.b2cRefreshWorker.healthEnabled
const healthPort = config.workers.health.port

const isLambdaRuntime = config.runtime.isLambda
const lockModeRaw = (config.workers.b2cRefreshWorker.lockMode || 'auto').toLowerCase()
const lockMode =
  lockModeRaw === 'none' || lockModeRaw === 'off'
    ? 'none'
    : lockModeRaw === 'single'
      ? 'single'
      : 'auto'
const queueMode = config.queues.quoteRefreshMode
const queueUrl = config.queues.quoteRefreshUrl
const useQueue = queueMode === 'queue' && Boolean(queueUrl)
const useLock = lockMode === 'single' || (lockMode === 'auto' && !useQueue)
const loopEnabled = config.workers.b2cRefreshWorker.loopEnabled
const loopDelayMs = config.workers.b2cRefreshWorker.loopDelayMs
const idleDelayMs = Math.max(loopDelayMs, config.workers.b2cRefreshWorker.idleDelayMs)
const loopJitterMs = config.workers.b2cRefreshWorker.loopJitterMs
const backpressureThreshold = Math.max(
  1,
  config.workers.b2cRefreshWorker.backpressureThreshold || limit * 5,
)

const shutdown = createShutdownHandler({
  name: 'b2c-refresh-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
})
const { signal: shutdownSignal } = shutdown

let lock: WorkerLockType | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let b2cBackpressureActive = false

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
  const active = depth >= backpressureThreshold

  recordCloudWatchMetric({
    name: 'worker_backpressure_active',
    value: active ? 1 : 0,
    unit: 'Count',
    dimensions: {
      worker: 'b2c-refresh-worker',
      environment: config.envName || config.env,
    },
  })

  if (active) {
    recordCloudWatchMetric({
      name: 'worker_backpressure',
      value: 1,
      unit: 'Count',
      dimensions: {
        worker: 'b2c-refresh-worker',
        reason: 'queue_depth',
        environment: config.envName || config.env,
      },
    })
  }

  if (active && !b2cBackpressureActive) {
    logger.warn('worker_backpressure', {
      worker: 'b2c-refresh-worker',
      reason: 'queue_depth',
      queue_depth: depth,
      threshold: backpressureThreshold,
    })
    emitOpsEvent({
      type: 'backpressure',
      component: 'b2c-refresh-worker',
      details: {
        reason: 'queue_depth',
        queue_depth: depth,
        threshold: backpressureThreshold,
      },
    })
  }

  b2cBackpressureActive = active
}

/**
 * Main worker execution function.
 */
export const runB2cRefreshWorker = async (): Promise<number> => {
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

  const { processQuoteRefreshQueue, WorkerLock } = await loadPlaneBDeps()

  if (useLock) {
    const localLock = new WorkerLock('b2c-refresh-worker', lockTtlSeconds)
    lock = localLock
    const acquired = await localLock.acquireLock(60_000)

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
  }

  const startTime = Date.now()
  try {
    const count = await processQuoteRefreshQueue({
      limit,
      maxRetries,
      concurrency,
      onRequestFinished: handleRequestFinished,
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

export const runB2cRefreshWorkerLoop = async (
  options: { enableHealthServer?: boolean } = {},
): Promise<number> => {
  const enableHealthServer = options.enableHealthServer ?? (!isLambdaRuntime && healthEnabled)
  if (enableHealthServer) {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'b2c-refresh-worker',
        getMetrics,
        metricsContentType,
        enableDatabaseCheck: true,
        enableRedisCheck: true,
        enableSqsCheck: useQueue,
        sqsQueueUrl: useQueue ? queueUrl : undefined,
      })
    } catch (error) {
      logger.warn('health_server_unavailable', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  let exitCode = 0
  try {
    if (loopEnabled) {
      while (!shutdown.isShuttingDown()) {
        await applyJitter(logger, 'b2c_refresh_loop', loopJitterMs)
        const processed = await runB2cRefreshWorker()
        if (shutdown.isShuttingDown()) {
          break
        }
        const delayMs = processed > 0 ? loopDelayMs : idleDelayMs
        await sleep(delayMs)
      }
    } else {
      await runB2cRefreshWorker()
    }
  } catch (error) {
    exitCode = 1
    logger.error('worker_fatal_error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  } finally {
    await closeHealthServer()
    if (shutdown.isShuttingDown()) {
      await shutdown.shutdown('shutdown_requested')
    }
  }

  return exitCode
}

if (require.main === module && !isLambdaRuntime) {
  runB2cRefreshWorkerLoop()
    .then(code => process.exit(code))
    .catch((error) => {
      logger.error('worker_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
