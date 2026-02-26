/**
 * Gold Indices Live - Real-time indices updates for event-driven Gold updates.
 *
 * Unlike the batch gold-indices-job, this:
 * - Uses separate pools for Silver (reads) and Gold (writes)
 * - Supports corridor-scoped incremental updates
 * - Optimized for low-latency single-corridor refreshes
 */

import type { Pool } from 'pg'
import { query } from '../shared/db'
import { createLogger } from '../shared/logger'
import { normalizeCorridorFilter } from '../shared/corridor'
import {
  DEFAULT_WEIGHT_MODEL,
  GLOBAL_WEIGHT_CORRIDOR_ID,
  INDICES_METHODOLOGY_VERSION,
} from '../shared/weighting-model'

const logger = createLogger('script.gold-indices-live')

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lookbackDays = Math.max(0, toNumber(process.env.GOLD_INDICES_LOOKBACK_DAYS, 8))
const amountBucket = toNumber(process.env.GOLD_INDICES_AMOUNT_BUCKET, 500)
const minProviders = Math.max(1, toNumber(process.env.GOLD_INDICES_MIN_PROVIDERS, 3))
const maxDailyChangeRatio = Math.max(0, toNumber(process.env.GOLD_INDICES_MAX_DAILY_CHANGE_RATIO, 0.5))
const rateRatioMin = Math.max(0, toNumber(process.env.GOLD_INDICES_RATE_RATIO_MIN, 0.5))
const rateRatioMax = Math.max(rateRatioMin, toNumber(process.env.GOLD_INDICES_RATE_RATIO_MAX, 2.0))

const weightModel = process.env.PROVIDER_WEIGHT_MODEL || DEFAULT_WEIGHT_MODEL
const methodologyVersion = process.env.INDICES_METHODOLOGY_VERSION || INDICES_METHODOLOGY_VERSION

const buildIndicesQuery = () => `
WITH weight_snapshot AS (
  SELECT
    corridor_id,
    provider_id,
    weight,
    model_version,
    window_days,
    weight_confidence
  FROM gold.provider_weight_snapshot
  WHERE model_version = '${weightModel}'
),
corridor_weights AS (
  SELECT
    corridor_id,
    provider_id,
    weight,
    window_days,
    weight_confidence
  FROM weight_snapshot
  WHERE corridor_id <> '${GLOBAL_WEIGHT_CORRIDOR_ID}'
),
global_weights AS (
  SELECT
    provider_id,
    weight
  FROM weight_snapshot
  WHERE corridor_id = '${GLOBAL_WEIGHT_CORRIDOR_ID}'
),
weight_meta AS (
  SELECT
    corridor_id,
    MAX(window_days)::int AS window_days,
    MAX(weight_confidence)::double precision AS weight_confidence
  FROM corridor_weights
  GROUP BY corridor_id
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
      WHEN qr.payout = 'mobile_wallet'
        AND qr.payin IN ('bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash')
        THEN 'mobile_wallet'
      WHEN qr.payout = 'airtime'
        AND qr.payin IN ('bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash')
        THEN 'airtime_topup'
      WHEN qr.payout = 'debit_card'
        AND qr.payin IN ('bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay')
        THEN 'card_delivery'
      WHEN qr.payout = 'home_delivery'
        AND qr.payin IN ('bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay', 'cash')
        THEN 'home_delivery'
      ELSE NULL
    END AS method_profile,
    rm.allowed_in_rvi,
    rm.allowed_in_rci,
    rm.allowed_in_teer
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
    AND ($2::int = 0 OR qr.collected_at >= NOW() - ($2 * INTERVAL '1 day'))
    AND ($3::text[] IS NULL OR qr.corridor_id = ANY($3))
    AND ir.collector_type LIKE 'b2b_%'
    AND ir.status = 'success'
    AND pcc.is_supported = true
    AND rm.allowed_collect = true
    AND rm.allowed_b2b = true
    AND rm.allowed_resell_b2b = true
    AND rm.status = 'production'
    AND rm.stoplist_status = 'active'
    AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)
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
  SELECT
    corridor_id,
    provider_id,
    implied_fx_rate,
    amount_bucket,
    payin,
    payout,
    send_amount,
    fee_amount,
    collected_at,
    bucket_day,
    method_profile,
    allowed_in_rvi,
    allowed_in_rci,
    allowed_in_teer,
    rn
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
  WHERE allowed_in_rci = true
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
    l.allowed_in_teer,
    l.allowed_in_rci,
    l.allowed_in_rvi,
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
  WHERE l.allowed_in_rci = true
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
    l.allowed_in_teer,
    l.allowed_in_rci,
    l.allowed_in_rvi,
    l.send_amount,
    l.fee_amount,
    l.implied_fx_rate,
    COALESCE(fxh.rate, fx.rate)::double precision AS mid_market_rate,
    COALESCE(
      CASE
        WHEN cw.weight IS NOT NULL
          AND gw.weight IS NOT NULL
          AND cw.weight_confidence IS NOT NULL
          THEN (cw.weight_confidence * cw.weight) + ((1 - cw.weight_confidence) * gw.weight)
        WHEN cw.weight IS NOT NULL THEN cw.weight
        WHEN gw.weight IS NOT NULL THEN gw.weight
        ELSE NULL
      END,
      1
    )::double precision AS provider_weight,
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
  LEFT JOIN corridor_weights cw
    ON cw.corridor_id = l.corridor_id
   AND cw.provider_id = l.provider_id
  LEFT JOIN global_weights gw
    ON gw.provider_id = l.provider_id
),
weighted_agg AS (
  SELECT
    corridor_id,
    date,
    amount_bucket,
    method_profile,
    COUNT(*) FILTER (WHERE allowed_in_teer) AS provider_count_teer,
    COUNT(*) FILTER (WHERE allowed_in_rci) AS provider_count_rci,
    COUNT(*) FILTER (WHERE allowed_in_rvi) AS provider_count_rvi,
    SUM(CASE WHEN allowed_in_teer THEN provider_weight ELSE 0 END) AS sum_weight_teer,
    SUM(CASE WHEN allowed_in_rci THEN provider_weight ELSE 0 END) AS sum_weight_rci,
    SUM(CASE WHEN allowed_in_rvi THEN provider_weight ELSE 0 END) AS sum_weight_rvi,
    SUM(CASE WHEN allowed_in_rvi THEN provider_weight * provider_weight ELSE 0 END) AS sum_weight_sq_rvi,
    SUM(CASE WHEN allowed_in_rvi THEN provider_weight * effective_rate ELSE 0 END) AS weighted_effective_sum_rvi,
    SUM(CASE WHEN allowed_in_rvi THEN provider_weight * effective_rate * effective_rate ELSE 0 END)
      AS weighted_effective_sq_sum_rvi,
    SUM(CASE WHEN allowed_in_teer AND cost_ratio IS NOT NULL THEN provider_weight ELSE 0 END) AS sum_weight_cost_teer,
    SUM(CASE WHEN allowed_in_teer THEN provider_weight * cost_ratio ELSE 0 END) AS weighted_cost_sum_teer,
    SUM(CASE WHEN allowed_in_rci AND cost_ratio IS NOT NULL THEN provider_weight ELSE 0 END) AS sum_weight_cost_rci,
    SUM(CASE WHEN allowed_in_rci THEN provider_weight * cost_ratio ELSE 0 END) AS weighted_cost_sum_rci,
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
    mid_market_rate,
    CASE
      WHEN sum_weight_cost_rci > 0 THEN weighted_cost_sum_rci / sum_weight_cost_rci
      ELSE NULL
    END AS rci_ratio,
    CASE
      WHEN sum_weight_rvi > 0 AND (sum_weight_rvi - (sum_weight_sq_rvi / sum_weight_rvi)) > 0
        THEN sqrt(
          GREATEST(
            (weighted_effective_sq_sum_rvi - (weighted_effective_sum_rvi * weighted_effective_sum_rvi) / sum_weight_rvi) /
            (sum_weight_rvi - (sum_weight_sq_rvi / sum_weight_rvi)),
            0
          )
        )
      ELSE NULL
    END AS rvi_value,
    CASE
      WHEN mid_market_rate IS NOT NULL AND mid_market_rate > 0 AND sum_weight_cost_teer > 0
        THEN mid_market_rate * (1 - (weighted_cost_sum_teer / sum_weight_cost_teer))
      ELSE NULL
    END AS teer_rate,
    LEAST(
      COALESCE(provider_count_teer, 0),
      COALESCE(provider_count_rci, 0),
      COALESCE(provider_count_rvi, 0)
    )::int AS provider_count,
    '${weightModel}'::text AS weighting_model
  FROM weighted_agg
),
prepared_base AS (
  SELECT
    wv.corridor_id,
    wv.date,
    wv.amount_bucket,
    wv.method_profile,
    COALESCE(wm.provider_count, wv.provider_count) AS provider_count,
    wv.rci_median_bps,
    wv.rci_p10_bps,
    wv.rci_p90_bps,
    wv.dispersion_bps,
    wv.volatility_7d,
    CASE
      WHEN COALESCE(wm.provider_count, wv.provider_count) >= 10 THEN 10
      WHEN COALESCE(wm.provider_count, wv.provider_count) >= 5 THEN 5
      WHEN COALESCE(wm.provider_count, wv.provider_count) >= 3 THEN 3
      ELSE COALESCE(wm.provider_count, wv.provider_count)
    END AS provider_count_binned,
    wm.teer_rate,
    wm.rci_ratio,
    wm.rvi_value,
    wm.mid_market_rate,
    wm.weighting_model,
    wmeta.weight_confidence,
    wmeta.window_days,
    '${methodologyVersion}'::text AS methodology_version
  FROM with_volatility wv
  LEFT JOIN weighted_metrics wm
    ON wm.corridor_id = wv.corridor_id
   AND wm.date = wv.date
   AND wm.amount_bucket = wv.amount_bucket
   AND wm.method_profile = wv.method_profile
  LEFT JOIN weight_meta wmeta
    ON wmeta.corridor_id = wv.corridor_id
)
,
prepared_with_prev AS (
  SELECT
    *,
    LAG(teer_rate) OVER (
      PARTITION BY corridor_id, amount_bucket, method_profile
      ORDER BY date
    ) AS prev_teer_rate
  FROM prepared_base
),
prepared AS (
  SELECT
    *,
    CASE
      WHEN teer_rate IS NOT NULL
        AND prev_teer_rate IS NOT NULL
        AND prev_teer_rate > 0
        AND abs(teer_rate - prev_teer_rate) / prev_teer_rate > $5
        THEN true
      WHEN teer_rate IS NOT NULL
        AND mid_market_rate IS NOT NULL
        AND mid_market_rate > 0
        AND (teer_rate / mid_market_rate < $6 OR teer_rate / mid_market_rate > $7)
        THEN true
      ELSE false
    END AS is_outlier
  FROM prepared_with_prev
),
final AS (
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
    volatility_7d,
    provider_count_binned,
    CASE
      WHEN provider_count < $4 THEN true
      WHEN is_outlier THEN true
      ELSE false
    END AS suppression_flag,
    CASE
      WHEN provider_count < $4 THEN 'insufficient_providers'
      WHEN is_outlier THEN 'rate_inversion_or_outlier'
      ELSE NULL
    END AS suppression_reason,
    teer_rate,
    rci_ratio,
    CASE
      WHEN provider_count < $4 THEN NULL
      WHEN is_outlier THEN NULL
      WHEN teer_rate IS NULL OR teer_rate <= 0 THEN NULL
      WHEN rvi_value IS NULL THEN NULL
      ELSE (rvi_value / teer_rate) * 10000
    END AS rvi_bps,
    mid_market_rate,
    weighting_model,
    weight_confidence,
    window_days AS weight_window_days,
    methodology_version
  FROM prepared
)
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
  volatility_7d,
  provider_count_binned,
  suppression_flag,
  suppression_reason,
  teer_rate,
  rci_ratio,
  rvi_bps,
  mid_market_rate,
  weighting_model,
  weight_confidence,
  weight_window_days,
  methodology_version
FROM final
`

const upsertQuery = `
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
  rvi_bps,
  mid_market_rate,
  weighting_model,
  weight_confidence,
  weight_window_days,
  methodology_version
)
SELECT
  date,
  corridor_id,
  amount_bucket,
  method_profile::method_profile,
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
  rvi_bps,
  mid_market_rate,
  weighting_model,
  weight_confidence,
  weight_window_days,
  methodology_version
FROM unnest(
  $1::date[],
  $2::text[],
  $3::int[],
  $4::text[],
  $5::double precision[],
  $6::double precision[],
  $7::double precision[],
  $8::double precision[],
  $9::double precision[],
  $10::int[],
  $11::int[],
  $12::boolean[],
  $13::text[],
  $14::double precision[],
  $15::double precision[],
  $16::double precision[],
  $17::double precision[],
  $18::text[],
  $19::double precision[],
  $20::int[],
  $21::text[]
) AS t(
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
  rvi_bps,
  mid_market_rate,
  weighting_model,
  weight_confidence,
  weight_window_days,
  methodology_version
)
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
  rvi_bps = EXCLUDED.rvi_bps,
  mid_market_rate = EXCLUDED.mid_market_rate,
  weighting_model = EXCLUDED.weighting_model,
  weight_confidence = EXCLUDED.weight_confidence,
  weight_window_days = EXCLUDED.weight_window_days,
  methodology_version = EXCLUDED.methodology_version
RETURNING 1
`

type IndicesRow = {
  corridor_id: string
  date: Date
  amount_bucket: number
  method_profile: string
  provider_count: number
  rci_median_bps: number | null
  rci_p10_bps: number | null
  rci_p90_bps: number | null
  dispersion_bps: number | null
  volatility_7d: number | null
  provider_count_binned: number
  suppression_flag: boolean
  suppression_reason: string | null
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  mid_market_rate: number | null
  weighting_model: string
  weight_confidence: number | null
  weight_window_days: number | null
  methodology_version: string | null
}

export const upsertGoldIndicesLive = async (
  silverPool: Pool,
  goldPool: Pool,
  options: {
    amountBucket?: number
    lookbackDays?: number
    corridorIds?: string[]
  } = {},
): Promise<number> => {
  const corridorFilter = normalizeCorridorFilter(options.corridorIds)
  const targetBucket = options.amountBucket ?? amountBucket
  const targetLookbackDays = options.lookbackDays ?? lookbackDays

  const selectQuery = buildIndicesQuery()
  const params = [
    targetBucket,
    targetLookbackDays,
    corridorFilter,
    minProviders,
    maxDailyChangeRatio,
    rateRatioMin,
    rateRatioMax,
  ]

  const selectResult = await query<IndicesRow>(selectQuery, params, silverPool)

  if (selectResult.rows.length === 0) {
    logger.debug('gold_indices_live_no_data', {
      corridor_count: corridorFilter?.length ?? 0,
    })
    return 0
  }

  const dates: Date[] = []
  const corridorIds: string[] = []
  const amountBuckets: number[] = []
  const methodProfiles: string[] = []
  const rciMedianBps: (number | null)[] = []
  const rciP10Bps: (number | null)[] = []
  const rciP90Bps: (number | null)[] = []
  const dispersionBps: (number | null)[] = []
  const volatility7d: (number | null)[] = []
  const providerCounts: number[] = []
  const providerCountBinned: number[] = []
  const suppressionFlags: boolean[] = []
  const suppressionReasons: (string | null)[] = []
  const teerRates: (number | null)[] = []
  const rciRatios: (number | null)[] = []
  const rviBpsValues: (number | null)[] = []
  const midMarketRates: (number | null)[] = []
  const weightingModels: string[] = []
  const weightConfidences: (number | null)[] = []
  const weightWindowDays: (number | null)[] = []
  const methodologyVersions: (string | null)[] = []

  for (const row of selectResult.rows) {
    dates.push(row.date)
    corridorIds.push(row.corridor_id)
    amountBuckets.push(row.amount_bucket)
    methodProfiles.push(row.method_profile)
    rciMedianBps.push(row.rci_median_bps)
    rciP10Bps.push(row.rci_p10_bps)
    rciP90Bps.push(row.rci_p90_bps)
    dispersionBps.push(row.dispersion_bps)
    volatility7d.push(row.volatility_7d)
    providerCounts.push(row.provider_count)
    providerCountBinned.push(row.provider_count_binned)
    suppressionFlags.push(row.suppression_flag)
    suppressionReasons.push(row.suppression_reason)
    teerRates.push(row.teer_rate)
    rciRatios.push(row.rci_ratio)
    rviBpsValues.push(row.rvi_bps)
    midMarketRates.push(row.mid_market_rate)
    weightingModels.push(row.weighting_model)
    weightConfidences.push(row.weight_confidence ?? null)
    weightWindowDays.push(row.weight_window_days ?? null)
    methodologyVersions.push(row.methodology_version ?? null)
  }

  const upsertResult = await query<{ count: number }>(
    upsertQuery,
    [
      dates,
      corridorIds,
      amountBuckets,
      methodProfiles,
      rciMedianBps,
      rciP10Bps,
      rciP90Bps,
      dispersionBps,
      volatility7d,
      providerCounts,
      providerCountBinned,
      suppressionFlags,
      suppressionReasons,
      teerRates,
      rciRatios,
      rviBpsValues,
      midMarketRates,
      weightingModels,
      weightConfidences,
      weightWindowDays,
      methodologyVersions,
    ],
    goldPool,
  )

  const upserted = upsertResult.rowCount ?? 0
  logger.debug('gold_indices_live_upserted', {
    upserted,
    corridor_count: corridorFilter?.length ?? 0,
  })

  return upserted
}
