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

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { FxRateRepository } from '../plane-b/src/repositories'

type FxRateRow = {
  base_currency: string
  quote_currency: string
  rate: number | string | null
  provider_count: number | string
  sample_count: number | string
}

const toNumber = (value: string | number | null | undefined, fallback: number | null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const isValidCurrency = (value: string) => /^[A-Z]{3}$/.test(value)

const lockTtlSeconds = toNumber(process.env.GOLD_FX_RATES_LOCK_TTL_SECONDS, 300) ?? 300
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-fx-rates')

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

const aggregationQuery = `
WITH weighted_rates AS (
  SELECT
    c.source_currency AS base_currency,
    c.dest_currency AS quote_currency,
    lqp.implied_fx_rate,
    lqp.send_amount,
    lqp.provider_id,
    CASE
      WHEN ct.corridor_tier = 'tier_1' THEN 1
      WHEN ct.corridor_tier = 'tier_2' THEN 4
      ELSE 24
    END AS freshness_hours
  FROM silver.latest_quote_by_provider lqp
  JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
  LEFT JOIN silver.corridor_tier ct ON ct.corridor_id = lqp.corridor_id
  JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
  WHERE lqp.status = 'ok'
    AND rm.allowed_b2c = true
    AND rm.stoplist_status = 'active'
    AND lqp.collected_at >= NOW() - INTERVAL '1 hour' * COALESCE(
      CASE
        WHEN ct.corridor_tier = 'tier_1' THEN 1
        WHEN ct.corridor_tier = 'tier_2' THEN 4
        ELSE 24
      END,
      4
    )
),
aggregated AS (
  SELECT
    base_currency,
    quote_currency,
    SUM(implied_fx_rate * send_amount) / NULLIF(SUM(send_amount), 0) AS weighted_avg_rate,
    COUNT(*) AS sample_count,
    COUNT(DISTINCT provider_id) AS provider_count
  FROM weighted_rates
  GROUP BY base_currency, quote_currency
  HAVING COUNT(DISTINCT provider_id) >= 3
)
SELECT
  base_currency,
  quote_currency,
  weighted_avg_rate AS rate,
  provider_count,
  sample_count
FROM aggregated
WHERE weighted_avg_rate > 0
ORDER BY base_currency, quote_currency;
`

const run = async (): Promise<void> => {
  if (shutdownRequested) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('gold-fx-rates-job', lockTtlSeconds)
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

  const pool = createPool(config.db.planeBUrl)
  const repo = new FxRateRepository(pool)
  const startTime = Date.now()

  try {
    logger.info('job_start', { lock_ttl_seconds: lockTtlSeconds })
    const result = await query<FxRateRow>(aggregationQuery, [], pool)
    const rows = result.rows
    let upserted = 0

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
        await repo.upsertRate({
          baseCurrency,
          quoteCurrency,
          rate,
        })
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
    logger.info('job_complete', {
      rates_processed: rows.length,
      rates_upserted: upserted,
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
