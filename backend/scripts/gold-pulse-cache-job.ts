/**
 * Gold Pulse Cache Batch Job - Populates gold.pulse_cache with aggregated data.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:pulse-cache
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_PULSE_CACHE_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 900 = 15 minutes)
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
import {
  buildPulseCacheKey,
  PULSE_AMOUNTS,
  PULSE_TIMEFRAMES,
  type PulseCacheFilters,
} from '../shared/pulse-cache-keys'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { PulseCacheRepository } from '../plane-b/src/repositories'
import { FxRateHistoryRepository } from '../plane-b/src/repositories'
import {
  recordJobStart,
  recordJobComplete,
  recordJobFailure,
} from './gold-pulse-cache-job-metrics'
import { startHealthServer } from './gold-pulse-cache-job-health'
import { retry } from '../shared/retry'

const toNumber = (value: string | number | null | undefined, fallback: number | null = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const serializeJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null) ?? 'null'
  } catch {
    return JSON.stringify(String(value))
  }
}

const lockTtlSeconds = toNumber(process.env.GOLD_PULSE_CACHE_LOCK_TTL_SECONDS, 900) ?? 900
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-pulse-cache')
initTracing('gold-pulse-cache-job')

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let pool: ReturnType<typeof createPool> | null = null

const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

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

export const runGoldPulseCacheJob = async (
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

  lock = new WorkerLock('gold-pulse-cache-job', lockTtlSeconds)
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
          logger.warn('lock_extend_failed', { lock_key: 'gold-pulse-cache-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-pulse-cache-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  pool = createPool(config.db.planeBUrl)
  const repo = new PulseCacheRepository(pool)
  const fxRateHistoryRepository = new FxRateHistoryRepository(pool)
  const startTime = Date.now()

  try {
    logger.info('job_start', { lock_ttl_seconds: lockTtlSeconds })

    const corridors = await retry(
      () => repo.listPulseCorridors(),
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

    const historyDays = config.fxRates?.historyDays ?? 30
    await Promise.all(
      corridors.map(async (corridor) => {
        if (!corridor.send_currency || !corridor.recv_currency) return
        try {
          await fxRateHistoryRepository.getLatestHistory(
            corridor.send_currency.toUpperCase(),
            corridor.recv_currency.toUpperCase(),
            historyDays,
          )
        } catch (error) {
          logger.warn('fx_rate_history_prefetch_failed', {
            corridor: corridor.corridor,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }),
    )

    const entries = new Map<string, unknown>()

    entries.set('pulse:corridors', corridors)

    const baseFilters: PulseCacheFilters = {
      corridor: null,
      timeframe: '30d',
      amount: 1000,
      payin: 'bank',
      payout: 'bank',
    }

    const filterContexts: PulseCacheFilters[] = [baseFilters]

    for (const corridor of corridors) {
      for (const timeframe of PULSE_TIMEFRAMES) {
        for (const amount of PULSE_AMOUNTS) {
          const methodPairs = await repo.listPulseMethods({
            corridor: corridor.corridor,
            timeframe,
            amount,
          })
          if (methodPairs.length === 0) {
            filterContexts.push({ corridor: corridor.corridor, timeframe, amount })
            continue
          }

          for (const method of methodPairs) {
            filterContexts.push({
              corridor: corridor.corridor,
              timeframe,
              amount,
              payin: method.payin,
              payout: method.payout,
            })
          }
        }
      }
    }

    let filtersProcessed = 0

    for (const filters of filterContexts) {
      const cacheData = await retry(
        () => repo.aggregatePulseCacheData(filters),
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

      for (const [baseKey, payload] of cacheData.entries()) {
        const filteredKey = buildPulseCacheKey(baseKey, filters)
        entries.set(filteredKey, payload)
        if (filters === baseFilters) {
          entries.set(baseKey, payload)
        }
      }

      filtersProcessed += 1
    }

    let upserted = 0
    for (const [key, payload] of entries.entries()) {
      try {
        const payloadJson = serializeJson(payload)
        await retry(
          () => repo.upsertEntry({ key, payload: payloadJson }),
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
        logger.error('pulse_cache_upsert_failed', {
          key,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    logger.info('job_complete', {
      entries_processed: entries.size,
      entries_upserted: upserted,
      filters_processed: filtersProcessed,
      corridors_processed: corridors.length,
      duration_ms: durationMs,
    })
    recordJobComplete(durationSeconds, entries.size, upserted)
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
  runGoldPulseCacheJob()
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
