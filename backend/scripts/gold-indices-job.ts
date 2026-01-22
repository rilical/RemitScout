/**
 * Gold Indices Batch Job - Computes RCI/RVI aggregates for Gold exports.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:indices
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_INDICES_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 900 = 15 minutes)
 * - `GOLD_INDICES_LOOKBACK_DAYS`: Lookback window for recompute (default: 8 days)
 * - `GOLD_INDICES_AMOUNT_BUCKET`: Amount bucket for exports (default: 500)
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { retry } from '../shared/retry'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'
import { getProviderWeightEntries, PROVIDER_WEIGHTING_MODEL } from '../shared/provider-weights'
import {
  recordJobStart,
  recordJobComplete,
  recordJobFailure,
} from './gold-indices-job-metrics'
import { startHealthServer } from './gold-indices-job-health'

const logger = createLogger('script.gold-indices-job')

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.GOLD_INDICES_LOCK_TTL_SECONDS, 900)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const lookbackDays = Math.max(2, toNumber(process.env.GOLD_INDICES_LOOKBACK_DAYS, 8))
const amountBucket = toNumber(process.env.GOLD_INDICES_AMOUNT_BUCKET, 500)

const providerWeightValues = getProviderWeightEntries()
  .map(([providerId, weight]) => `('${providerId}', ${Number(weight)})`)
  .join(',\n    ')
const providerWeightValuesSql = providerWeightValues.length
  ? providerWeightValues
  : "('__default__', 1)"

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

const indicesUpsertQuery = `
WITH provider_weights AS (
  SELECT *
  FROM (VALUES
    ${providerWeightValuesSql}
  ) AS v(provider_id, weight)
),
base_raw AS (
  SELECT
    qr.corridor_id,
    lower(qr.provider_id) AS provider_id,
    qr.implied_fx_rate::double precision AS implied_fx_rate,
    qr.amount_bucket,
    qr.payin,
    qr.payout,
    qr.send_amount::double precision AS send_amount,
    qr.fee_amount::double precision AS fee_amount,
    qr.collected_at,
    date_trunc('day', qr.collected_at) AS bucket_day,
    CASE
      WHEN qr.payout = 'cash_pickup'
        AND qr.payin IN ('bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash')
        THEN 'cash_pickup'
      WHEN qr.payout = 'bank_deposit' AND qr.payin = 'bank_transfer'
        THEN 'standard_bank'
      WHEN qr.payout = 'bank_deposit'
        AND qr.payin IN ('debit_card', 'credit_card', 'apple_pay', 'google_pay')
        THEN 'standard_card'
      ELSE NULL
    END AS method_profile
  FROM silver.quote_record qr
  JOIN silver.ingestion_run ir
    ON ir.run_id = qr.ingestion_run_id
  JOIN silver.rights_matrix rm
    ON rm.provider_id = qr.provider_id
  JOIN silver.provider_corridor_capability pcc
    ON pcc.provider_id = qr.provider_id
   AND pcc.corridor_id = qr.corridor_id
  WHERE qr.status = 'ok'
    AND qr.implied_fx_rate IS NOT NULL
    AND qr.implied_fx_rate > 0
    AND qr.send_amount IS NOT NULL
    AND qr.send_amount > 0
    AND qr.fee_amount IS NOT NULL
    AND qr.fee_amount >= 0
    AND qr.amount_bucket = $1
    AND qr.collected_at >= NOW() - ($2 * INTERVAL '1 day')
    AND ir.collector_type LIKE 'b2b_%'
    AND ir.status = 'success'
    AND pcc.is_supported = true
    AND rm.allowed_collect = true
    AND rm.allowed_b2b = true
    AND rm.stoplist_status = 'active'
),
base AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY corridor_id,
                   provider_id,
                   amount_bucket,
                   method_profile,
                   bucket_day
      ORDER BY collected_at DESC
    ) AS rn
  FROM base_raw
  WHERE method_profile IS NOT NULL
),
latest AS (
  SELECT *
  FROM base
  WHERE rn = 1
),
daily_best AS (
  SELECT
    corridor_id,
    bucket_day,
    amount_bucket,
    method_profile,
    COUNT(*) AS provider_count,
    MAX(implied_fx_rate)::double precision AS best_rate
  FROM latest
  GROUP BY corridor_id, bucket_day, amount_bucket, method_profile
),
rci_rows AS (
  SELECT
    l.corridor_id,
    l.bucket_day::date AS date,
    l.amount_bucket,
    l.method_profile,
    l.provider_id,
    l.implied_fx_rate,
    b.best_rate,
    b.provider_count,
    CASE
      WHEN b.best_rate IS NULL OR b.best_rate = 0 THEN NULL
      ELSE ((b.best_rate - l.implied_fx_rate) / b.best_rate) * 10000
    END AS rci_bps
  FROM latest l
  JOIN daily_best b
    ON b.corridor_id = l.corridor_id
   AND b.bucket_day = l.bucket_day
   AND b.amount_bucket = l.amount_bucket
   AND b.method_profile = l.method_profile
),
daily_stats AS (
  SELECT
    corridor_id,
    date,
    amount_bucket,
    method_profile,
    provider_count,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY rci_bps)::double precision AS rci_median_bps,
    percentile_cont(0.1) WITHIN GROUP (ORDER BY rci_bps)::double precision AS rci_p10_bps,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY rci_bps)::double precision AS rci_p90_bps,
    (
      percentile_cont(0.9) WITHIN GROUP (ORDER BY rci_bps) -
      percentile_cont(0.1) WITHIN GROUP (ORDER BY rci_bps)
    )::double precision AS dispersion_bps
  FROM rci_rows
  GROUP BY corridor_id, date, amount_bucket, method_profile, provider_count
),
with_volatility AS (
  SELECT
    corridor_id,
    date,
    amount_bucket,
    method_profile,
    provider_count,
    rci_median_bps,
    rci_p10_bps,
    rci_p90_bps,
    dispersion_bps,
    stddev_samp(rci_median_bps) OVER (
      PARTITION BY corridor_id, amount_bucket, method_profile
      ORDER BY date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )::double precision AS volatility_7d
  FROM daily_stats
),
weighted_inputs AS (
  SELECT
    l.corridor_id,
    l.bucket_day::date AS date,
    l.amount_bucket,
    l.method_profile,
    l.provider_id,
    l.send_amount,
    l.fee_amount,
    l.implied_fx_rate,
    COALESCE(fxh.rate, fx.rate)::double precision AS mid_market_rate,
    COALESCE(pw.weight, 1)::double precision AS provider_weight,
    CASE
      WHEN l.send_amount > 0 AND l.implied_fx_rate > 0 AND l.fee_amount >= 0
        THEN ((l.send_amount - l.fee_amount) * l.implied_fx_rate) / l.send_amount
      ELSE NULL
    END AS effective_rate,
    CASE
      WHEN l.send_amount > 0
        AND l.fee_amount >= 0
        AND COALESCE(fxh.rate, fx.rate) IS NOT NULL
        AND COALESCE(fxh.rate, fx.rate) > 0
        AND l.implied_fx_rate > 0
        THEN (
          l.fee_amount +
          ((l.send_amount - l.fee_amount) * (COALESCE(fxh.rate, fx.rate) - l.implied_fx_rate)) /
          COALESCE(fxh.rate, fx.rate)
        ) / l.send_amount
      ELSE NULL
    END AS cost_ratio
  FROM latest l
  JOIN silver.corridor c
    ON c.corridor_id = l.corridor_id
  LEFT JOIN gold.fx_rate_history fxh
    ON fxh.base_currency = c.source_currency
   AND fxh.quote_currency = c.dest_currency
   AND fxh.rate_date = l.bucket_day::date
  LEFT JOIN gold.fx_rates fx
    ON fx.base_currency = c.source_currency
   AND fx.quote_currency = c.dest_currency
  LEFT JOIN provider_weights pw
    ON pw.provider_id = l.provider_id
),
weighted_agg AS (
  SELECT
    corridor_id,
    date,
    amount_bucket,
    method_profile,
    COUNT(*) AS provider_count,
    SUM(provider_weight) AS sum_weight,
    SUM(provider_weight * provider_weight) AS sum_weight_sq,
    SUM(provider_weight * effective_rate) AS weighted_effective_sum,
    SUM(provider_weight * effective_rate * effective_rate) AS weighted_effective_sq_sum,
    SUM(CASE WHEN cost_ratio IS NOT NULL THEN provider_weight ELSE 0 END) AS sum_weight_cost,
    SUM(provider_weight * cost_ratio) AS weighted_cost_sum,
    MAX(mid_market_rate)::double precision AS mid_market_rate
  FROM weighted_inputs
  WHERE effective_rate IS NOT NULL
  GROUP BY corridor_id, date, amount_bucket, method_profile
),
weighted_metrics AS (
  SELECT
    corridor_id,
    date,
    amount_bucket,
    method_profile,
    provider_count,
    mid_market_rate,
    CASE
      WHEN sum_weight_cost > 0 THEN weighted_cost_sum / sum_weight_cost
      ELSE NULL
    END AS rci_ratio,
    CASE
      WHEN sum_weight > 0 AND (sum_weight - (sum_weight_sq / sum_weight)) > 0
        THEN sqrt(
          GREATEST(
            (weighted_effective_sq_sum - (weighted_effective_sum * weighted_effective_sum) / sum_weight) /
            (sum_weight - (sum_weight_sq / sum_weight)),
            0
          )
        )
      ELSE NULL
    END AS rvi_value,
    CASE
      WHEN mid_market_rate IS NOT NULL AND mid_market_rate > 0 AND sum_weight_cost > 0
        THEN mid_market_rate * (1 - (weighted_cost_sum / sum_weight_cost))
      ELSE NULL
    END AS teer_rate,
    '${PROVIDER_WEIGHTING_MODEL}'::text AS weighting_model
  FROM weighted_agg
),
prepared AS (
  SELECT
    wv.corridor_id,
    wv.date,
    wv.amount_bucket,
    wv.method_profile,
    wv.provider_count,
    wv.rci_median_bps,
    wv.rci_p10_bps,
    wv.rci_p90_bps,
    wv.dispersion_bps,
    wv.volatility_7d,
    CASE
      WHEN wv.provider_count >= 10 THEN 10
      WHEN wv.provider_count >= 5 THEN 5
      WHEN wv.provider_count >= 3 THEN 3
      ELSE wv.provider_count
    END AS provider_count_binned,
    CASE
      WHEN wv.provider_count < 3 THEN true
      ELSE false
    END AS suppression_flag,
    CASE
      WHEN wv.provider_count < 3 THEN 'insufficient_providers'
      ELSE NULL
    END AS suppression_reason,
    wm.teer_rate,
    wm.rci_ratio,
    wm.rvi_value,
    wm.mid_market_rate,
    wm.weighting_model
  FROM with_volatility wv
  LEFT JOIN weighted_metrics wm
    ON wm.corridor_id = wv.corridor_id
   AND wm.date = wv.date
   AND wm.amount_bucket = wv.amount_bucket
   AND wm.method_profile = wv.method_profile
),
upserted AS (
  INSERT INTO gold_export.cdp_daily (
    date,
    corridor_id,
    amount_bucket,
    method_profile,
    rci_median_bps,
    rci_p10_bps,
    rci_p90_bps,
    dispersion_bps,
    volatility_7d,
    provider_count,
    provider_count_binned,
    suppression_flag,
    suppression_reason,
    teer_rate,
    rci_ratio,
    rvi_value,
    mid_market_rate,
    weighting_model
  )
  SELECT
    date,
    corridor_id,
    amount_bucket,
    method_profile,
    rci_median_bps,
    rci_p10_bps,
    rci_p90_bps,
    dispersion_bps,
    volatility_7d,
    provider_count,
    provider_count_binned,
    suppression_flag,
    suppression_reason,
    teer_rate,
    rci_ratio,
    rvi_value,
    mid_market_rate,
    weighting_model
  FROM prepared
  ON CONFLICT (date, corridor_id, amount_bucket, method_profile)
  DO UPDATE SET
    rci_median_bps = EXCLUDED.rci_median_bps,
    rci_p10_bps = EXCLUDED.rci_p10_bps,
    rci_p90_bps = EXCLUDED.rci_p90_bps,
    dispersion_bps = EXCLUDED.dispersion_bps,
    volatility_7d = EXCLUDED.volatility_7d,
    provider_count = EXCLUDED.provider_count,
    provider_count_binned = EXCLUDED.provider_count_binned,
    suppression_flag = EXCLUDED.suppression_flag,
    suppression_reason = EXCLUDED.suppression_reason,
    teer_rate = EXCLUDED.teer_rate,
    rci_ratio = EXCLUDED.rci_ratio,
    rvi_value = EXCLUDED.rvi_value,
    mid_market_rate = EXCLUDED.mid_market_rate,
    weighting_model = EXCLUDED.weighting_model
  RETURNING 1
)
SELECT COUNT(*)::int AS upserted
FROM upserted
`

export const runGoldIndicesJob = async (
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

  lock = new WorkerLock('gold-indices-job', lockTtlSeconds)
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
          logger.warn('lock_extend_failed', { lock_key: 'gold-indices-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-indices-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  pool = createPool(config.db.planeCUrl)
  const startTime = Date.now()

  try {
    await recordBatchJobMetric('gold-indices-job', 'job_start')
    const result = await retry(
      () => query<{ upserted: number }>(indicesUpsertQuery, [amountBucket, lookbackDays], pool!),
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
    const upserted = result.rows[0]?.upserted ?? 0
    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000

    logger.info('job_complete', {
      upserted,
      duration_ms: durationMs,
      amount_bucket: amountBucket,
      lookback_days: lookbackDays,
    })
    recordJobComplete(durationSeconds, upserted)
    await recordBatchJobMetric('gold-indices-job', 'job_complete', durationSeconds, {
      upserted: String(upserted),
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
    } else if (message.includes('query') || message.includes('SELECT') || message.includes('aggregate')) {
      errorType = 'query_failed'
    } else if (message.includes('insert') || message.includes('INSERT') || message.includes('constraint')) {
      errorType = 'insert_failed'
    } else if (message.includes('validation') || message.includes('invalid')) {
      errorType = 'validation_failed'
    }

    recordJobFailure(errorType)
    await recordBatchJobMetric('gold-indices-job', 'job_failure', durationSeconds, {
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
  runGoldIndicesJob()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('job_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
