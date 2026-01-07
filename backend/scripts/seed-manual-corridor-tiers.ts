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

const upsertTier = async (
  pool: ReturnType<typeof createPool>,
  corridorId: string,
  tier: 'tier_1' | 'tier_2' | 'tier_3',
  reason: string,
) => {
  await query(
    `INSERT INTO silver.corridor_tier_manual (corridor_id, corridor_tier, reason)
     VALUES ($1, $2, $3)
     ON CONFLICT (corridor_id) DO UPDATE SET
       corridor_tier = EXCLUDED.corridor_tier,
       reason = EXCLUDED.reason,
       updated_at = NOW()`,
    [corridorId, tier, reason],
    pool,
  )
}

const refreshCorridorPriority = async (pool: ReturnType<typeof createPool>) => {
  await query(
    `INSERT INTO silver.corridor_priority (
      corridor_id,
      priority_tier,
      freshness_slo_minutes,
      scrape_interval_seconds,
      proxy_tier
    )
    SELECT
      corridor_id,
      CASE
        WHEN corridor_tier = 'tier_1' THEN 'tier_1_alpha'
        WHEN corridor_tier = 'tier_2' THEN 'tier_2_reference'
        ELSE 'tier_3_discovery'
      END,
      CASE
        WHEN corridor_tier = 'tier_1' THEN 1
        WHEN corridor_tier = 'tier_2' THEN 60
        ELSE 1440
      END,
      CASE
        WHEN corridor_tier = 'tier_1' THEN 60
        WHEN corridor_tier = 'tier_2' THEN 3600
        ELSE 86400
      END,
      CASE
        WHEN corridor_tier = 'tier_1' THEN 'RESIDENTIAL_PREMIUM'
        WHEN corridor_tier = 'tier_2' THEN 'DATACENTER_ROTATING'
        ELSE 'NONE'
      END
    FROM silver.corridor_tier
    ON CONFLICT (corridor_id) DO UPDATE SET
      priority_tier = EXCLUDED.priority_tier,
      freshness_slo_minutes = EXCLUDED.freshness_slo_minutes,
      scrape_interval_seconds = EXCLUDED.scrape_interval_seconds,
      proxy_tier = EXCLUDED.proxy_tier,
      updated_at = NOW()`,
    [],
    pool,
  )
}

const main = async () => {
  const pool = createPool(config.db.planeBUrl)

  const tier1 = readCorridorList('data/manual-tier1-corridors.csv')
  const tier2All = readCorridorList('data/manual-tier2-corridors.csv')
  const tier1Set = new Set(tier1)
  const tier2 = tier2All.filter(id => !tier1Set.has(id))

  const uniqueTier1 = Array.from(new Set(tier1))
  const uniqueTier2 = Array.from(new Set(tier2))

  logger.info('manual_tiers_loaded', {
    tier1_count: uniqueTier1.length,
    tier2_count: uniqueTier2.length,
  })

  try {
    await query('BEGIN', [], pool)
    await query('TRUNCATE silver.corridor_tier_manual', [], pool)

    for (const corridorId of uniqueTier1) {
      await ensureCorridor(pool, corridorId)
      await upsertTier(pool, corridorId, 'tier_1', 'seed:top_100_volatility')
    }

    for (const corridorId of uniqueTier2) {
      await ensureCorridor(pool, corridorId)
      await upsertTier(pool, corridorId, 'tier_2', 'seed:common_corridors')
    }

    await query('COMMIT', [], pool)
    await refreshCorridorPriority(pool)

    logger.info('manual_tiers_seeded', {
      tier1_count: uniqueTier1.length,
      tier2_count: uniqueTier2.length,
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
