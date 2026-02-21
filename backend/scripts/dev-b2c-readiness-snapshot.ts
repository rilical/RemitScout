import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'

initTracing('dev-b2c-readiness-snapshot')
initErrorTracking('dev-b2c-readiness-snapshot')

const logger = createLogger('script.dev-b2c-readiness-snapshot')

type QuoteFreshnessRow = {
  latest_collected_at: string | null
  total_quotes: string | number
  fresh_15m: string | number
  fresh_60m: string | number
}

type RefreshStatusRow = {
  status: string
  count: string | number
}

type CorridorSnapshotRow = {
  corridor_id: string
  providers: string | number
  latest_collected_at: string | null
}

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseCsv = (value: string | undefined): string[] => (
  (value || '')
    .split(',')
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean)
)

export const runDevB2cReadinessSnapshot = async (): Promise<void> => {
  const corridors = parseCsv(process.env.CORRIDOR_IDS)
  const probeCorridors = corridors.length > 0
    ? corridors
    : ['US-AL-USD-ALL', 'US-AR-USD-ARS', 'US-MX-USD-MXN', 'US-PH-USD-PHP']

  const pool = createPool(config.db.planeBUrl)

  try {
    const [freshnessResult, refreshStatusResult, corridorResult] = await Promise.all([
      query<QuoteFreshnessRow>(
        `SELECT
            MAX(collected_at)::text AS latest_collected_at,
            COUNT(*)::bigint AS total_quotes,
            COUNT(*) FILTER (WHERE collected_at >= NOW() - INTERVAL '15 minutes')::bigint AS fresh_15m,
            COUNT(*) FILTER (WHERE collected_at >= NOW() - INTERVAL '60 minutes')::bigint AS fresh_60m
         FROM silver.latest_quote_by_provider`,
        [],
        pool,
      ),
      query<RefreshStatusRow>(
        `SELECT status, COUNT(*)::bigint AS count
         FROM silver.quote_refresh_request
         WHERE created_at >= NOW() - INTERVAL '2 hours'
         GROUP BY status
         ORDER BY count DESC`,
        [],
        pool,
      ),
      query<CorridorSnapshotRow>(
        `SELECT corridor_id,
                COUNT(*)::bigint AS providers,
                MAX(collected_at)::text AS latest_collected_at
         FROM silver.latest_quote_by_provider
         WHERE corridor_id = ANY($1::text[])
           AND amount_bucket = 500
         GROUP BY corridor_id
         ORDER BY corridor_id`,
        [probeCorridors],
        pool,
      ),
    ])

    const freshness = freshnessResult.rows[0]
    const refreshByStatus = Object.fromEntries(
      refreshStatusResult.rows.map((row) => [row.status, toNumber(row.count)]),
    )

    const corridorById = new Map(corridorResult.rows.map((row) => [row.corridor_id, row]))
    const corridorSnapshots = probeCorridors.map((corridorId) => {
      const row = corridorById.get(corridorId)
      return {
        corridorId,
        providersAt500: toNumber(row?.providers),
        latestCollectedAt: row?.latest_collected_at ?? null,
      }
    })

    logger.info('dev_b2c_readiness_snapshot', {
      environment: config.env,
      generated_at: new Date().toISOString(),
      quote_freshness: {
        latest_collected_at: freshness?.latest_collected_at ?? null,
        total_quotes: toNumber(freshness?.total_quotes),
        fresh_15m: toNumber(freshness?.fresh_15m),
        fresh_60m: toNumber(freshness?.fresh_60m),
      },
      refresh_requests_last_2h: refreshByStatus,
      corridors: corridorSnapshots,
    })
  } finally {
    await pool.end().catch(() => {})
  }
}

if (require.main === module) {
  runDevB2cReadinessSnapshot().catch((error) => {
    logger.error('dev_b2c_readiness_snapshot_failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    })
    process.exit(1)
  })
}

