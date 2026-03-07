import type { FastifyInstance } from 'fastify'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import {
  TIER_1_CADENCE_SECONDS,
  TIER_2_CADENCE_SECONDS,
  TIER_1_SLO_MINUTES,
  TIER_2_SLO_MINUTES,
} from '../../../../shared/corridor-tiers'
import { getSweepCadenceDriftMinutes } from '../../../../shared/b2b-sweep-cadence'
import { requireSuperAdmin } from '../../plugins/auth-plugin'

const logger = createLogger('plane-a.ops.b2b-sweep-status')
const planeAPool = getPool(config.db.planeAUrl)

type SweepRunRow = {
  priority_tier: string
  status: string
  cadence_minutes: number
  target_minutes: number
  observation_mode: boolean
  corridors_total: number
  providers_total: number
  enqueued_at: Date | null
  started_at: Date | null
  finished_at: Date | null
  created_at: Date
}

export const b2bSweepStatusRoutes = async (app: FastifyInstance) => {
  app.get('/ops/b2b-sweep-status', { preHandler: requireSuperAdmin() }, async (_request, reply) => {
    try {
      const [runResult, completedRunResult] = await Promise.all([
        query<SweepRunRow>(
          `SELECT DISTINCT ON (priority_tier)
             priority_tier,
             status,
             cadence_minutes,
             target_minutes,
             observation_mode,
             corridors_total,
             providers_total,
             enqueued_at,
             started_at,
             finished_at,
             created_at
           FROM silver.b2b_sweep_run
           ORDER BY priority_tier, created_at DESC`,
          [],
          planeAPool,
        ),
        query<SweepRunRow>(
          `SELECT DISTINCT ON (priority_tier)
             priority_tier,
             status,
             cadence_minutes,
             target_minutes,
             observation_mode,
             corridors_total,
             providers_total,
             enqueued_at,
             started_at,
             finished_at,
             created_at
           FROM silver.b2b_sweep_run
           WHERE status = 'completed'
           ORDER BY priority_tier, COALESCE(finished_at, started_at, created_at) DESC, created_at DESC`,
          [],
          planeAPool,
        ),
      ])

      const latestRunByTier = new Map(runResult.rows.map((row) => [row.priority_tier, row]))
      const latestCompletedRunByTier = new Map(
        completedRunResult.rows.map((row) => [row.priority_tier, row]),
      )

      const runRows = runResult.rows.map((row) => ({
        priorityTier: row.priority_tier,
        status: row.status,
        cadenceMinutes: row.cadence_minutes,
        targetMinutes: row.target_minutes,
        observationMode: row.observation_mode,
        corridorsTotal: row.corridors_total,
        providersTotal: row.providers_total,
        enqueuedAt: row.enqueued_at?.toISOString() ?? null,
        startedAt: row.started_at?.toISOString() ?? null,
        finishedAt: row.finished_at?.toISOString() ?? null,
        createdAt: row.created_at?.toISOString() ?? null,
      }))

      const now = new Date()
      const schedule = [
        {
          priorityTier: 'tier_1',
          cadenceSeconds: TIER_1_CADENCE_SECONDS,
          anyEnabled: !config.planeB.disableTier1,
        },
        {
          priorityTier: 'tier_2',
          cadenceSeconds: TIER_2_CADENCE_SECONDS,
          anyEnabled: true,
        },
      ].map((tier) => {
        const latestRun = latestRunByTier.get(tier.priorityTier)
        const latestCompletedRun = latestCompletedRunByTier.get(tier.priorityTier)
        return {
          priorityTier: tier.priorityTier,
          providers: latestRun?.providers_total ?? latestCompletedRun?.providers_total ?? 0,
          anyEnabled: tier.anyEnabled,
          driftMinutes: getSweepCadenceDriftMinutes({
            latestCompletedRun: latestCompletedRun
              ? {
                  createdAt: latestCompletedRun.created_at,
                  startedAt: latestCompletedRun.started_at,
                  finishedAt: latestCompletedRun.finished_at,
                }
              : null,
            cadenceSeconds: tier.cadenceSeconds,
            now,
          }),
        }
      })

      return {
        now: now.toISOString(),
        expectedCadence: {
          tier_1: {
            cadenceSeconds: TIER_1_CADENCE_SECONDS,
            cadenceMinutes: Math.round(TIER_1_CADENCE_SECONDS / 60),
            sloMinutes: TIER_1_SLO_MINUTES,
          },
          tier_2: {
            cadenceSeconds: TIER_2_CADENCE_SECONDS,
            cadenceMinutes: Math.round(TIER_2_CADENCE_SECONDS / 60),
            sloMinutes: TIER_2_SLO_MINUTES,
          },
        },
        schedule,
        latestRuns: runRows,
      }
    } catch (error) {
      logger.error('b2b_sweep_status_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to load B2B sweep status.' }
    }
  })
}
