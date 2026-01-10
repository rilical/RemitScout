import { readFileSync } from 'fs'
import { resolve } from 'path'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { parseCorridorId } from '../shared/corridor'

const logger = createLogger('script.seed-manual-corridor-tiers')

const readCorridorList = (relativePath: string) => {
  const filePath = resolve(__dirname, '..', relativePath)
  const raw = readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const dataLines = lines[0]?.toLowerCase().includes('corridor_id') ? lines.slice(1) : lines
  return dataLines.map(line => line.split(',')[0]?.trim().toUpperCase()).filter(Boolean)
}

const ensureCorridor = async (pool: ReturnType<typeof createPool>, corridorId: string) => {
  const parsed = parseCorridorId(corridorId)
  if (!parsed) {
    logger.warn('corridor_id_invalid', { corridor_id: corridorId })
    return
  }

  await query(
    `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (corridor_id) DO NOTHING`,
    [
      corridorId,
      parsed.sourceCountry,
      parsed.destCountry,
      parsed.sourceCurrency,
      parsed.destCurrency,
    ],
    pool,
  )
}

const upsertHotCorridor = async (
  pool: ReturnType<typeof createPool>,
  corridorId: string,
  reason: string,
) => {
  await query(
    `INSERT INTO silver.hot_corridors (corridor_id, reason)
     VALUES ($1, $2)
     ON CONFLICT (corridor_id) DO UPDATE SET
       reason = EXCLUDED.reason,
       updated_at = NOW()`,
    [corridorId, reason],
    pool,
  )
}

const main = async () => {
  const pool = createPool(config.db.planeBUrl)

  const tier1 = readCorridorList('data/manual-tier1-corridors.csv')
  const tier2All = readCorridorList('data/manual-tier2-corridors.csv')
  const uniqueTier1 = Array.from(new Set(tier1))

  logger.info('hot_corridors_loaded', {
    tier1_count: uniqueTier1.length,
    ignored_tier2_count: new Set(tier2All).size,
  })

  try {
    await query('BEGIN', [], pool)
    await query('TRUNCATE silver.hot_corridors', [], pool)

    for (const corridorId of uniqueTier1) {
      await ensureCorridor(pool, corridorId)
      await upsertHotCorridor(pool, corridorId, 'seed:hot_corridors')
    }

    await query('COMMIT', [], pool)

    logger.info('hot_corridors_seeded', {
      tier1_count: uniqueTier1.length,
    })
  } catch (error) {
    await query('ROLLBACK', [], pool)
    logger.error('manual_tiers_seed_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  logger.error('manual_tiers_seed_crash', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})
