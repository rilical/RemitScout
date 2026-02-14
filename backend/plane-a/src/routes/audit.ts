import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../shared/logger'
import { requireAdmin, requireAuth } from '../plugins/auth-plugin'
import { ValidationError, NotFoundError } from '../../../shared/errors'

const logger = createLogger('plane-a.audit')

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

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_WINDOW_DAYS = 7
const MAX_WINDOW_DAYS = 90

const parseDateOrNull = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const resolveDateRange = (input: { start_date?: string; end_date?: string }) => {
  const explicitStart = parseDateOrNull(input.start_date)
  const explicitEnd = parseDateOrNull(input.end_date)

  if (input.start_date && !explicitStart) {
    throw new ValidationError('Invalid request', { details: { error: 'invalid_date_range' } })
  }
  if (input.end_date && !explicitEnd) {
    throw new ValidationError('Invalid request', { details: { error: 'invalid_date_range' } })
  }

  const endDate = explicitEnd ?? new Date()
  const startDate = explicitStart ?? new Date(endDate.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS)

  if (startDate.getTime() > endDate.getTime()) {
    throw new ValidationError('Invalid request', { details: { error: 'invalid_date_range' } })
  }

  const windowMs = endDate.getTime() - startDate.getTime()
  if (windowMs > MAX_WINDOW_DAYS * DAY_MS) {
    throw new ValidationError('Invalid request', {
      details: { error: 'date_range_too_large', max_days: MAX_WINDOW_DAYS },
    })
  }

  return { startDate, endDate }
}

export const auditRoutes = async (app: FastifyInstance) => {
  const auditRepository = app.container.repositories.auditLog

  app.get('/audit/logs', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const { startDate, endDate } = resolveDateRange(parsed.data)

    try {
      const result = await auditRepository.getLogs({
        actor_id: parsed.data.actor_id,
        actor_type: parsed.data.actor_type,
        action: parsed.data.action,
        entity_type: parsed.data.entity_type,
        entity_id: parsed.data.entity_id,
        category: parsed.data.category,
        severity: parsed.data.severity,
        start_date: startDate,
        end_date: endDate,
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
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const { startDate, endDate } = resolveDateRange(parsed.data)

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
          start_date: startDate,
          end_date: endDate,
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
            throw new ValidationError('Invalid request', { details: { error: 'missing_event_id' } })
    }

    try {
      const log = await auditRepository.getLog(eventId)
      if (!log) {
                throw new NotFoundError('Not found', { details: { error: 'not_found' } })
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
