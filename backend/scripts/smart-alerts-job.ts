import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'

const logger = createLogger('script.smart-alerts-job')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lookbackDays = Math.max(1, toNumber(process.env.SMART_ALERTS_LOOKBACK_DAYS, 60))
const minProviders = Math.max(2, toNumber(process.env.SMART_ALERTS_MIN_PROVIDERS, 2))

const insertSnapshots = async (pool: ReturnType<typeof createPool>) => {
  const result = await query(
    `WITH bucketed AS (
       SELECT
         qr.corridor_id,
         date_trunc('minute', qr.collected_at) AS bucket_ts,
         qr.provider_id,
         qr.implied_fx_rate,
         qr.collected_at,
         ROW_NUMBER() OVER (
           PARTITION BY qr.corridor_id, qr.provider_id, date_trunc('minute', qr.collected_at)
           ORDER BY qr.collected_at DESC
         ) AS rn
       FROM silver.quote_record qr
       WHERE qr.status = 'ok'
         AND qr.implied_fx_rate IS NOT NULL
         AND qr.implied_fx_rate > 0
         AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
     ),
     provider_counts AS (
       SELECT corridor_id, bucket_ts, COUNT(*) AS provider_count
       FROM bucketed
       WHERE rn = 1
       GROUP BY corridor_id, bucket_ts
       HAVING COUNT(*) >= $2
     )
     INSERT INTO silver.rate_snapshots (corridor_id, collected_at)
     SELECT corridor_id, bucket_ts
     FROM provider_counts
     ON CONFLICT (corridor_id, collected_at) DO NOTHING`,
    [lookbackDays, minProviders],
    pool,
  )

  return result.rowCount ?? 0
}

const insertRates = async (pool: ReturnType<typeof createPool>) => {
  const result = await query(
    `WITH bucketed AS (
       SELECT
         qr.corridor_id,
         date_trunc('minute', qr.collected_at) AS bucket_ts,
         qr.provider_id,
         qr.implied_fx_rate,
         qr.collected_at,
         ROW_NUMBER() OVER (
           PARTITION BY qr.corridor_id, qr.provider_id, date_trunc('minute', qr.collected_at)
           ORDER BY qr.collected_at DESC
         ) AS rn
       FROM silver.quote_record qr
       WHERE qr.status = 'ok'
         AND qr.implied_fx_rate IS NOT NULL
         AND qr.implied_fx_rate > 0
         AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
     ),
     provider_counts AS (
       SELECT corridor_id, bucket_ts, COUNT(*) AS provider_count
       FROM bucketed
       WHERE rn = 1
       GROUP BY corridor_id, bucket_ts
       HAVING COUNT(*) >= $2
     ),
     snapshot_ids AS (
       SELECT rs.id, rs.corridor_id, rs.collected_at
       FROM silver.rate_snapshots rs
       JOIN provider_counts pc
         ON pc.corridor_id = rs.corridor_id
        AND pc.bucket_ts = rs.collected_at
     )
     INSERT INTO silver.rates (snapshot_id, corridor_id, provider_name, rate)
     SELECT
       s.id,
       b.corridor_id,
       b.provider_id,
       b.implied_fx_rate::double precision
     FROM bucketed b
     JOIN snapshot_ids s
       ON s.corridor_id = b.corridor_id
      AND s.collected_at = b.bucket_ts
     WHERE b.rn = 1
     ON CONFLICT (snapshot_id, provider_name) DO NOTHING`,
    [lookbackDays, minProviders],
    pool,
  )

  return result.rowCount ?? 0
}

const upsertSignals = async (pool: ReturnType<typeof createPool>) => {
  const result = await query(
    `WITH snapshot_agg AS (
       SELECT
         s.id AS snapshot_id,
         s.corridor_id,
         s.collected_at,
         MAX(r.rate) AS best_rate,
         MIN(r.rate) AS worst_rate,
         AVG(r.rate) AS avg_rate,
         (MAX(r.rate) - MIN(r.rate)) / NULLIF(AVG(r.rate), 0) AS spread_pct,
         (ARRAY_AGG(r.provider_name ORDER BY r.rate DESC, r.created_at DESC))[1] AS best_provider
       FROM silver.rate_snapshots s
       JOIN silver.rates r ON r.snapshot_id = s.id
       WHERE s.collected_at >= NOW() - ($1 * INTERVAL '1 day')
       GROUP BY s.id, s.corridor_id, s.collected_at
     ),
     features AS (
       SELECT
         *,
         AVG(best_rate) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS best_sma20,
         STDDEV_SAMP(best_rate) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS best_sd20,
         COUNT(*) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS n_best,
         AVG(spread_pct) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS spread_sma20,
         STDDEV_SAMP(spread_pct) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS spread_sd20,
         COUNT(*) OVER (
           PARTITION BY corridor_id
           ORDER BY collected_at
           ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
         ) AS n_spread
       FROM snapshot_agg
     ),
     zs AS (
       SELECT
         *,
         CASE
           WHEN n_best < 20 OR best_sd20 IS NULL OR best_sd20 = 0 THEN NULL
           ELSE (best_rate - best_sma20) / best_sd20
         END AS z_rate,
         CASE
           WHEN n_spread < 20 OR spread_sd20 IS NULL OR spread_sd20 = 0 THEN NULL
           ELSE (spread_pct - spread_sma20) / spread_sd20
         END AS z_spread
       FROM features
     ),
     scored AS (
       SELECT
         *,
         CASE
           WHEN z_rate IS NULL THEN 50
           WHEN z_rate <= -2 THEN 0
           WHEN z_rate < 0 THEN ROUND(((z_rate + 2) / 2.0) * 40)
           WHEN z_rate < 1 THEN ROUND(41 + (z_rate * 29))
           WHEN z_rate < 2 THEN ROUND(71 + ((z_rate - 1) * 19))
           ELSE ROUND(91 + ((LEAST(z_rate, 3) - 2) * 9))
         END AS rate_score,
         CASE
           WHEN z_spread IS NULL THEN 0
           WHEN z_spread <= 0 THEN 0
           WHEN z_spread < 1 THEN ROUND(z_spread * 10)
           WHEN z_spread < 2 THEN ROUND(10 + ((z_spread - 1) * 15))
           ELSE ROUND(25 + ((LEAST(z_spread, 3) - 2) * 15))
         END AS risk_penalty
       FROM zs
     ),
     latest AS (
       SELECT DISTINCT ON (corridor_id)
         corridor_id,
         snapshot_id,
         collected_at,
         best_provider,
         best_rate,
         spread_pct,
         z_rate,
         z_spread,
         rate_score,
         risk_penalty,
         GREATEST(0, LEAST(100, (rate_score - risk_penalty)))::int AS send_score,
         (rate_score >= 90 AND risk_penalty <= 10) AS alert_eligible
       FROM scored
       ORDER BY corridor_id, collected_at DESC
     )
     INSERT INTO silver.corridor_signals (
       corridor_id,
       snapshot_id,
       computed_at,
       send_score,
       best_rate,
       best_provider,
       spread_pct,
       z_rate,
       z_spread,
       rate_score,
       risk_penalty,
       alert_eligible,
       algorithm_version
     )
     SELECT
       corridor_id,
       snapshot_id,
       NOW(),
       send_score,
       best_rate,
       best_provider,
       spread_pct,
       z_rate,
       z_spread,
       rate_score,
       risk_penalty,
       alert_eligible,
       1
     FROM latest
     ON CONFLICT (corridor_id) DO UPDATE SET
       snapshot_id = EXCLUDED.snapshot_id,
       computed_at = EXCLUDED.computed_at,
       send_score = EXCLUDED.send_score,
       best_rate = EXCLUDED.best_rate,
       best_provider = EXCLUDED.best_provider,
       spread_pct = EXCLUDED.spread_pct,
       z_rate = EXCLUDED.z_rate,
       z_spread = EXCLUDED.z_spread,
       rate_score = EXCLUDED.rate_score,
       risk_penalty = EXCLUDED.risk_penalty,
       alert_eligible = EXCLUDED.alert_eligible,
       algorithm_version = EXCLUDED.algorithm_version`,
    [lookbackDays],
    pool,
  )

  return result.rowCount ?? 0
}

export const runSmartAlertsJob = async () => {
  const pool = createPool(config.db.planeBUrl)
  try {
    logger.info('job_start', { lookback_days: lookbackDays, min_providers: minProviders })

    const snapshotsInserted = await insertSnapshots(pool)
    const ratesInserted = await insertRates(pool)
    const signalsUpserted = await upsertSignals(pool)

    logger.info('job_complete', {
      snapshots_inserted: snapshotsInserted,
      rates_inserted: ratesInserted,
      signals_upserted: signalsUpserted,
    })

    return { snapshotsInserted, ratesInserted, signalsUpserted }
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runSmartAlertsJob()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('job_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
