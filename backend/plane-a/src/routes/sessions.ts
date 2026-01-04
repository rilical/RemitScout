import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { SessionRepository } from '../repositories'
import {
  deriveSessionId,
  detectDeviceType,
  getLocationFromHeaders,
  maskIpAddress,
} from '../services/session-utils'

const logger = createLogger('plane-a.sessions')
const pool = getPool(config.db.planeAUrl)
const repository = new SessionRepository(pool)

const trackSessionSchema = z.object({
  session_id: z.string().min(8),
  anon_id: z.string().optional(),
  device_type: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const revokeAllSchema = z.object({
  except_session_id: z.string().optional(),
})

export const sessionsRoutes = async (app: FastifyInstance) => {
  app.get('/sessions', { preHandler: requireAuth() }, async (request) => {
    const user = request.user!
    const currentSessionId = deriveSessionId(request)

    const sessions = await repository.getUserSessions(user.user_id)

    return {
      sessions: sessions.map((session) => ({
        id: session.session_id,
        session_id: session.session_id,
        device_type: session.device_type,
        location: session.location,
        ip_address: maskIpAddress(session.ip_address),
        last_activity: session.last_activity.toISOString(),
        created_at: session.created_at.toISOString(),
        is_current: currentSessionId ? session.session_id === currentSessionId : false,
      })),
    }
  })

  app.delete('/sessions/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const params = request.params as { id?: string }
    const sessionId = params.id
    if (!sessionId) {
      reply.code(400)
      return { error: 'missing_session_id' }
    }
    const currentSessionId = deriveSessionId(request)

    const sessions = await repository.getUserSessions(user.user_id)
    const target = sessions.find((session) => session.session_id === sessionId)

    if (!target) {
      reply.code(404)
      return { error: 'session_not_found' }
    }

    if (currentSessionId && sessionId === currentSessionId) {
      reply.code(400)
      return { error: 'cannot_revoke_current_session' }
    }

    await repository.revokeSession(sessionId)

    try {
      await logAuditEvent(pool, {
        actorId: user.user_id,
        actorType: 'user',
        actorRole: user.role ?? undefined,
        action: 'session.revoke',
        entityType: 'user_session',
        entityId: sessionId,
        metadata: {
          target_session_id: sessionId,
        },
        category: 'security',
        severity: 'info',
        ...getRequestContext(request),
      })
    } catch (error) {
      logger.warn('audit_log_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
    }

    return { success: true }
  })

  app.post('/sessions/revoke-all', { preHandler: requireAuth() }, async (request) => {
    const user = request.user!
    const body = revokeAllSchema.parse(request.body ?? {})
    const currentSessionId = deriveSessionId(request)
    const exceptSessionId = body.except_session_id || currentSessionId || undefined

    const revoked = await repository.revokeAllUserSessions(user.user_id, exceptSessionId)

    try {
      await logAuditEvent(pool, {
        actorId: user.user_id,
        actorType: 'user',
        actorRole: user.role ?? undefined,
        action: 'session.revoke_all',
        entityType: 'user_session',
        entityId: user.user_id,
        metadata: {
          revoked_count: revoked,
          except_session_id: exceptSessionId,
        },
        category: 'security',
        severity: 'info',
        ...getRequestContext(request),
      })
    } catch (error) {
      logger.warn('audit_log_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
    }

    return { success: true, revoked }
  })

  app.post('/sessions/track', async (request, reply) => {
    try {
      const body = trackSessionSchema.parse(request.body ?? {})
      const sessionId = body.session_id
      const anonId = body.anon_id
      const userAgent = request.headers['user-agent']

      if (!request.user && !anonId) {
        reply.code(400)
        return { error: 'missing_anon_id' }
      }

      const location = body.location || getLocationFromHeaders(request.headers)
      const deviceType =
        body.device_type ||
        detectDeviceType(typeof userAgent === 'string' ? userAgent : null) ||
        undefined

      await repository.createSession({
        sessionId,
        userId: request.user?.user_id,
        anonId,
        ipAddress: request.ip,
        userAgent: typeof userAgent === 'string' ? userAgent : undefined,
        deviceType,
        location: location ?? undefined,
        metadata: body.metadata,
      })

      return { success: true }
    } catch (error) {
      logger.warn('session_track_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(400)
      return { error: 'invalid_request' }
    }
  })
}
