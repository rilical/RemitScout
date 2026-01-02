/**
 * Gold Popular Corridors Batch Job - Aggregates recent search and quote data.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:popular-corridors
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_POPULAR_CORRIDORS_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 600 = 10 minutes)
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
import { PopularCorridorRepository } from '../plane-b/src/repositories'

type PopularCorridorRow = {
  route: string
  count_24h: number | string
  top_provider: string | null
  fee_range: string | null
  speed_range: string | null
  best_for: string | null
}

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.GOLD_POPULAR_CORRIDORS_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-popular-corridors')

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
WITH route_searches AS (
  SELECT
    from_country || ' → ' || to_country AS route,
    COUNT(*) AS count_24h,
    MODE() WITHIN GROUP (ORDER BY best_provider_name) AS top_provider
  FROM silver.recent_searches
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY from_country, to_country
),
route_quotes AS (
  SELECT
    c.source_country || ' → ' || c.dest_country AS route,
    MIN(lqp.fee_amount) AS min_fee,
    MAX(lqp.fee_amount) AS max_fee,
    MIN(lqp.delivery_time_min_minutes) AS min_delivery,
    MAX(lqp.delivery_time_max_minutes) AS max_delivery
  FROM silver.latest_quote_by_provider lqp
  JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
  WHERE lqp.status = 'ok'
    AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
  GROUP BY c.source_country, c.dest_country
),
route_providers AS (
  SELECT
    c.source_country || ' → ' || c.dest_country AS route,
    MODE() WITHIN GROUP (ORDER BY p.best_for) AS best_for
  FROM silver.latest_quote_by_provider lqp
  JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
  JOIN silver.providers p ON p.id = lqp.provider_id
  WHERE lqp.status = 'ok'
    AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
  GROUP BY c.source_country, c.dest_country
)
SELECT
  rs.route,
  rs.count_24h,
  rs.top_provider,
  CASE
    WHEN rq.min_fee IS NOT NULL AND rq.max_fee IS NOT NULL
    THEN '$' || ROUND(rq.min_fee::numeric, 2) || ' - $' || ROUND(rq.max_fee::numeric, 2)
    ELSE NULL
  END AS fee_range,
  CASE
    WHEN rq.min_delivery IS NOT NULL AND rq.max_delivery IS NOT NULL
    THEN rq.min_delivery || ' - ' || rq.max_delivery || ' min'
    ELSE NULL
  END AS speed_range,
  rp.best_for
FROM route_searches rs
LEFT JOIN route_quotes rq ON rq.route = rs.route
LEFT JOIN route_providers rp ON rp.route = rs.route
ORDER BY rs.count_24h DESC
LIMIT 100;
`

const run = async (): Promise<void> => {
  if (shutdownRequested) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('gold-popular-corridors-job', lockTtlSeconds)
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
          logger.warn('lock_extend_failed', { lock_key: 'gold-popular-corridors-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-popular-corridors-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  const pool = createPool(config.db.planeBUrl)
  const repo = new PopularCorridorRepository(pool)
  const startTime = Date.now()

  try {
    logger.info('job_start', { lock_ttl_seconds: lockTtlSeconds })
    const result = await query<PopularCorridorRow>(aggregationQuery, [], pool)
    const rows = result.rows
    let inserted = 0

    await repo.clearAll()

    for (const row of rows) {
      try {
        await repo.insertCorridor({
          route: row.route,
          count24h: toNumber(row.count_24h, 0),
          topProvider: row.top_provider ?? null,
          feeRange: row.fee_range ?? null,
          speedRange: row.speed_range ?? null,
          bestFor: row.best_for ?? null,
        })
        inserted += 1
      } catch (error) {
        logger.error('corridor_insert_failed', {
          route: row.route,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const durationMs = Date.now() - startTime
    logger.info('job_complete', {
      corridors_processed: rows.length,
      corridors_inserted: inserted,
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
