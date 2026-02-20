import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { NotFoundError, ValidationError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import {
  deriveSessionId,
  deriveRotatingSessionId,
  detectDeviceType,
  getLocationFromHeaders,
  maskIpAddress,
} from '../services/session-utils'
import { anonymizeIpAddress, extractBrowserFamily } from '../services/privacy-utils'

const logger = createLogger('plane-a.sessions')

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
  const pool = app.container.pool
  const repository = app.container.repositories.session

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

  app.delete('/sessions/:id', { preHandler: requireAuth() }, async (request) => {
    const user = request.user!
    const params = request.params as { id?: string }
    const sessionId = params.id
    if (!sessionId) {
      throw new ValidationError('Session id is required', {
        details: [{ message: 'missing_session_id' }],
      })
    }
    const currentSessionId = deriveSessionId(request)

    const sessions = await repository.getUserSessions(user.user_id)
    const target = sessions.find((session) => session.session_id === sessionId)

    if (!target) {
      throw new NotFoundError('Session not found')
    }

    if (currentSessionId && sessionId === currentSessionId) {
      throw new ValidationError('Cannot revoke current session', {
        details: [{ message: 'cannot_revoke_current_session' }],
      })
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

  app.post('/sessions/track', async (request) => {
    try {
      const body = trackSessionSchema.parse(request.body ?? {})
      const sessionId = deriveRotatingSessionId(body.session_id)
      if (!sessionId) {
        throw new ValidationError('Invalid session id', {
          details: [{ message: 'invalid_session_id' }],
        })
      }
      const anonId = body.anon_id
      const rawUserAgent = typeof request.headers['user-agent'] === 'string'
        ? request.headers['user-agent']
        : null

      if (!request.user && !anonId) {
        throw new ValidationError('Anonymous id is required for unauthenticated tracking', {
          details: [{ message: 'missing_anon_id' }],
        })
      }

      const location = body.location || getLocationFromHeaders(request.headers)
      const deviceType =
        body.device_type ||
        detectDeviceType(rawUserAgent) ||
        undefined
      const anonymizedIp = anonymizeIpAddress(request.ip)
      const browserFamily = extractBrowserFamily(rawUserAgent)

      await repository.createSession({
        sessionId,
        userId: request.user?.user_id,
        anonId,
        ipAddress: anonymizedIp.truncatedIp ?? undefined,
        ipHash: anonymizedIp.ipHash ?? undefined,
        userAgent: browserFamily ?? undefined,
        deviceType,
        location: location ?? undefined,
        metadata: {
          ...(body.metadata ?? {}),
          ...(anonymizedIp.ipVersion ? { ip_version: anonymizedIp.ipVersion } : {}),
        },
      })

      return { success: true }
    } catch (error) {
      logger.warn('session_track_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid session tracking request', {
          details: error.issues,
          cause: error,
        })
      }
      if (error instanceof ValidationError) {
        throw error
      }
      throw new ValidationError('Invalid session tracking request', {
        details: [{ message: 'invalid_request' }],
        cause: error,
      })
    }
  })
}
