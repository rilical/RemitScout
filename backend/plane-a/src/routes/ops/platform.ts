import type { FastifyInstance } from 'fastify'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAdmin } from '../../plugins/auth-plugin'
import { ModuleRegistryRepository } from '../../repositories/implementations/module-registry-repository'
import { AgentActionsRepository } from '../../repositories/implementations/agent-actions-repository'
import { TriangulatedIndexRepository } from '../../repositories/implementations/triangulated-index-repository'
import { CorrectionLedgerRepository } from '../../repositories/implementations/correction-ledger-repository'
import { DataQualityRepository } from '../../repositories/implementations/data-quality-repository'

const logger = createLogger('plane-a.ops.platform')
const planeAPool = getPool(config.db.planeAUrl)

const moduleRegistryRepo = new ModuleRegistryRepository(planeAPool)
const agentActionsRepo = new AgentActionsRepository(planeAPool)
const triangulatedIndexRepo = new TriangulatedIndexRepository(planeAPool)
const correctionLedgerRepo = new CorrectionLedgerRepository(planeAPool)
const dataQualityRepo = new DataQualityRepository(planeAPool)

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

export const platformOpsRoutes = (app: FastifyInstance) => {
  // ── Module Registry ──

  app.get('/ops/modules/health', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const modules = await moduleRegistryRepo.getAll()
      return { modules, updatedAt: new Date().toISOString() }
    } catch (err) {
      logger.error('Failed to load module health', { err })
      reply.code(500)
      return { error: 'Failed to load module health' }
    }
  })

  app.get<{ Params: { moduleId: string } }>(
    '/ops/modules/:moduleId',
    { preHandler: requireAdmin() },
    async (request, reply) => {
      try {
        const { moduleId } = request.params
        const mod = await moduleRegistryRepo.getById(moduleId)
        if (!mod) {
          reply.code(404)
          return { error: 'Module not found' }
        }
        const corridors = await moduleRegistryRepo.getCorridorDetail(moduleId)
        return { module: mod, corridors, updatedAt: new Date().toISOString() }
      } catch (err) {
        logger.error('Failed to load module detail', { err })
        reply.code(500)
        return { error: 'Failed to load module detail' }
      }
    },
  )

  // ── Agent Actions ──

  app.get('/ops/agents/actions', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const q = request.query as Record<string, string | undefined>
      const limit = clampInt(q.limit, 1, 100, 20)
      const offset = clampInt(q.offset, 0, 100000, 0)
      const result = await agentActionsRepo.getActions({
        limit,
        offset,
        module_id: q.module_id,
        action_type: q.action_type,
      })
      return {
        actions: result.rows,
        total: result.total,
        limit,
        offset,
      }
    } catch (err) {
      logger.error('Failed to load agent actions', { err })
      reply.code(500)
      return { error: 'Failed to load agent actions' }
    }
  })

  app.get('/ops/agents/failure-bundles', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const q = request.query as Record<string, string | undefined>
      const limit = clampInt(q.limit, 1, 100, 25)
      const offset = clampInt(q.offset, 0, 100000, 0)
      const result = await agentActionsRepo.getFailureBundles({
        limit,
        offset,
        status: q.status,
        module_id: q.module_id,
      })
      return {
        bundles: result.rows,
        total: result.total,
        limit,
        offset,
      }
    } catch (err) {
      logger.error('Failed to load failure bundles', { err })
      reply.code(500)
      return { error: 'Failed to load failure bundles' }
    }
  })

  app.get('/ops/agents/metrics', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const metrics = await agentActionsRepo.getMetrics()
      return { ...metrics, period: '7d' }
    } catch (err) {
      logger.error('Failed to load self-healing metrics', { err })
      reply.code(500)
      return { error: 'Failed to load self-healing metrics' }
    }
  })

  // ── Corridor Stress ──

  app.get('/ops/stress/corridors', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const corridors = await triangulatedIndexRepo.getStressOverview()
      const summary = {
        total_corridors: corridors.length,
        normal: corridors.filter(c => c.stress_level === 'normal').length,
        elevated: corridors.filter(c => c.stress_level === 'elevated').length,
        high: corridors.filter(c => c.stress_level === 'high').length,
        critical: corridors.filter(c => c.stress_level === 'critical').length,
      }
      return {
        corridors,
        updatedAt: new Date().toISOString(),
        summary,
      }
    } catch (err) {
      logger.error('Failed to load corridor stress', { err })
      reply.code(500)
      return { error: 'Failed to load corridor stress' }
    }
  })

  // ── Data Quality ──

  app.get('/ops/quality/tce', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const rows = await dataQualityRepo.getTotalCollectionError()
      return { rows, updatedAt: new Date().toISOString() }
    } catch (err) {
      logger.error('Failed to load total collection error', { err })
      reply.code(500)
      return { error: 'Failed to load total collection error' }
    }
  })

  app.get('/ops/quality/mttd-mttr', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const entries = await dataQualityRepo.getMttdMttr()
      return { entries, updatedAt: new Date().toISOString() }
    } catch (err) {
      logger.error('Failed to load MTTD/MTTR', { err })
      reply.code(500)
      return { error: 'Failed to load MTTD/MTTR' }
    }
  })

  // ── Correction Ledger ──

  app.get('/ops/gold/corrections', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const q = request.query as Record<string, string | undefined>
      const limit = clampInt(q.limit, 1, 100, 50)
      const offset = clampInt(q.offset, 0, 100000, 0)
      const result = await correctionLedgerRepo.list({
        limit,
        offset,
        corridor_id: q.corridor_id,
        field_name: q.field_name,
      })
      return {
        corrections: result.rows,
        total: result.total,
        limit,
        offset,
      }
    } catch (err) {
      logger.error('Failed to load correction ledger', { err })
      reply.code(500)
      return { error: 'Failed to load correction ledger' }
    }
  })

  // ── Service Health ──

  app.get('/ops/services/health', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      const result = await query<{
        service_id: string
        display_name: string
        status: string
        last_active_at: Date | null
        message: string | null
      }>(
        `SELECT
           service_id,
           display_name,
           CASE
             WHEN last_completed_at > NOW() - INTERVAL '15 minutes' THEN 'healthy'
             WHEN last_completed_at > NOW() - INTERVAL '1 hour' THEN 'degraded'
             WHEN last_completed_at IS NOT NULL THEN 'offline'
             ELSE 'unknown'
           END AS status,
           last_completed_at AS last_active_at,
           last_error AS message
         FROM (
           SELECT
             unnest(ARRAY['brain', 'frontdesk', 'export-worker']) AS service_id,
             unnest(ARRAY['Brain Service', 'Slack Frontdesk', 'Export Worker']) AS display_name,
             unnest(ARRAY[
               (SELECT MAX(completed_at) FROM silver.job_run WHERE job_type LIKE 'brain%' AND status = 'completed'),
               (SELECT MAX(completed_at) FROM silver.job_run WHERE job_type LIKE 'frontdesk%' AND status = 'completed'),
               (SELECT MAX(completed_at) FROM silver.job_run WHERE job_type LIKE 'export%' AND status = 'completed')
             ]) AS last_completed_at,
             unnest(ARRAY[
               (SELECT error_message FROM silver.job_run WHERE job_type LIKE 'brain%' ORDER BY queued_at DESC LIMIT 1),
               (SELECT error_message FROM silver.job_run WHERE job_type LIKE 'frontdesk%' ORDER BY queued_at DESC LIMIT 1),
               (SELECT error_message FROM silver.job_run WHERE job_type LIKE 'export%' ORDER BY queued_at DESC LIMIT 1)
             ]) AS last_error
         ) services`,
        [],
        planeAPool,
      )
      return {
        services: result.rows,
        updatedAt: new Date().toISOString(),
      }
    } catch (err) {
      logger.error('Failed to load service health', { err })
      reply.code(500)
      return { error: 'Failed to load service health' }
    }
  })

  // ── Failure Trends ──

  app.get('/ops/agents/failure-trends', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const q = request.query as Record<string, string | undefined>
      const days = clampInt(q.days, 1, 90, 7)

      const result = await query<{
        date: string
        total_bundles: number
        applied: number
        failed: number
        pending: number
      }>(
        `SELECT
           d::date AS date,
           COALESCE(counts.total_bundles, 0)::int AS total_bundles,
           COALESCE(counts.applied, 0)::int AS applied,
           COALESCE(counts.failed, 0)::int AS failed,
           COALESCE(counts.pending, 0)::int AS pending
         FROM generate_series(
           (CURRENT_DATE - ($1 || ' days')::interval)::date,
           CURRENT_DATE,
           '1 day'::interval
         ) d
         LEFT JOIN (
           SELECT
             created_at::date AS day,
             COUNT(*)::int AS total_bundles,
             COUNT(*) FILTER (WHERE repair_outcome = 'applied')::int AS applied,
             COUNT(*) FILTER (WHERE repair_outcome = 'failed')::int AS failed,
             COUNT(*) FILTER (WHERE repair_outcome IS NULL OR repair_outcome = 'pending')::int AS pending
           FROM silver.failure_bundle
           WHERE created_at >= CURRENT_DATE - ($1 || ' days')::interval
           GROUP BY created_at::date
         ) counts ON counts.day = d::date
         ORDER BY d ASC`,
        [days],
        planeAPool,
      )

      return {
        points: result.rows,
        period: `${days}d`,
      }
    } catch (err) {
      logger.error('Failed to load failure trends', { err })
      reply.code(500)
      return { error: 'Failed to load failure trends' }
    }
  })

  // ── Stress Controls ──

  app.post('/ops/stress/pause-probing', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const body = request.body as { paused?: boolean } | undefined
      const paused = body?.paused ?? true

      await query(
        `UPDATE silver.module_registry
            SET policy = jsonb_set(COALESCE(policy, '{}'::jsonb), '{adaptive_probing_paused}', $1::jsonb),
                updated_at = NOW()`,
        [JSON.stringify(paused)],
        planeAPool,
      )

      logger.info('Adaptive probing pause toggled', { paused })
      return { success: true, paused }
    } catch (err) {
      logger.error('Failed to toggle adaptive probing', { err })
      reply.code(500)
      return { error: 'Failed to toggle adaptive probing' }
    }
  })

  app.post('/ops/stress/override', { preHandler: requireAdmin() }, async (request, reply) => {
    try {
      const body = request.body as {
        corridorId?: string
        level?: string
        durationHours?: number
      } | undefined

      if (!body?.corridorId || !body?.level) {
        reply.code(400)
        return { error: 'corridorId and level are required' }
      }

      const validLevels = ['normal', 'elevated', 'high', 'critical']
      if (!validLevels.includes(body.level)) {
        reply.code(400)
        return { error: `level must be one of: ${validLevels.join(', ')}` }
      }

      const durationHours = clampInt(body.durationHours, 1, 24, 4)
      const stressScore = body.level === 'normal' ? 0
        : body.level === 'elevated' ? 0.45
        : body.level === 'high' ? 0.7
        : 0.9

      await query(
        `INSERT INTO gold_export.triangulated_index (
           corridor_id, amount_bucket, method_profile, date,
           leg1_corridor, leg2_corridor, stress_score, confidence,
           methodology_version
         ) VALUES ($1, 500, 'standard_bank', CURRENT_DATE, $1, $1, $2, 'manual_override', 'manual_override_v1')
         ON CONFLICT (corridor_id, amount_bucket, method_profile, date)
         DO UPDATE SET stress_score = $2, confidence = 'manual_override', methodology_version = 'manual_override_v1'`,
        [body.corridorId, stressScore],
        planeAPool,
      )

      logger.info('Stress override applied', {
        corridorId: body.corridorId,
        level: body.level,
        durationHours,
      })
      return { success: true, corridorId: body.corridorId, level: body.level, durationHours, expiresAt: new Date(Date.now() + durationHours * 3600_000).toISOString() }
    } catch (err) {
      logger.error('Failed to apply stress override', { err })
      reply.code(500)
      return { error: 'Failed to apply stress override' }
    }
  })

  app.post('/ops/stress/kill-switch', { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      await query(
        `UPDATE silver.module_registry
            SET policy = jsonb_set(COALESCE(policy, '{}'::jsonb), '{stress_probing_disabled}', 'true'::jsonb),
                updated_at = NOW()`,
        [],
        planeAPool,
      )

      logger.warn('Stress kill-switch activated — all stress-driven probing disabled')
      return { success: true, message: 'All stress-driven probing has been disabled.' }
    } catch (err) {
      logger.error('Failed to activate stress kill-switch', { err })
      reply.code(500)
      return { error: 'Failed to activate stress kill-switch' }
    }
  })
}
