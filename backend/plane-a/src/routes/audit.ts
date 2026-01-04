import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin, requireAuth } from '../plugins/auth-plugin'
import { AuditLogRepository } from '../repositories'

const logger = createLogger('plane-a.audit')
const planeAPool = getPool(config.db.planeAUrl)
const auditRepository = new AuditLogRepository(planeAPool)

const listSchema = z.object({
  actor_id: z.string().optional(),
  actor_type: z.string().optional(),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  format: z.enum(['csv', 'json']).optional(),
})

const parseDateOrNull = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const auditRoutes = async (app: FastifyInstance) => {
  app.get('/audit/logs', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const startDate = parseDateOrNull(parsed.data.start_date)
    const endDate = parseDateOrNull(parsed.data.end_date)
    if ((parsed.data.start_date && !startDate) || (parsed.data.end_date && !endDate)) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const result = await auditRepository.getLogs({
        actor_id: parsed.data.actor_id,
        actor_type: parsed.data.actor_type,
        action: parsed.data.action,
        entity_type: parsed.data.entity_type,
        entity_id: parsed.data.entity_id,
        category: parsed.data.category,
        severity: parsed.data.severity,
        start_date: startDate ?? undefined,
        end_date: endDate ?? undefined,
        limit: parsed.data.limit ?? 100,
        offset: parsed.data.offset ?? 0,
      })

      return {
        logs: result.logs,
        pagination: {
          total: result.total,
          limit: parsed.data.limit ?? 100,
          offset: parsed.data.offset ?? 0,
        },
      }
    } catch (error) {
      logger.error('audit_log_list_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/audit/logs/export', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const startDate = parseDateOrNull(parsed.data.start_date)
    const endDate = parseDateOrNull(parsed.data.end_date)
    if ((parsed.data.start_date && !startDate) || (parsed.data.end_date && !endDate)) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    const format = parsed.data.format ?? 'json'

    try {
      const output = await auditRepository.exportLogs(
        {
          actor_id: parsed.data.actor_id,
          actor_type: parsed.data.actor_type,
          action: parsed.data.action,
          entity_type: parsed.data.entity_type,
          entity_id: parsed.data.entity_id,
          category: parsed.data.category,
          severity: parsed.data.severity,
          start_date: startDate ?? undefined,
          end_date: endDate ?? undefined,
          limit: parsed.data.limit ?? 1000,
          offset: parsed.data.offset ?? 0,
        },
        format,
      )

      reply.header('Content-Type', format === 'csv' ? 'text/csv' : 'application/json')
      return output
    } catch (error) {
      logger.error('audit_log_export_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/audit/logs/:eventId', { preHandler: requireAdmin() }, async (request, reply) => {
    const eventId = String((request.params as { eventId?: string }).eventId ?? '')
    if (!eventId) {
      reply.code(400)
      return { error: 'missing_event_id' }
    }

    try {
      const log = await auditRepository.getLog(eventId)
      if (!log) {
        reply.code(404)
        return { error: 'not_found' }
      }
      return { log }
    } catch (error) {
      logger.error('audit_log_get_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/audit/my-activity', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    try {
      const logs = await auditRepository.getActivityByUser(user.user_id, 100)
      return { logs }
    } catch (error) {
      logger.error('audit_log_my_activity_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
