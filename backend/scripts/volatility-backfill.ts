import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { VolatilityService } from '../plane-b/src/services/volatility-service'

const logger = createLogger('script.volatility-backfill')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const limit = toNumber(process.env.VOLATILITY_BACKFILL_LIMIT, 100)
const days = toNumber(process.env.VOLATILITY_BACKFILL_DAYS, 7)

const run = async () => {
  const pool = createPool(config.db.planeBUrl)
  try {
    const result = await query<{ corridor_id: string }>(
      `SELECT qr.corridor_id
       FROM silver.quote_record qr
       JOIN silver.ingestion_run ir ON ir.run_id = qr.ingestion_run_id
       WHERE qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
         AND ir.collector_type LIKE 'b2b_%'
       GROUP BY qr.corridor_id
       ORDER BY COUNT(*) DESC
       LIMIT $2`,
      [days, limit],
      pool,
    )

    const corridorIds = result.rows.map(row => row.corridor_id).filter(Boolean)
    if (corridorIds.length === 0) {
      logger.warn('backfill_no_corridors', { days, limit })
      return
    }

    const volatilityService = new VolatilityService(pool)
    const updated = await volatilityService.refreshCacheForCorridors(corridorIds)
    logger.info('backfill_complete', {
      corridors: corridorIds.length,
      updated,
      days,
      limit,
    })
  } finally {
    await pool.end()
  }
}

run().catch((error) => {
  logger.error('backfill_failed', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})
