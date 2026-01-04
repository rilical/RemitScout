/**
 * Gold FX Rates Batch Job - Aggregates weighted FX rates from recent quotes.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:fx-rates
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_FX_RATES_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 300 = 5 minutes)
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
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { FxRateRepository } from '../plane-b/src/repositories'
import type { FxRateAggregationRow } from '../plane-b/src/repositories/interfaces/fx-rate-repository.interface'
import {
  recordJobStart,
  recordJobComplete,
  recordJobFailure,
} from './gold-fx-rates-job-metrics'
import { startHealthServer } from './gold-fx-rates-job-health'
import { retry } from '../shared/retry'

const toNumber = (value: string | number | null | undefined, fallback: number | null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const isValidCurrency = (value: string) => /^[A-Z]{3}$/.test(value)

const lockTtlSeconds = toNumber(process.env.GOLD_FX_RATES_LOCK_TTL_SECONDS, 300) ?? 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-fx-rates')

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let pool: ReturnType<typeof createPool> | null = null

const { isShutdownRequested } = createShutdownHandler({
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

const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

export const runGoldFxRatesJob = async (
  options: { enableHealthServer?: boolean } = {},
): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  const enableHealthServer =
    options.enableHealthServer ?? !isLambdaRuntime

  if (enableHealthServer) {
    try {
      healthServer = await startHealthServer({ logger })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  lock = new WorkerLock('gold-fx-rates-job', lockTtlSeconds)
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
          logger.warn('lock_extend_failed', { lock_key: 'gold-fx-rates-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-fx-rates-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  pool = createPool(config.db.planeBUrl)
  const repo = new FxRateRepository(pool)
  const startTime = Date.now()
  let rows: FxRateAggregationRow[] = []
  let upserted = 0

  try {
    logger.info('job_start', { lock_ttl_seconds: lockTtlSeconds })
    rows = await retry(
      () => repo.aggregateFxRates(),
      {
        maxRetries: 3,
        initialDelayMs: 500,
        retryable: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error)
          return errorMessage.includes('connection') ||
                 errorMessage.includes('timeout') ||
                 errorMessage.includes('ECONNREFUSED') ||
                 errorMessage.includes('ETIMEDOUT')
        },
      },
    )

    for (const row of rows) {
      const baseCurrency = row.base_currency?.toUpperCase()
      const quoteCurrency = row.quote_currency?.toUpperCase()
      const rate = toNumber(row.rate, null)

      if (!baseCurrency || !quoteCurrency || !isValidCurrency(baseCurrency) || !isValidCurrency(quoteCurrency)) {
        logger.warn('rate_invalid_currency', {
          base_currency: row.base_currency,
          quote_currency: row.quote_currency,
        })
        continue
      }

      if (!rate || rate <= 0) {
        logger.warn('rate_invalid_value', {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          rate: row.rate,
        })
        continue
      }

      try {
        await retry(
          () => repo.upsertRate({
            baseCurrency,
            quoteCurrency,
            rate,
          }),
          {
            maxRetries: 2,
            initialDelayMs: 200,
            retryable: (error) => {
              const errorMessage = error instanceof Error ? error.message : String(error)
              return errorMessage.includes('connection') ||
                     errorMessage.includes('timeout') ||
                     errorMessage.includes('ECONNREFUSED')
            },
          },
        )
        upserted += 1
      } catch (error) {
        logger.error('rate_upsert_failed', {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    logger.info('job_complete', {
      rates_processed: rows.length,
      rates_upserted: upserted,
      duration_ms: durationMs,
    })
    recordJobComplete(durationSeconds, rows.length, upserted)
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('job_failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
    })

    const errorMessage = error instanceof Error ? error.message : String(error)
    let errorType = 'unknown'
    if (errorMessage.includes('lock') || errorMessage.includes('Lock')) {
      errorType = 'lock_failed'
    } else if (errorMessage.includes('query') || errorMessage.includes('SELECT') || errorMessage.includes('aggregate')) {
      errorType = 'query_failed'
    } else if (errorMessage.includes('insert') || errorMessage.includes('INSERT') || errorMessage.includes('upsert') || errorMessage.includes('constraint')) {
      errorType = 'insert_failed'
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      errorType = 'validation_failed'
    }

    recordJobFailure(errorType)
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
  runGoldFxRatesJob()
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
