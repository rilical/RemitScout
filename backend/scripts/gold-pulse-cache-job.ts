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

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { buildChartData, pulseDefaults } from '../shared/pulse-defaults'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { PulseCacheRepository } from '../plane-b/src/repositories'

type PulseQueryResult = {
  key: string
  payload?: unknown
  error?: Error
}

type PulseQueryTask = {
  key: string
  sql: string
  format: (rows: any[]) => unknown
}

const toNumber = (value: string | number | null | undefined, fallback: number | null = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
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

const queryTasks: PulseQueryTask[] = [
  {
    key: 'pulse:corridors',
    sql: `
      SELECT
        c.corridor_id,
        c.source_country AS from_country,
        c.dest_country AS to_country,
        c.source_currency AS send_currency,
        c.dest_currency AS recv_currency,
        COUNT(DISTINCT lqp.provider_id) AS provider_count,
        MAX(lqp.collected_at) AS last_updated
      FROM silver.corridor c
      LEFT JOIN silver.latest_quote_by_provider lqp
        ON lqp.corridor_id = c.corridor_id
       AND lqp.status = 'ok'
      GROUP BY c.corridor_id, c.source_country, c.dest_country, c.source_currency, c.dest_currency
      HAVING COUNT(DISTINCT lqp.provider_id) >= 1
      ORDER BY last_updated DESC NULLS LAST;
    `,
    format: (rows) =>
      rows.map((row) => ({
        corridor_id: row.corridor_id,
        from_country: row.from_country,
        to_country: row.to_country,
        send_currency: row.send_currency,
        recv_currency: row.recv_currency,
        provider_count: toNumber(row.provider_count, 0),
        last_updated: toIsoString(row.last_updated),
      })),
  },
  {
    key: 'pulse:overview',
    sql: `
      SELECT
        COUNT(DISTINCT c.corridor_id) AS total_corridors,
        COUNT(DISTINCT lqp.provider_id) AS active_providers,
        COUNT(DISTINCT lqp.corridor_id) AS corridors_with_quotes,
        AVG(EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60) AS avg_freshness_minutes
      FROM silver.corridor c
      LEFT JOIN silver.latest_quote_by_provider lqp
        ON lqp.corridor_id = c.corridor_id
       AND lqp.status = 'ok'
       AND lqp.collected_at >= NOW() - INTERVAL '24 hours';
    `,
    format: (rows) => {
      const row = rows[0] ?? {}
      return {
        total_corridors: toNumber(row.total_corridors, 0),
        active_providers: toNumber(row.active_providers, 0),
        corridors_with_quotes: toNumber(row.corridors_with_quotes, 0),
        avg_freshness_minutes: toNumber(row.avg_freshness_minutes, null),
      }
    },
  },
  {
    key: 'pulse:method-coverage',
    sql: `
      SELECT
        lqp.payin AS payin_method,
        lqp.payout AS payout_method,
        COUNT(*) AS quote_count,
        COUNT(DISTINCT lqp.corridor_id) AS corridor_count
      FROM silver.latest_quote_by_provider lqp
      WHERE lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
      GROUP BY lqp.payin, lqp.payout
      ORDER BY quote_count DESC;
    `,
    format: (rows) =>
      rows.map((row) => ({
        payin_method: row.payin_method,
        payout_method: row.payout_method,
        quote_count: toNumber(row.quote_count, 0),
        corridor_count: toNumber(row.corridor_count, 0),
      })),
  },
  {
    key: 'pulse:table',
    sql: `
      SELECT
        c.corridor_id,
        c.corridor_id AS corridor_label,
        COUNT(DISTINCT lqp.provider_id) AS provider_count,
        AVG(lqp.implied_fx_rate) AS avg_rate,
        MIN(lqp.fee_amount) AS min_fee,
        MAX(lqp.fee_amount) AS max_fee
      FROM silver.corridor c
      JOIN silver.latest_quote_by_provider lqp ON lqp.corridor_id = c.corridor_id
      WHERE lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
      GROUP BY c.corridor_id
      HAVING COUNT(DISTINCT lqp.provider_id) >= 2
      ORDER BY provider_count DESC, avg_rate DESC;
    `,
    format: (rows) =>
      rows.map((row) => ({
        corridor_id: row.corridor_id,
        corridor_label: row.corridor_label,
        provider_count: toNumber(row.provider_count, 0),
        avg_rate: toNumber(row.avg_rate, null),
        min_fee: toNumber(row.min_fee, null),
        max_fee: toNumber(row.max_fee, null),
      })),
  },
  {
    key: 'pulse:hero',
    sql: `
      SELECT
        COUNT(DISTINCT lqp.corridor_id) AS active_corridors,
        COUNT(DISTINCT lqp.provider_id) AS active_providers,
        SUM(lqp.send_amount) AS total_volume_24h,
        AVG(lqp.implied_fx_rate) AS global_avg_rate
      FROM silver.latest_quote_by_provider lqp
      WHERE lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - INTERVAL '24 hours';
    `,
    format: (rows) => {
      const row = rows[0] ?? {}
      return {
        active_corridors: toNumber(row.active_corridors, 0),
        active_providers: toNumber(row.active_providers, 0),
        total_volume_24h: toNumber(row.total_volume_24h, null),
        global_avg_rate: toNumber(row.global_avg_rate, null),
      }
    },
  },
  {
    key: 'pulse:coverage-summary',
    sql: `
      SELECT
        COUNT(DISTINCT c.corridor_id) AS total_corridors,
        COUNT(DISTINCT CASE WHEN lqp.provider_id IS NOT NULL THEN c.corridor_id END) AS covered_corridors,
        ROUND(
          100.0 * COUNT(DISTINCT CASE WHEN lqp.provider_id IS NOT NULL THEN c.corridor_id END) /
          NULLIF(COUNT(DISTINCT c.corridor_id), 0),
          2
        ) AS coverage_percentage
      FROM silver.corridor c
      LEFT JOIN silver.latest_quote_by_provider lqp
        ON lqp.corridor_id = c.corridor_id
       AND lqp.status = 'ok'
       AND lqp.collected_at >= NOW() - INTERVAL '24 hours';
    `,
    format: (rows) => {
      const row = rows[0] ?? {}
      return {
        total_corridors: toNumber(row.total_corridors, 0),
        covered_corridors: toNumber(row.covered_corridors, 0),
        coverage_percentage: toNumber(row.coverage_percentage, null),
      }
    },
  },
  {
    key: 'pulse:snapshot-summary',
    sql: `
      SELECT
        COUNT(*) AS total_quotes,
        COUNT(DISTINCT corridor_id) AS unique_corridors,
        COUNT(DISTINCT provider_id) AS unique_providers,
        MIN(collected_at) AS oldest_quote,
        MAX(collected_at) AS newest_quote
      FROM silver.latest_quote_by_provider
      WHERE status = 'ok'
        AND collected_at >= NOW() - INTERVAL '1 hour';
    `,
    format: (rows) => {
      const row = rows[0] ?? {}
      return {
        total_quotes: toNumber(row.total_quotes, 0),
        unique_corridors: toNumber(row.unique_corridors, 0),
        unique_providers: toNumber(row.unique_providers, 0),
        oldest_quote: toIsoString(row.oldest_quote),
        newest_quote: toIsoString(row.newest_quote),
      }
    },
  },
  {
    key: 'pulse:provider-benchmarking',
    sql: `
      SELECT
        lqp.provider_id,
        p.display_name AS provider_name,
        COUNT(*) AS quote_count,
        AVG(lqp.implied_fx_rate) AS avg_rate,
        AVG(lqp.fee_amount) AS avg_fee,
        AVG(EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60) AS avg_freshness_minutes
      FROM silver.latest_quote_by_provider lqp
      JOIN silver.provider p ON p.provider_id = lqp.provider_id
      WHERE lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
      GROUP BY lqp.provider_id, p.display_name
      HAVING COUNT(*) >= 10
      ORDER BY quote_count DESC;
    `,
    format: (rows) =>
      rows.map((row) => ({
        provider_id: row.provider_id,
        provider_name: row.provider_name,
        quote_count: toNumber(row.quote_count, 0),
        avg_rate: toNumber(row.avg_rate, null),
        avg_fee: toNumber(row.avg_fee, null),
        avg_freshness_minutes: toNumber(row.avg_freshness_minutes, null),
      })),
  },
  {
    key: 'pulse:events',
    sql: `
      SELECT
        alert_id AS id,
        provider_id,
        corridor_id,
        block_reason,
        http_status,
        created_at
      FROM silver.ops_alert_event
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 100;
    `,
    format: (rows) =>
      rows.map((row) => ({
        id: row.id,
        provider_id: row.provider_id,
        corridor_id: row.corridor_id,
        block_reason: row.block_reason,
        http_status: toNumber(row.http_status, null),
        created_at: toIsoString(row.created_at),
      })),
  },
  {
    key: 'pulse:provider-heatmap',
    sql: `
      SELECT
        c.source_country AS from_country,
        c.dest_country AS to_country,
        lqp.provider_id,
        COUNT(*) AS quote_count
      FROM silver.latest_quote_by_provider lqp
      JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
      WHERE lqp.status = 'ok'
        AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
      GROUP BY c.source_country, c.dest_country, lqp.provider_id
      ORDER BY quote_count DESC;
    `,
    format: (rows) =>
      rows.map((row) => ({
        from_country: row.from_country,
        to_country: row.to_country,
        provider_id: row.provider_id,
        quote_count: toNumber(row.quote_count, 0),
      })),
  },
]

const buildDefaultEntries = () => {
  return {
    'pulse:smart-send': pulseDefaults.smartSend,
    'pulse:market-snapshot': pulseDefaults.marketSnapshot,
    'pulse:true-cost': pulseDefaults.trueCost,
    'pulse:market-depth': pulseDefaults.marketDepth,
    'pulse:arbitrage': pulseDefaults.arbitrage,
    'pulse:bank-comparison': pulseDefaults.bankComparison,
    'pulse:cost-trend': pulseDefaults.costTrend,
  }
}

const run = async (): Promise<void> => {
  if (shutdownRequested) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('gold-pulse-cache-job', lockTtlSeconds)
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

  const pool = createPool(config.db.planeBUrl)
  const repo = new PulseCacheRepository(pool)
  const startTime = Date.now()

  try {
    logger.info('job_start', { lock_ttl_seconds: lockTtlSeconds })

    const queryResults = await Promise.all(
      queryTasks.map(async (task): Promise<PulseQueryResult> => {
        try {
          const result = await query(task.sql, [], pool)
          return { key: task.key, payload: task.format(result.rows) }
        } catch (error) {
          return { key: task.key, error: error as Error }
        }
      }),
    )

    const chartIds = ['all-in-cost', 'fx-markup', 'provider-winner', 'volatility-pulse', 'quote-success', 'market-depth']
    const chartEntries = chartIds.map((chartId) => ({
      key: `pulse:chart:${chartId}`,
      payload: buildChartData(chartId),
    }))

    const defaultEntries = buildDefaultEntries()
    const entries: Array<{ key: string; payload: unknown }> = []

    for (const result of queryResults) {
      if (result.error) {
        logger.error('pulse_query_failed', {
          key: result.key,
          error: result.error instanceof Error ? result.error.message : String(result.error),
        })
        continue
      }
      entries.push({ key: result.key, payload: result.payload })
    }

    for (const [key, payload] of Object.entries(defaultEntries)) {
      entries.push({ key, payload })
    }

    for (const entry of chartEntries) {
      entries.push(entry)
    }

    let upserted = 0
    for (const entry of entries) {
      try {
        const payload = serializeJson(entry.payload)
        await repo.upsertEntry({ key: entry.key, payload })
        upserted += 1
      } catch (error) {
        logger.error('pulse_cache_upsert_failed', {
          key: entry.key,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const durationMs = Date.now() - startTime
    logger.info('job_complete', {
      entries_processed: entries.length,
      entries_upserted: upserted,
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
