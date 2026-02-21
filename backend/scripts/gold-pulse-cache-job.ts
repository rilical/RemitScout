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
  PULSE_NARRATIVE_BASE_KEY,
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
import { recordBatchJobMetric } from '../shared/worker-metrics'

const logger = createLogger('script.gold-pulse-cache')
initTracing('gold-pulse-cache-job')

const toNumber = (value: string | number | null | undefined, fallback: number | null = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const serializeJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null) ?? 'null'
  } catch (error) {
    logger.debug('pulse_cache_json_serialize_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return JSON.stringify(String(value))
  }
}

const formatCorridorLabel = (slug: string | null | undefined) => {
  if (!slug) return 'this corridor'
  const parts = slug.split('-').map((part) => part.trim().toUpperCase()).filter(Boolean)
  if (parts.length !== 2) return 'this corridor'
  return `${parts[0]}→${parts[1]}`
}

const buildNarrativeSummary = (
  filters: PulseCacheFilters,
  cacheData: Map<string, unknown>,
) => {
  const corridorLabel = formatCorridorLabel(filters.corridor)
  const nowIso = new Date().toISOString()

  const costTrendRaw = cacheData.get('pulse:cost-trend')
  const costTrend = Array.isArray(costTrendRaw)
    ? costTrendRaw.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    : []

  const smartSendRaw = cacheData.get('pulse:smart-send')
  const smartSend = (smartSendRaw && typeof smartSendRaw === 'object')
    ? smartSendRaw as Record<string, unknown>
    : null

  const providerHeatmapRaw = cacheData.get('pulse:provider-heatmap')
  const providerHeatmap = (providerHeatmapRaw && typeof providerHeatmapRaw === 'object')
    ? providerHeatmapRaw as Record<string, unknown>
    : null

  const summaryFallback = {
    summary: `${corridorLabel} pricing is being tracked. Live quote coverage is limited right now, so timing confidence is moderate.`,
    generatedAt: nowIso,
    source: 'rule_based',
  }

  if (costTrend.length === 0) {
    return summaryFallback
  }

  const latestPoint = costTrend[costTrend.length - 1]
  const firstPoint = costTrend[0]

  const latestCost = toNumber((latestPoint as any)?.bestProviderCost, null)
  const firstCost = toNumber((firstPoint as any)?.bestProviderCost, null)
  const latestProvider = typeof (latestPoint as any)?.bestProvider === 'string'
    ? String((latestPoint as any).bestProvider)
    : null

  let trendPhrase = 'is broadly stable'
  if (latestCost !== null && firstCost !== null && firstCost > 0) {
    const changePct = ((latestCost - firstCost) / firstCost) * 100
    if (changePct <= -2) trendPhrase = `has tightened ${Math.abs(changePct).toFixed(1)}% over the selected window`
    else if (changePct >= 2) trendPhrase = `has widened ${changePct.toFixed(1)}% over the selected window`
  }

  let leaderPhrase = latestProvider ? `${latestProvider} is currently leading` : 'leader rotation is active'
  const providerStats = providerHeatmap && typeof providerHeatmap.providerStats === 'object' && providerHeatmap.providerStats
    ? providerHeatmap.providerStats as Record<string, { wins?: string | number | null }>
    : {}
  let dominantProvider: string | null = null
  let dominantWins = 0
  for (const [provider, stats] of Object.entries(providerStats)) {
    const wins = toNumber(stats?.wins ?? null, 0) ?? 0
    if (wins > dominantWins) {
      dominantWins = wins
      dominantProvider = provider
    }
  }
  if (dominantProvider && dominantWins > 0) {
    leaderPhrase = `${dominantProvider} led ${dominantWins} day${dominantWins === 1 ? '' : 's'}`
  }

  let volatilityPhrase = 'volatility is moderate'
  const smartLevel = typeof smartSend?.level === 'string' ? smartSend.level : null
  if (smartLevel === 'great' || smartLevel === 'good') {
    volatilityPhrase = 'pricing conditions are favorable'
  } else if (smartLevel === 'wait') {
    volatilityPhrase = 'short-term volatility remains elevated'
  }

  return {
    summary: `${corridorLabel} pricing ${trendPhrase}. ${leaderPhrase}, and ${volatilityPhrase}.`,
    generatedAt: nowIso,
    source: 'rule_based',
  }
}

const runConcurrent = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> => {
  if (items.length === 0) return
  let nextIndex = 0
  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  const workers = Array.from({ length: workerCount }, async () => {
    for (;;) {
      const i = nextIndex++
      if (i >= items.length) return
      await worker(items[i]!)
    }
  })
  await Promise.all(workers)
}

const lockTtlSeconds = toNumber(process.env.GOLD_PULSE_CACHE_LOCK_TTL_SECONDS, 900) ?? 900
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const jobConcurrency = Math.max(1, Math.min(25, toNumber(process.env.GOLD_PULSE_CACHE_CONCURRENCY, 5) ?? 5))

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
    await recordBatchJobMetric('gold-pulse-cache-job', 'job_failure', 0, {
      reason: 'lock_failed',
    })
    return
  }

  recordJobStart()
  await recordBatchJobMetric('gold-pulse-cache-job', 'job_start')

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
        maxDelayMs: 10000,
        timeoutMs: 60000,
        operation: 'gold-pulse-cache.list_corridors',
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

    const combos: Array<{ corridor: string; timeframe: PulseCacheFilters['timeframe']; amount: number }> = []
    for (const corridor of corridors) {
      for (const timeframe of PULSE_TIMEFRAMES) {
        for (const amount of PULSE_AMOUNTS) {
          combos.push({ corridor: corridor.corridor, timeframe, amount })
        }
      }
    }

    // Batch method discovery with a concurrency cap to avoid corridor×timeframe×amount sequential latency.
    await runConcurrent(combos, jobConcurrency, async (combo) => {
      const methodPairs = await repo.listPulseMethods({
        corridor: combo.corridor,
        timeframe: combo.timeframe,
        amount: combo.amount,
      })
      if (methodPairs.length === 0) {
        filterContexts.push({ corridor: combo.corridor, timeframe: combo.timeframe, amount: combo.amount })
        return
      }
      for (const method of methodPairs) {
        filterContexts.push({
          corridor: combo.corridor,
          timeframe: combo.timeframe,
          amount: combo.amount,
          payin: method.payin,
          payout: method.payout,
        })
      }
    })

    let filtersProcessed = 0

    // Batch aggregation with a concurrency cap to avoid sequential corridor×filters latency.
    await runConcurrent(filterContexts, jobConcurrency, async (filters) => {
      const cacheData = await retry(
        () => repo.aggregatePulseCacheData(filters),
        {
          maxRetries: 3,
          initialDelayMs: 500,
          maxDelayMs: 10000,
          timeoutMs: 60000,
          operation: 'gold-pulse-cache.aggregate',
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

      for (const [baseKey, payload] of cacheData.entries()) {
        const filteredKey = buildPulseCacheKey(baseKey, filters)
        entries.set(filteredKey, payload)
        if (filters === baseFilters) {
          entries.set(baseKey, payload)
        }
      }

      if (filters.corridor) {
        const narrativePayload = buildNarrativeSummary(filters, cacheData)
        const narrativeKey = buildPulseCacheKey(PULSE_NARRATIVE_BASE_KEY, filters)
        entries.set(narrativeKey, narrativePayload)
      }

      filtersProcessed += 1
    })

    let upserted = 0
    const upsertEntries = [...entries.entries()]
    await runConcurrent(upsertEntries, jobConcurrency, async ([key, payload]) => {
      try {
        const payloadJson = serializeJson(payload)
        await retry(
          () => repo.upsertEntry({ key, payload: payloadJson }),
          {
            maxRetries: 2,
            initialDelayMs: 200,
            maxDelayMs: 10000,
            timeoutMs: 60000,
            operation: 'gold-pulse-cache.upsert_entry',
            signal: shutdownSignal,
            retryable: (error) => {
              const errorMessage = error instanceof Error ? error.message : String(error)
              return errorMessage.includes('connection')
                || errorMessage.includes('timeout')
                || errorMessage.includes('ECONNREFUSED')
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
    })

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
    await recordBatchJobMetric('gold-pulse-cache-job', 'job_complete', durationSeconds, {
      entries_processed: String(entries.size),
      entries_upserted: String(upserted),
      filters_processed: String(filtersProcessed),
      corridors_processed: String(corridors.length),
    })
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
    await recordBatchJobMetric('gold-pulse-cache-job', 'job_failure', durationMs / 1000, {
      reason: errorType,
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
