/**
 * OANDA Rates Sync Job - Fetches exchange rates from OANDA API and stores them in the database.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend oanda:sync-rates
 * ```
 *
 * **Environment Variables**:
 * - `OANDA_USE_AUTHENTICATED_API`: Set to '1' or 'true' to use authenticated API (default: false)
 * - `OANDA_API_KEY`: API key for authenticated OANDA API (required if using authenticated API)
 * - `FX_RATE_OANDA_FALLBACK`: Set to '1' or 'true' to enable fallback fetching in repository (default: false)
 * - `OANDA_SYNC_CURRENCIES`: Comma-separated list of currency codes to sync (e.g., "USD,EUR,GBP")
 * - `OANDA_SYNC_INTERVAL_MINUTES`: How often to sync rates (default: 60)
 *
 * **Features**:
 * - Fetches rates from OANDA public API (scraping) or authenticated API
 * - Stores bid/ask/mid rates in database
 * - Stores historical rates in gold.fx_rate_history
 * - Graceful shutdown
 * - Comprehensive logging + CloudWatch metrics
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { OandaRateFetcher } from '../plane-a/src/services/oanda-rate-fetcher'
import { FxRateHistoryRepository } from '../plane-a/src/repositories/implementations/fx-rate-history-repository'
import { FxRateRepository } from '../plane-a/src/repositories/implementations/fx-rate-repository'
import { fxRateCache, fxRateHistoryCache } from '../shared/repository-cache'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'

const logger = createLogger('script.oanda-rates-sync')
initTracing('oanda-rates-sync')
const environmentDimension = config.envName || config.env || 'development'

const MAJOR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
  'SGD', 'MXN', 'INR', 'BRL', 'ZAR', 'KRW', 'TRY', 'RUB', 'SEK', 'NOK',
  'DKK', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'CZK', 'HUF', 'ILS', 'CLP',
  'ARS', 'COP', 'PEN', 'VND', 'PKR', 'BDT', 'EGP', 'NGN', 'KES', 'UGX',
]

const resolveMaxPairs = (): number | null => {
  const parsed = config.fxRates.syncMaxPairs
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return Math.floor(parsed)
}

const shouldIncludeCapabilityPairs = (): boolean => {
  return config.fxRates.syncIncludeCapability
}

const applyPairLimit = (
  pairs: Array<{ base: string; quote: string }>,
  maxPairs: number | null,
) => {
  if (!maxPairs || maxPairs <= 0) {
    return pairs
  }
  return pairs.slice(0, maxPairs)
}

const dedupePairs = (pairs: Array<{ base: string; quote: string }>) => {
  const seen = new Set<string>()
  const deduped: Array<{ base: string; quote: string }> = []
  for (const pair of pairs) {
    const key = `${pair.base}:${pair.quote}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(pair)
  }
  return deduped
}

const getCurrencyPairsFromEnv = (): Array<{ base: string; quote: string }> => {
  const currencies = config.fxRates.syncCurrencies.length > 0
    ? config.fxRates.syncCurrencies
    : MAJOR_CURRENCIES

  const pairs: Array<{ base: string; quote: string }> = []

  for (let i = 0; i < currencies.length; i++) {
    for (let j = i + 1; j < currencies.length; j++) {
      pairs.push({ base: currencies[i], quote: currencies[j] })
      pairs.push({ base: currencies[j], quote: currencies[i] })
    }
  }

  return pairs
}

const fetchPriorityPairs = async (pool: ReturnType<typeof createPool>) => {
  const pairs: Array<{ base: string; quote: string }> = []

  try {
    const tierResult = await query<{ base_currency: string; quote_currency: string }>(
      `SELECT DISTINCT c.source_currency AS base_currency, c.dest_currency AS quote_currency
       FROM silver.corridor c
       JOIN silver.corridor_tier ct ON ct.corridor_id = c.corridor_id
       WHERE ct.corridor_tier IS NOT NULL`,
      [],
      pool,
    )

    pairs.push(...tierResult.rows.map(row => ({
      base: row.base_currency,
      quote: row.quote_currency,
    })))
  } catch (error) {
    logger.warn('priority_pairs_tier_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  try {
    const popularResult = await query<{ base_currency: string; quote_currency: string }>(
      `SELECT DISTINCT c.source_currency AS base_currency, c.dest_currency AS quote_currency
       FROM gold.popular_corridors pc
       JOIN silver.corridor c
         ON c.source_country = TRIM(split_part(pc.route, CHR(8594), 1))
        AND c.dest_country = TRIM(split_part(pc.route, CHR(8594), 2))`,
      [],
      pool,
    )

    pairs.push(...popularResult.rows.map(row => ({
      base: row.base_currency,
      quote: row.quote_currency,
    })))
  } catch (error) {
    logger.warn('priority_pairs_popular_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return pairs
}

const fetchCapabilityPairs = async (pool: ReturnType<typeof createPool>) => {
  const pairs: Array<{ base: string; quote: string }> = []

  try {
    const corridorPairs = await query<{ base_currency: string; quote_currency: string }>(
      `SELECT DISTINCT c.source_currency AS base_currency, c.dest_currency AS quote_currency
       FROM silver.provider_corridor_capability pcc
       JOIN silver.corridor c ON c.corridor_id = pcc.corridor_id
       WHERE pcc.is_supported = true`,
      [],
      pool,
    )
    pairs.push(...corridorPairs.rows.map(row => ({
      base: row.base_currency,
      quote: row.quote_currency,
    })))

    const currencyRows = await query<{ currency: string }>(
      `SELECT DISTINCT c.source_currency AS currency
       FROM silver.provider_corridor_capability pcc
       JOIN silver.corridor c ON c.corridor_id = pcc.corridor_id
       WHERE pcc.is_supported = true
       UNION
       SELECT DISTINCT c.dest_currency AS currency
       FROM silver.provider_corridor_capability pcc
       JOIN silver.corridor c ON c.corridor_id = pcc.corridor_id
       WHERE pcc.is_supported = true`,
      [],
      pool,
    )
    for (const row of currencyRows.rows) {
      const currency = row.currency?.toUpperCase()
      if (!currency || currency === 'USD') continue
      pairs.push({ base: currency, quote: 'USD' })
      pairs.push({ base: 'USD', quote: currency })
    }
  } catch (error) {
    logger.warn('capability_pairs_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return pairs
}

const buildCurrencyPairs = async (pool: ReturnType<typeof createPool>) => {
  const manualPairs = getCurrencyPairsFromEnv()
  const priorityPairs = await fetchPriorityPairs(pool)
  const capabilityPairs = shouldIncludeCapabilityPairs()
    ? await fetchCapabilityPairs(pool)
    : []

  const pairs: Array<{ base: string; quote: string }> = []

  for (const pair of [...priorityPairs, ...capabilityPairs, ...manualPairs]) {
    if (!pair.base || !pair.quote) continue
    if (pair.base === pair.quote) continue
    pairs.push({ base: pair.base.toUpperCase(), quote: pair.quote.toUpperCase() })
  }

  return dedupePairs(pairs)
}

let pool: ReturnType<typeof createPool> | null = null
let syncInterval: ReturnType<typeof setInterval> | null = null
let isRunning = false

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
    if (pool) {
      await pool.end()
      pool = null
    }
  },
})

const syncRates = async (): Promise<void> => {
  if (isRunning) {
    logger.info('sync_skipped', { reason: 'already_running' })
    return
  }

  if (isShutdownRequested()) {
    logger.info('sync_skipped', { reason: 'shutdown_requested' })
    return
  }

  isRunning = true
  const startTime = Date.now()
  let successCount = 0
  let failureCount = 0

  try {
    if (!pool) {
      pool = createPool(config.db.planeAUrl)
    }

    const useAuthenticatedApi = config.fxRates.useAuthenticatedApi
    const apiKey = config.fxRates.apiKey
    if (useAuthenticatedApi && !apiKey) {
      throw new Error('OANDA_API_KEY is required when OANDA_USE_AUTHENTICATED_API is enabled')
    }
    const fetcher = new OandaRateFetcher(pool, useAuthenticatedApi, apiKey)
    const fxRateRepository = new FxRateRepository(pool)
    const fxRateHistoryRepository = new FxRateHistoryRepository(pool)

    const allPairs = await buildCurrencyPairs(pool)
    const maxPairs = resolveMaxPairs()
    const pairs = applyPairLimit(allPairs, maxPairs)

    logger.info('sync_start', {
      total_pairs: pairs.length,
      total_pairs_before_limit: allPairs.length,
      max_pairs: maxPairs,
      use_authenticated_api: useAuthenticatedApi,
    })

    const concurrency = Math.max(1, config.fxRates.syncConcurrency)
    let index = 0
    const workerCount = Math.min(concurrency, pairs.length)
    const workers = Array.from({ length: workerCount }, async () => {
      while (index < pairs.length) {
        if (isShutdownRequested()) {
          logger.info('sync_interrupted', { reason: 'shutdown_requested' })
          return
        }

        const currentIndex = index
        index += 1
        const { base, quote } = pairs[currentIndex]

        try {
          const result = await fetcher.fetchRate(base, quote, false, { source: 'oanda-sync' })
          if (result.success && result.data) {
            await fxRateRepository.upsertRate({
              baseCurrency: base,
              quoteCurrency: quote,
              rate: result.data.rate,
              bid: result.data.bid,
              ask: result.data.ask,
              source: result.data.source,
              lastUpdated: result.data.last_updated,
            })

            if (result.historical_rates.length > 0) {
              await fxRateHistoryRepository.upsertHistory(
                result.historical_rates.map((row) => ({
                  baseCurrency: base,
                  quoteCurrency: quote,
                  rate: row.rate,
                  bid: row.bid,
                  ask: row.ask,
                  rateDate: row.date,
                  source: result.data?.source ?? 'OANDA',
                })),
              )
            }

            successCount += 1
            logger.debug('rate_synced', {
              base_currency: base,
              quote_currency: quote,
              rate: result.data.rate,
              cached: result.cached,
            })
          } else {
            failureCount += 1
            logger.warn('rate_sync_failed', {
              base_currency: base,
              quote_currency: quote,
              error: result.error,
            })
          }
        } catch (error) {
          failureCount += 1
          logger.error('rate_sync_error', {
            base_currency: base,
            quote_currency: quote,
            error: error instanceof Error ? error.message : String(error),
          })
        } finally {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    })

    await Promise.all(workers)

    await fxRateCache.invalidatePattern('*')
    await fxRateHistoryCache.invalidatePattern('*')

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000

    recordCloudWatchMetric({
      name: 'oanda_sync_duration_seconds',
      value: durationSeconds,
      unit: 'Seconds',
      dimensions: { JobName: 'oanda-sync', environment: environmentDimension },
    })
    recordCloudWatchMetric({
      name: 'oanda_sync_rates_fetched_total',
      value: successCount,
      unit: 'Count',
      dimensions: { JobName: 'oanda-sync', environment: environmentDimension },
    })
    recordCloudWatchMetric({
      name: 'oanda_sync_failures_total',
      value: failureCount,
      unit: 'Count',
      dimensions: { JobName: 'oanda-sync', environment: environmentDimension },
    })

    logger.info('sync_complete', {
      success_count: successCount,
      failure_count: failureCount,
      total_pairs: pairs.length,
      total_pairs_before_limit: allPairs.length,
      max_pairs: maxPairs,
      duration_ms: durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    recordCloudWatchMetric({
      name: 'oanda_sync_failures_total',
      value: 1,
      unit: 'Count',
      dimensions: { JobName: 'oanda-sync', environment: environmentDimension },
    })

    logger.error('sync_failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
    })
  } finally {
    isRunning = false
  }
}

const runContinuousSync = async (): Promise<void> => {
  const intervalMinutes = config.fxRates.syncIntervalMinutes
  const intervalMs = intervalMinutes * 60 * 1000

  logger.info('starting_continuous_sync', {
    interval_minutes: intervalMinutes,
    use_authenticated_api: config.fxRates.useAuthenticatedApi,
  })

  await syncRates()

  syncInterval = setInterval(() => {
    syncRates().catch((error) => {
      logger.error('sync_interval_error', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, intervalMs)
}

if (require.main === module) {
  const runOnce = process.argv.includes('--once')

  if (runOnce) {
    syncRates()
      .then(() => {
        process.exit(0)
      })
      .catch((error) => {
        logger.error('sync_fatal_error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        process.exit(1)
      })
  } else {
    runContinuousSync()
      .catch((error) => {
        logger.error('sync_fatal_error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        process.exit(1)
      })
  }
}

export { syncRates, runContinuousSync }
