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
import { requireAdmin } from '../../plugins/auth-plugin'

const logger = createLogger('plane-a.ops.b2b-sweep-status')
const planeAPool = getPool(config.db.planeAUrl)

const toDate = (value: Date | string | null) => (value ? new Date(value) : null)

const minutesBetween = (from: Date | null, to: Date | null) => {
  if (!from || !to) return null
  const deltaMs = to.getTime() - from.getTime()
  return Math.round(deltaMs / 60000)
}

export const b2bSweepStatusRoutes = async (app: FastifyInstance) => {
  app.get('/ops/b2b-sweep-status', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const scheduleResult = await query<{
        priority_tier: string
        providers: number
        min_interval_seconds: number
        max_interval_seconds: number
        next_due_at: Date | null
        last_enqueued_at: Date | null
        any_enabled: boolean
      }>(
        `SELECT
           priority_tier,
           COUNT(*)::int AS providers,
           MIN(interval_seconds)::int AS min_interval_seconds,
           MAX(interval_seconds)::int AS max_interval_seconds,
           MIN(next_due_at) AS next_due_at,
           MAX(last_enqueued_at) AS last_enqueued_at,
           BOOL_OR(enabled) AS any_enabled
         FROM silver.b2b_sweep_schedule
         GROUP BY priority_tier
         ORDER BY priority_tier`,
        [],
        planeAPool,
      )

      const runResult = await query<{
        priority_tier: string
        status: string
        cadence_minutes: number
        target_minutes: number
        observation_mode: boolean
        enqueued_at: Date | null
        started_at: Date | null
        finished_at: Date | null
        created_at: Date
      }>(
        `SELECT DISTINCT ON (priority_tier)
           priority_tier,
           status,
           cadence_minutes,
           target_minutes,
           observation_mode,
           enqueued_at,
           started_at,
           finished_at,
           created_at
         FROM silver.b2b_sweep_run
         ORDER BY priority_tier, created_at DESC`,
        [],
        planeAPool,
      )

      const now = new Date()
      const scheduleByTier = scheduleResult.rows.map((row) => {
        const lastEnqueued = toDate(row.last_enqueued_at)
        const nextDue = toDate(row.next_due_at)
        const expectedNext = lastEnqueued
          ? new Date(lastEnqueued.getTime() + row.max_interval_seconds * 1000)
          : null
        return {
          priorityTier: row.priority_tier,
          providers: row.providers,
          minIntervalSeconds: row.min_interval_seconds,
          maxIntervalSeconds: row.max_interval_seconds,
          anyEnabled: row.any_enabled,
          lastEnqueuedAt: lastEnqueued?.toISOString() ?? null,
          nextDueAt: nextDue?.toISOString() ?? null,
          expectedNextAt: expectedNext?.toISOString() ?? null,
          driftMinutes: expectedNext ? minutesBetween(expectedNext, now) : null,
        }
      })

      const runsByTier = runResult.rows.map((row) => ({
        priorityTier: row.priority_tier,
        status: row.status,
        cadenceMinutes: row.cadence_minutes,
        targetMinutes: row.target_minutes,
        observationMode: row.observation_mode,
        enqueuedAt: row.enqueued_at?.toISOString() ?? null,
        startedAt: row.started_at?.toISOString() ?? null,
        finishedAt: row.finished_at?.toISOString() ?? null,
        createdAt: row.created_at?.toISOString() ?? null,
      }))

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
        schedule: scheduleByTier,
        latestRuns: runsByTier,
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
