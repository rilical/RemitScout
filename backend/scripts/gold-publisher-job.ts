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
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { GoldPublisher } from '../plane-c/src/services/gold-publisher'
import {
  recordJobStart,
  recordJobComplete,
  recordJobFailure,
} from './gold-publisher-job-metrics'
import { startHealthServer } from './gold-publisher-job-health'
import { retry } from '../shared/retry'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.GOLD_PUBLISHER_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-publisher-job')
initTracing('gold-publisher-job')

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let pool: ReturnType<typeof createPool> | null = null

const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

const { isShutdownRequested, signal: shutdownSignal } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (pool) {
      await pool.end()
    }
  },
})

export const runGoldPublisherJob = async (
  options: { enableHealthServer?: boolean } = {},
): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  const enableHealthServer = options.enableHealthServer ?? !isLambdaRuntime
  if (enableHealthServer) {
    try {
      healthServer = await startHealthServer({ logger })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  lock = new WorkerLock('gold-publisher-job', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    recordJobFailure('lock_failed')
    return
  }

  recordJobStart()

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

  pool = createPool(config.db.planeCUrl)
  const publisher = new GoldPublisher(pool)

  const startTime = Date.now()
  try {
    await recordBatchJobMetric('gold-publisher-job', 'job_start')
    
    const result = await retry(
      () => publisher.processAllCorridors(),
      {
        maxRetries: 3,
        initialDelayMs: 500,
        maxDelayMs: 10000,
        timeoutMs: 60000,
        operation: 'gold-publisher.process_all_corridors',
        signal: shutdownSignal,
        retryable: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error)
          return errorMessage.includes('connection') ||
                 errorMessage.includes('timeout') ||
                 errorMessage.includes('ECONNREFUSED') ||
                 errorMessage.includes('ETIMEDOUT')
        },
      },
    )
    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000

    logger.info('job_complete', {
      published: result.published,
      withheld: result.withheld,
      errors: result.errors,
      duration_ms: durationMs,
    })
    recordJobComplete(durationSeconds, result.published, result.withheld)
    await recordBatchJobMetric('gold-publisher-job', 'job_complete', durationSeconds, {
      published: String(result.published),
      withheld: String(result.withheld),
      errors: String(result.errors),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    const { message } = formatError(error)
    logger.error('job_failed', {
      error: message,
      duration_ms: durationMs,
    })

    let errorType = 'unknown'
    if (message.includes('lock') || message.includes('Lock')) {
      errorType = 'lock_failed'
    } else if (message.includes('query') || message.includes('SELECT') || message.includes('process')) {
      errorType = 'query_failed'
    } else if (message.includes('insert') || message.includes('INSERT') || message.includes('publish') || message.includes('constraint')) {
      errorType = 'insert_failed'
    } else if (message.includes('validation') || message.includes('invalid')) {
      errorType = 'validation_failed'
    }

    recordJobFailure(errorType)
    await recordBatchJobMetric('gold-publisher-job', 'job_failure', durationSeconds, {
      error_type: errorType,
    })
    throw error
  } finally {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release()
    }
    if (pool && !isShutdownRequested()) {
      await pool.end()
      pool = null
    }
  }
}

if (require.main === module && !isLambdaRuntime) {
  runGoldPublisherJob()
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
}
