/**
 * Builds a monthly observation snapshot with provider count + volatility tier suggestions.
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { B2bSweepRepository } from '../plane-b/src/repositories'

const logger = createLogger('script.b2b-observation-snapshot')

const observationPriorityTier = 'observation_monthly'

type SnapshotRow = {
  corridor_id: string
  provider_count: number
  volatility_score: number | null
}

const resolveSuggestedTier = (providerCount: number, volatilityScore: number | null) => {
  const tier1MinProviders = Math.max(1, config.planeB.b2bTier1MinProviderCount || 0)
  const tier2MinProviders = Math.max(1, config.planeB.b2bMinProviderCount || 3)
  const tier1VolatilityMin = Math.max(0, config.planeB.b2bTier1VolatilityThreshold || 0)

  if (volatilityScore !== null && providerCount >= tier1MinProviders && volatilityScore >= tier1VolatilityMin) {
    return 'tier_1_alpha'
  }
  if (providerCount >= tier2MinProviders) {
    return 'tier_2_reference'
  }
  return 'tier_3_discovery'
}

const runSnapshot = async (): Promise<number> => {
  const pool = createPool(config.db.planeBUrl)
  try {
    const sweepRepo = new B2bSweepRepository(pool)
    let runId = process.env.B2B_OBSERVATION_RUN_ID || ''

    if (!runId) {
      const latest = await sweepRepo.getLatestRunByTier(observationPriorityTier)
      if (!latest) {
        logger.warn('b2b_observation_snapshot_missing', { reason: 'no_run_found' })
        return 1
      }
      runId = latest.runId
    }

    const result = await query<SnapshotRow>(
      `WITH run_tasks AS (
         SELECT DISTINCT corridor_id, provider_id
           FROM silver.b2b_sweep_task
          WHERE run_id = $1
       ),
       supported AS (
         SELECT rt.corridor_id, rt.provider_id
           FROM run_tasks rt
           JOIN silver.provider_corridor_capability pcc
             ON pcc.provider_id = rt.provider_id
            AND pcc.corridor_id = rt.corridor_id
          WHERE pcc.is_supported = true
       ),
       counts AS (
         SELECT corridor_id, COUNT(DISTINCT provider_id) AS provider_count
           FROM supported
          GROUP BY corridor_id
       )
       SELECT c.corridor_id,
              c.provider_count,
              v.volatility_score
         FROM counts c
         LEFT JOIN silver.corridor_volatility_cache v
           ON v.corridor_id = c.corridor_id`,
      [runId],
      pool,
    )

    const rows = result.rows
    if (rows.length === 0) {
      logger.warn('b2b_observation_snapshot_empty', { run_id: runId })
      return 0
    }

    const dryRun = process.env.B2B_OBSERVATION_SNAPSHOT_DRY_RUN === '1'
    const values: Array<{
      corridorId: string
      providerCount: number
      volatilityScore: number | null
      suggestedTier: string
    }> = []

    for (const row of rows) {
      values.push({
        corridorId: row.corridor_id,
        providerCount: Number(row.provider_count) || 0,
        volatilityScore: row.volatility_score !== null ? Number(row.volatility_score) : null,
        suggestedTier: resolveSuggestedTier(
          Number(row.provider_count) || 0,
          row.volatility_score !== null ? Number(row.volatility_score) : null,
        ),
      })
    }

    if (dryRun) {
      logger.info('b2b_observation_snapshot_preview', { run_id: runId, rows: values.length })
      return 0
    }

    const chunkSize = 500
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize)
      const corridorIds = chunk.map(value => value.corridorId)
      const providerCounts = chunk.map(value => value.providerCount)
      const volatilityScores = chunk.map(value => value.volatilityScore)
      const suggestedTiers = chunk.map(value => value.suggestedTier)

      await query(
        `INSERT INTO silver.b2b_observation_snapshot
         (corridor_id, provider_count, volatility_score, suggested_tier, observation_run_id)
         SELECT corridor_id, provider_count, volatility_score, suggested_tier, $5::uuid
           FROM UNNEST(
             $1::text[],
             $2::int[],
             $3::numeric[],
             $4::text[]
           ) AS t(
             corridor_id,
             provider_count,
             volatility_score,
             suggested_tier
           )`,
        [corridorIds, providerCounts, volatilityScores, suggestedTiers, runId],
        pool,
      )
    }

    logger.info('b2b_observation_snapshot_written', { run_id: runId, rows: values.length })
    return 0
  } catch (error) {
    logger.error('b2b_observation_snapshot_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return 1
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runSnapshot()
    .then(code => process.exit(code))
    .catch((error) => {
      logger.error('b2b_observation_snapshot_fatal', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}

export { runSnapshot }
