/**
 * Telemetry Analytics Job - aggregates telemetry into silver.telemetry_analytics_aggregate.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend telemetry:analytics
 * ```
 *
 * **Environment Variables**:
 * - `TELEMETRY_ANALYTICS_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 600)
 * - `TELEMETRY_ANALYTICS_LOOKBACK_HOURS`: Lookback window in hours (default: 24)
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.TELEMETRY_ANALYTICS_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const lookbackHours = toNumber(process.env.TELEMETRY_ANALYTICS_LOOKBACK_HOURS, 24)

const logger = createLogger('script.telemetry-analytics')

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let pool: ReturnType<typeof createPool> | null = null

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
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

const getTimeBucket = async () => {
  const result = await query<{ bucket: Date }>(
    `SELECT date_trunc('hour', NOW()) AS bucket`,
    [],
    pool!,
  )
  return result.rows[0].bucket
}

const deleteMetricBucket = async (metricName: string, timeBucket: Date) => {
  await query(
    `DELETE FROM silver.telemetry_analytics_aggregate
     WHERE metric_name = $1 AND time_bucket = $2`,
    [metricName, timeBucket],
    pool!,
  )
}

const insertMetricBucket = async (
  metricName: string,
  metricValue: unknown,
  timeBucket: Date,
  dimensions?: Record<string, unknown>,
) => {
  await query(
    `INSERT INTO silver.telemetry_analytics_aggregate
       (metric_name, metric_value, time_bucket, dimensions)
     VALUES ($1, $2::jsonb, $3, $4::jsonb)`,
    [
      metricName,
      JSON.stringify(metricValue ?? {}),
      timeBucket,
      dimensions ? JSON.stringify(dimensions) : null,
    ],
    pool!,
  )
}

export const runTelemetryAnalyticsJob = async (): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('telemetry-analytics-job', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'telemetry-analytics-job',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  pool = createPool(config.db.planeAUrl)
  const startTime = Date.now()

  try {
    const timeBucket = await getTimeBucket()

    const heatmap = await query<{
      from_country: string
      to_country: string
      search_count: number
    }>(
      `SELECT split_part(corridor_id, '-', 1) AS from_country,
              split_part(corridor_id, '-', 2) AS to_country,
              COUNT(*)::int AS search_count
       FROM silver.telemetry_search_event
       WHERE ts >= NOW() - ($1::text || ' hours')::interval
       GROUP BY 1, 2
       ORDER BY search_count DESC
       LIMIT 200`,
      [String(lookbackHours)],
      pool,
    )

    const popularCorridors = await query<{
      corridor_id: string
      search_count: number
    }>(
      `SELECT corridor_id,
              COUNT(*)::int AS search_count
       FROM silver.telemetry_search_event
       WHERE ts >= NOW() - ($1::text || ' hours')::interval
       GROUP BY corridor_id
       ORDER BY search_count DESC
       LIMIT 100`,
      [String(lookbackHours)],
      pool,
    )

    const providerFavorites = await query<{
      provider_id: string
      corridor_id: string | null
      click_count: number
    }>(
      `SELECT provider_id,
              corridor_id,
              COUNT(*)::int AS click_count
       FROM silver.telemetry_outbound_click
       WHERE ts >= NOW() - ($1::text || ' hours')::interval
       GROUP BY provider_id, corridor_id
       ORDER BY click_count DESC
       LIMIT 200`,
      [String(lookbackHours)],
      pool,
    )

    const engagement = await query<{
      avg_engagement: number | null
      session_count: number
    }>(
      `SELECT AVG(engagement_count)::float AS avg_engagement,
              COUNT(*)::int AS session_count
       FROM silver.telemetry_session
       WHERE last_activity >= NOW() - ($1::text || ' hours')::interval`,
      [String(lookbackHours)],
      pool,
    )

    await query('BEGIN', [], pool)
    try {
      await deleteMetricBucket('heatmap', timeBucket)
      await insertMetricBucket('heatmap', heatmap.rows, timeBucket, { window_hours: lookbackHours })

      await deleteMetricBucket('popular_corridors', timeBucket)
      await insertMetricBucket('popular_corridors', popularCorridors.rows, timeBucket, { window_hours: lookbackHours })

      await deleteMetricBucket('provider_favorites', timeBucket)
      await insertMetricBucket('provider_favorites', providerFavorites.rows, timeBucket, { window_hours: lookbackHours })

      await deleteMetricBucket('engagement', timeBucket)
      await insertMetricBucket(
        'engagement',
        {
          avg_engagement: engagement.rows[0]?.avg_engagement ?? 0,
          session_count: engagement.rows[0]?.session_count ?? 0,
        },
        timeBucket,
        { window_hours: lookbackHours },
      )

      await query('COMMIT', [], pool)
    } catch (error) {
      await query('ROLLBACK', [], pool)
      throw error
    }

    const durationMs = Date.now() - startTime
    logger.info('job_complete', {
      duration_ms: durationMs,
      metrics_written: 4,
      time_bucket: timeBucket.toISOString(),
      window_hours: lookbackHours,
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
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (pool) {
      await pool.end()
    }
  }
}

if (require.main === module) {
  runTelemetryAnalyticsJob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
