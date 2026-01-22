import type { FastifyInstance } from 'fastify'

import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAdmin } from '../../plugins/auth-plugin'

const logger = createLogger('plane-a.ops.observation')
const planeBPool = getPool(config.db.planeBUrl)

type ObservationRow = {
  corridor_id: string
  provider_count: number
  volatility_score: number | null
  suggested_tier: string
}

type SnapshotAtRow = { snapshot_at: Date | null }

type CountRow = { count: string }

export const observationRoutes = async (app: FastifyInstance) => {
  app.get('/ops/observation/summary', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const limitRaw = Number((request.query as { limit?: string }).limit ?? 200)
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 2000) : 200

      const latestSnapshot = await query<SnapshotAtRow>(
        `SELECT MAX(snapshot_at) AS snapshot_at
           FROM silver.b2b_observation_snapshot`,
        [],
        planeBPool,
      )
      const latestSnapshotAt = latestSnapshot.rows[0]?.snapshot_at ?? null
      if (!latestSnapshotAt) {
        return {
          success: true,
          snapshot_at: null,
          rows: [],
          summary: {
            total_corridors: 0,
            suggested_tier1: 0,
            suggested_tier2: 0,
            suggested_tier3: 0,
          },
        }
      }

      const previousSnapshot = await query<SnapshotAtRow>(
        `SELECT MAX(snapshot_at) AS snapshot_at
           FROM silver.b2b_observation_snapshot
          WHERE snapshot_at < $1`,
        [latestSnapshotAt],
        planeBPool,
      )
      const previousSnapshotAt = previousSnapshot.rows[0]?.snapshot_at ?? null

      const latestRowsResult = await query<ObservationRow>(
        `SELECT corridor_id, provider_count, volatility_score, suggested_tier
           FROM silver.b2b_observation_snapshot
          WHERE snapshot_at = $1
          ORDER BY provider_count DESC, corridor_id ASC
          LIMIT $2`,
        [latestSnapshotAt, limit],
        planeBPool,
      )

      const latestRows = latestRowsResult.rows

      const previousRowsMap = new Map<string, ObservationRow>()
      if (previousSnapshotAt) {
        const previousRowsResult = await query<ObservationRow>(
          `SELECT corridor_id, provider_count, volatility_score, suggested_tier
             FROM silver.b2b_observation_snapshot
            WHERE snapshot_at = $1`,
          [previousSnapshotAt],
          planeBPool,
        )
        for (const row of previousRowsResult.rows) {
          previousRowsMap.set(row.corridor_id, row)
        }
      }

      const rows = latestRows.map((row) => {
        const previous = previousRowsMap.get(row.corridor_id) ?? null
        return {
          corridor_id: row.corridor_id,
          provider_count: row.provider_count,
          volatility_score: row.volatility_score,
          suggested_tier: row.suggested_tier,
          previous_provider_count: previous?.provider_count ?? null,
          previous_volatility_score: previous?.volatility_score ?? null,
          previous_suggested_tier: previous?.suggested_tier ?? null,
          delta_provider_count: previous ? row.provider_count - previous.provider_count : null,
        }
      })

      const totalCountResult = await query<CountRow>(
        `SELECT COUNT(*) AS count
           FROM silver.b2b_observation_snapshot
          WHERE snapshot_at = $1`,
        [latestSnapshotAt],
        planeBPool,
      )
      const totalCorridors = Number(totalCountResult.rows[0]?.count ?? 0)

      const tierCounts = rows.reduce(
        (acc, row) => {
          if (row.suggested_tier === 'tier_1_alpha') acc.suggestedTier1 += 1
          else if (row.suggested_tier === 'tier_2_reference') acc.suggestedTier2 += 1
          else acc.suggestedTier3 += 1
          return acc
        },
        { suggestedTier1: 0, suggestedTier2: 0, suggestedTier3: 0 },
      )

      return {
        success: true,
        snapshot_at: latestSnapshotAt,
        previous_snapshot_at: previousSnapshotAt,
        rows,
        summary: {
          total_corridors: totalCorridors,
          suggested_tier1: tierCounts.suggestedTier1,
          suggested_tier2: tierCounts.suggestedTier2,
          suggested_tier3: tierCounts.suggestedTier3,
        },
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('observation_summary_failed', { error: message })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to load observation summary' }
    }
  })
}
