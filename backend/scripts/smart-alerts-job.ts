import { setTimeout as sleep } from 'timers/promises'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { initErrorTracking } from '../shared/error-tracker'

const logger = createLogger('script.smart-alerts-job')
initTracing('smart-alerts-job')
initErrorTracking('smart-alerts-job')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lookbackDays = Math.max(7, toNumber(process.env.SMART_ALERTS_LOOKBACK_DAYS, 42))
const minProviders = Math.max(2, toNumber(process.env.SMART_ALERTS_MIN_PROVIDERS, 2))
const minSampleDays = Math.min(
  lookbackDays,
  Math.max(1, toNumber(process.env.SMART_ALERTS_MIN_SAMPLE_DAYS, 21)),
)
const minConfidence = Math.max(1, toNumber(process.env.SMART_ALERTS_MIN_CONFIDENCE, 70))
const weeklySendHour = Math.min(23, Math.max(0, toNumber(process.env.SMART_ALERTS_WEEKLY_SEND_HOUR, 9)))
const jitterMs = Math.max(0, toNumber(process.env.SMART_ALERTS_JITTER_MS, 0))
const lockTtlSeconds = Math.max(60, toNumber(process.env.SMART_ALERTS_LOCK_TTL_SECONDS, 900))
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null

const insertSnapshots = async (pool: ReturnType<typeof createPool>) => {
  const result = await query(
    `WITH bucketed AS (
       SELECT
         qr.corridor_id,
         date_trunc('day', qr.collected_at) AS bucket_day,
         qr.provider_id,
         qr.implied_fx_rate,
         qr.collected_at,
         ROW_NUMBER() OVER (
           PARTITION BY qr.corridor_id, qr.provider_id, date_trunc('day', qr.collected_at)
           ORDER BY qr.collected_at DESC
         ) AS rn
       FROM silver.quote_record qr
       WHERE qr.status = 'ok'
         AND qr.implied_fx_rate IS NOT NULL
         AND qr.implied_fx_rate > 0
         AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
     ),
     provider_counts AS (
       SELECT corridor_id, bucket_day, COUNT(*) AS provider_count
       FROM bucketed
       WHERE rn = 1
       GROUP BY corridor_id, bucket_day
       HAVING COUNT(*) >= $2
     )
     INSERT INTO silver.rate_snapshots (corridor_id, collected_at)
     SELECT corridor_id, bucket_day
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
         date_trunc('day', qr.collected_at) AS bucket_day,
         qr.provider_id,
         qr.implied_fx_rate,
         qr.collected_at,
         ROW_NUMBER() OVER (
           PARTITION BY qr.corridor_id, qr.provider_id, date_trunc('day', qr.collected_at)
           ORDER BY qr.collected_at DESC
         ) AS rn
       FROM silver.quote_record qr
       WHERE qr.status = 'ok'
         AND qr.implied_fx_rate IS NOT NULL
         AND qr.implied_fx_rate > 0
         AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
     ),
     provider_counts AS (
       SELECT corridor_id, bucket_day, COUNT(*) AS provider_count
       FROM bucketed
       WHERE rn = 1
       GROUP BY corridor_id, bucket_day
       HAVING COUNT(*) >= $2
     ),
     snapshot_ids AS (
       SELECT rs.id, rs.corridor_id, rs.collected_at
       FROM silver.rate_snapshots rs
       JOIN provider_counts pc
         ON pc.corridor_id = rs.corridor_id
        AND pc.bucket_day = rs.collected_at
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
      AND s.collected_at = b.bucket_day
     WHERE b.rn = 1
     ON CONFLICT (snapshot_id, provider_name) DO NOTHING`,
    [lookbackDays, minProviders],
    pool,
  )

  return result.rowCount ?? 0
}

const upsertSignals = async (pool: ReturnType<typeof createPool>) => {
  const result = await query(
    `WITH daily_provider AS (
       SELECT
         qr.corridor_id,
         date_trunc('day', qr.collected_at) AS day_bucket,
         qr.provider_id,
         qr.implied_fx_rate,
         qr.collected_at,
         ROW_NUMBER() OVER (
           PARTITION BY qr.corridor_id, qr.provider_id, date_trunc('day', qr.collected_at)
           ORDER BY qr.collected_at DESC
         ) AS rn
       FROM silver.quote_record qr
       WHERE qr.status = 'ok'
         AND qr.implied_fx_rate IS NOT NULL
         AND qr.implied_fx_rate > 0
         AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
     ),
     filtered_provider AS (
       SELECT
         corridor_id,
         day_bucket,
         provider_id,
         implied_fx_rate,
         collected_at,
         rn
       FROM daily_provider
       WHERE rn = 1
     ),
     daily_corridor AS (
       SELECT
         corridor_id,
         day_bucket,
         COUNT(*) AS provider_count,
         MAX(implied_fx_rate)::double precision AS best_rate,
         MIN(implied_fx_rate)::double precision AS worst_rate,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY implied_fx_rate)::double precision AS median_rate,
         (ARRAY_AGG(provider_id ORDER BY implied_fx_rate DESC, collected_at DESC))[1] AS best_provider
       FROM filtered_provider
       GROUP BY corridor_id, day_bucket
       HAVING COUNT(*) >= $2
     ),
     latest_daily AS (
       SELECT DISTINCT ON (corridor_id)
         corridor_id,
         day_bucket,
         best_rate,
         best_provider,
         worst_rate,
         median_rate,
         (best_rate - worst_rate) / NULLIF(median_rate, 0) AS spread_pct
       FROM daily_corridor
       ORDER BY corridor_id, day_bucket DESC
     ),
     corridor_stats AS (
       SELECT
         corridor_id,
         AVG(median_rate) AS avg_rate,
         STDDEV_SAMP(median_rate) AS sd_rate,
         AVG((best_rate - worst_rate) / NULLIF(median_rate, 0)) AS avg_spread,
         STDDEV_SAMP((best_rate - worst_rate) / NULLIF(median_rate, 0)) AS sd_spread,
         COUNT(*) AS sample_days
       FROM daily_corridor
       GROUP BY corridor_id
     ),
     scored AS (
       SELECT
         l.corridor_id,
         l.day_bucket,
         l.best_rate,
         l.best_provider,
         l.spread_pct,
         l.median_rate,
         cs.avg_rate,
         cs.sd_rate,
         cs.avg_spread,
         cs.sd_spread,
         cs.sample_days,
         CASE
           WHEN cs.sd_rate IS NULL OR cs.sd_rate = 0 THEN NULL
           ELSE (l.median_rate - cs.avg_rate) / cs.sd_rate
         END AS z_rate,
         CASE
           WHEN cs.sd_spread IS NULL OR cs.sd_spread = 0 THEN NULL
           ELSE (l.spread_pct - cs.avg_spread) / cs.sd_spread
         END AS z_spread
       FROM latest_daily l
       JOIN corridor_stats cs ON cs.corridor_id = l.corridor_id
     ),
     scores AS (
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
       FROM scored
     ),
     dow_stats AS (
       SELECT
         corridor_id,
         EXTRACT(ISODOW FROM day_bucket) AS dow,
         AVG(median_rate) AS avg_rate,
         COUNT(*) AS dow_days
       FROM daily_corridor
       GROUP BY corridor_id, dow
     ),
     best_dow AS (
       SELECT DISTINCT ON (corridor_id)
         corridor_id,
         dow,
         avg_rate,
         dow_days
       FROM dow_stats
       ORDER BY corridor_id, avg_rate DESC, dow_days DESC, dow ASC
     ),
     window_base AS (
       SELECT
         s.corridor_id,
         s.day_bucket,
         s.best_rate,
         s.best_provider,
         s.spread_pct,
         s.z_rate,
         s.z_spread,
         s.rate_score,
         s.risk_penalty,
         GREATEST(0, LEAST(100, (s.rate_score - s.risk_penalty)))::int AS send_score,
         s.sample_days,
         ROUND(LEAST(100, (s.sample_days::numeric / $1) * 100))::int AS confidence,
         bd.dow AS best_dow,
         bd.avg_rate AS best_avg_rate,
         cs.avg_rate AS overall_avg_rate
       FROM scores s
       JOIN corridor_stats cs ON cs.corridor_id = s.corridor_id
       JOIN best_dow bd ON bd.corridor_id = s.corridor_id
     ),
     window_calc AS (
       SELECT
         *,
         ((best_dow - EXTRACT(ISODOW FROM (NOW() AT TIME ZONE 'UTC')) + 7) % 7) AS days_ahead
       FROM window_base
     ),
     window_times AS (
       SELECT
         *,
         date_trunc('day', NOW() AT TIME ZONE 'UTC')
           + (days_ahead || ' days')::interval
           + ($5 || ' hours')::interval AS candidate_start
       FROM window_calc
     ),
     windowed AS (
       SELECT
         corridor_id,
         day_bucket,
         best_rate,
         best_provider,
         spread_pct,
         z_rate,
         z_spread,
         rate_score,
         risk_penalty,
         send_score,
         sample_days,
         confidence,
         CASE
           WHEN candidate_start + INTERVAL '1 day' < (NOW() AT TIME ZONE 'UTC')
             THEN candidate_start + INTERVAL '7 days'
           ELSE candidate_start
         END AS best_window_start,
         CASE
           WHEN candidate_start + INTERVAL '1 day' < (NOW() AT TIME ZONE 'UTC')
             THEN candidate_start + INTERVAL '8 days'
           ELSE candidate_start + INTERVAL '1 day'
         END AS best_window_end,
         (confidence >= $3 AND sample_days >= $4 AND best_avg_rate > overall_avg_rate) AS alert_eligible
       FROM window_times
     ),
     snapshot_ids AS (
       SELECT w.corridor_id, w.day_bucket, rs.id AS snapshot_id
       FROM windowed w
       JOIN silver.rate_snapshots rs
         ON rs.corridor_id = w.corridor_id
        AND rs.collected_at = w.day_bucket
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
       algorithm_version,
       best_window_start,
       best_window_end,
       confidence,
       sample_days
     )
     SELECT
       w.corridor_id,
       s.snapshot_id,
       NOW(),
       w.send_score,
       w.best_rate,
       w.best_provider,
       w.spread_pct,
       w.z_rate,
       w.z_spread,
       w.rate_score,
       w.risk_penalty,
       w.alert_eligible,
       2,
       w.best_window_start,
       w.best_window_end,
       w.confidence,
       w.sample_days
     FROM windowed w
     JOIN snapshot_ids s
       ON s.corridor_id = w.corridor_id
      AND s.day_bucket = w.day_bucket
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
       algorithm_version = EXCLUDED.algorithm_version,
       best_window_start = EXCLUDED.best_window_start,
       best_window_end = EXCLUDED.best_window_end,
       confidence = EXCLUDED.confidence,
       sample_days = EXCLUDED.sample_days`,
    [lookbackDays, minProviders, minConfidence, minSampleDays, weeklySendHour],
    pool,
  )

  return result.rowCount ?? 0
}

export const runSmartAlertsJob = async () => {
  if (jitterMs > 0) {
    const delayMs = Math.floor(Math.random() * jitterMs)
    if (delayMs > 0) {
      logger.info('job_jitter', { delay_ms: delayMs })
      await sleep(delayMs)
    }
  }

  lock = new WorkerLock('smart-alerts-job', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return { skipped: true }
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend()
      .then((extended) => {
        if (!extended && config.redis.url) {
          logger.warn('lock_extend_failed', { lock_key: 'smart-alerts-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'smart-alerts-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeBUrl)
  const jobStartTime = Date.now()
  try {
    await recordBatchJobMetric('smart-alerts-job', 'job_start')
    logger.info('job_start', {
      lookback_days: lookbackDays,
      min_providers: minProviders,
      min_sample_days: minSampleDays,
      min_confidence: minConfidence,
      weekly_send_hour: weeklySendHour,
    })

    const snapshotsInserted = await insertSnapshots(pool)
    const ratesInserted = await insertRates(pool)
    const signalsUpserted = await upsertSignals(pool)

    const durationSeconds = (Date.now() - jobStartTime) / 1000
    await recordBatchJobMetric('smart-alerts-job', 'job_complete', durationSeconds)
    logger.info('job_complete', {
      snapshots_inserted: snapshotsInserted,
      rates_inserted: ratesInserted,
      signals_upserted: signalsUpserted,
      duration_seconds: durationSeconds,
    })

    return { snapshotsInserted, ratesInserted, signalsUpserted }
  } catch (error: unknown) {
    const durationSeconds = (Date.now() - jobStartTime) / 1000
    await recordBatchJobMetric('smart-alerts-job', 'job_failure', durationSeconds)
    throw error
  } finally {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
      lockRefreshTimer = null
    }
    if (lock) {
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', {
          lock_key: 'smart-alerts-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
      lock = null
    }
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
