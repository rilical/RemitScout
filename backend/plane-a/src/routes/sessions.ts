import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { NotFoundError, RateLimitError, ValidationError } from '../../../shared/errors'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { verifySupabaseJwt } from '../auth/verify-supabase-jwt'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { resolveAdminAccess } from '../services/admin-access'
import {
  AdminSessionError,
  getAdminRefreshCookieName,
  getClearRefreshCookieHeader,
  getCookieValue,
  getRefreshCookieHeader,
  issueAdminSession,
  refreshAdminSession,
  revokeCurrentAdminSession,
} from '../services/admin-sessions'
import { getErrorMessage } from '../types/errors'
import {
  deriveSessionId,
  deriveRotatingSessionId,
  detectDeviceType,
  getLocationFromHeaders,
} from '../services/session-utils'
import { anonymizeIpAddress, extractBrowserFamily } from '../services/privacy-utils'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'

const logger = createLogger('plane-a.sessions')
const ADMIN_EXCHANGE_RATE_LIMIT = 5
const ADMIN_EXCHANGE_RATE_TTL_SECONDS = 60
const SESSION_TRACK_RATE_LIMIT = 120
const SESSION_TRACK_RATE_TTL_SECONDS = 60
const SESSION_TRACK_METADATA_MAX_BYTES = 4096
const adminMfaRequired = config.planeA.adminMfaRequired

const trackSessionSchema = z.object({
  session_id: z.string().min(16).max(256),
  anon_id: z.string().min(6).max(128).optional(),
  device_type: z.string().max(64).optional(),
  location: z.string().max(128).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const revokeAllSchema = z.object({
  except_session_id: z.string().optional(),
})

const refreshSessionSchema = z.object({
  refresh_token: z.string().min(16).optional(),
})

const setCookie = (reply: FastifyReply, value: string) => {
  reply.header('set-cookie', value)
}

export const sessionsRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool
  const repository = app.container.repositories.session

  app.post('/sessions/admin/exchange', async (request, reply) => {
    const userAgentForRateLimit =
      typeof request.headers['user-agent'] === 'string'
        ? request.headers['user-agent'].slice(0, 160)
        : 'unknown'
    const rateFingerprint = `${request.ip || 'unknown'}:${userAgentForRateLimit}`
    const rateKey = buildRateLimitKey('admin:exchange', rateFingerprint)
    if (await checkRateLimit({ logger, key: rateKey, limit: ADMIN_EXCHANGE_RATE_LIMIT, ttlSeconds: ADMIN_EXCHANGE_RATE_TTL_SECONDS, component: 'admin_exchange' })) {
      throw new RateLimitError('Too many token exchange attempts. Please try again later.')
    }

    if (
      request.body &&
      typeof request.body === 'object' &&
      !Array.isArray(request.body) &&
      'supabase_token' in request.body
    ) {
      throw new ValidationError('Invalid request', {
        details: { error: 'header_auth_required' },
      })
    }

    const authorizationHeader = (() => {
      const header = request.headers.authorization
      if (typeof header === 'string') return header
      if (Array.isArray(header)) return header[0]
      return undefined
    })()
    if (!authorizationHeader) {
      throw new ValidationError('Authorization header is required', {
        details: { error: 'missing_authorization_header' },
      })
    }

    const authResult = await verifySupabaseJwt(authorizationHeader)
    if ('code' in authResult) {
      reply.code(401)
      return {
        error: 'unauthorized',
        code: authResult.code,
        message: authResult.message,
      }
    }

    const claims = authResult.claims as Record<string, unknown> | undefined
    const amr = Array.isArray(claims?.amr)
      ? claims.amr as Array<{ method?: string; mfa?: boolean }>
      : []
    const hasTotpMfa = amr.some((entry) => {
      if (!entry) return false
      if (entry.mfa === true) return true
      return entry.method === 'totp'
    })
    if (adminMfaRequired && !hasTotpMfa) {
      reply.code(403)
      return {
        error: 'mfa_required',
        message: 'Multi-factor authentication is required for admin access.',
      }
    }

    const access = await resolveAdminAccess({
      pool,
      userId: authResult.user_id,
      email: authResult.email ?? null,
    })

    if (!access.allowed) {
      reply.code(403)
      return {
        error: 'forbidden',
        code: access.denyReason ?? 'admin_access_denied',
      }
    }

    const anonymizedIp = anonymizeIpAddress(request.ip)
    const userAgentHeader = typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : null
    const userAgent = extractBrowserFamily(userAgentHeader)

    const issued = await issueAdminSession({
      pool,
      userId: authResult.user_id,
      email: authResult.email ?? null,
      role: authResult.role ?? null,
      appRole: access.appRole,
      mfaVerified: hasTotpMfa,
      ipHash: anonymizedIp.ipHash ?? null,
      userAgent,
      metadata: {
        auth_source: 'supabase_exchange',
        mfa_verified: hasTotpMfa,
      },
    })

    setCookie(reply, getRefreshCookieHeader(issued.refreshToken))

    try {
      await logAuditEvent(pool, {
        actorId: authResult.user_id,
        actorType: 'admin',
        actorRole: authResult.role ?? undefined,
        action: 'session.admin.exchange',
        entityType: 'admin_session',
        entityId: issued.jti,
        metadata: {
          refresh_family_id: issued.refreshFamilyId,
        },
        category: 'security',
        severity: 'info',
        ...getRequestContext(request),
      })
    }
    catch (error) {
      logger.warn('audit_log_failed', {
        user_id: authResult.user_id,
        error: getErrorMessage(error),
      })
    }

    return {
      access_token: issued.accessToken,
      expires_in: issued.expiresIn,
      token_type: issued.tokenType,
    }
  })

  app.post('/sessions/admin/refresh', async (request, reply) => {
    const parsed = refreshSessionSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const refreshToken = parsed.data.refresh_token
      || getCookieValue(request.headers.cookie, getAdminRefreshCookieName())

    if (!refreshToken) {
      reply.code(401)
      return {
        error: 'unauthorized',
        code: 'missing_refresh_token',
        message: 'Refresh token is required.',
      }
    }

    const anonymizedIp = anonymizeIpAddress(request.ip)
    const userAgentHeader = typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : null
    const userAgent = extractBrowserFamily(userAgentHeader)

    try {
      const issued = await refreshAdminSession({
        pool,
        refreshToken,
        ipHash: anonymizedIp.ipHash ?? null,
        userAgent,
        metadata: {
          auth_source: 'refresh',
        },
      })

      setCookie(reply, getRefreshCookieHeader(issued.refreshToken))

      return {
        access_token: issued.accessToken,
        expires_in: issued.expiresIn,
        token_type: issued.tokenType,
      }
    }
    catch (error) {
      if (error instanceof AdminSessionError) {
        reply.code(error.statusCode)
        return {
          error: 'unauthorized',
          code: error.code,
          message: error.message,
        }
      }

      logger.error('admin_refresh_failed', {
        error: getErrorMessage(error),
      })
      reply.code(500)
      return {
        error: 'internal_error',
      }
    }
  })

  app.delete('/sessions/current', { preHandler: requireAuth() }, async (request, reply) => {
    const refreshToken = getCookieValue(request.headers.cookie, getAdminRefreshCookieName())
    const claims = request.user?.claims as Record<string, unknown> | undefined

    const revoked = await revokeCurrentAdminSession({
      pool,
      claims,
      refreshToken,
    })

    setCookie(reply, getClearRefreshCookieHeader())

    try {
      await logAuditEvent(pool, {
        actorId: request.user?.user_id ?? 'unknown',
        actorType: 'admin',
        actorRole: request.user?.role ?? undefined,
        action: 'session.current.revoked',
        entityType: 'admin_session',
        entityId: typeof claims?.jti === 'string' ? claims.jti : request.user?.user_id ?? 'unknown',
        metadata: {
          revoked_refresh_rows: revoked.revokedRefreshRows,
          revoked_jti: revoked.revokedJti,
        },
        category: 'security',
        severity: 'info',
        ...getRequestContext(request),
      })
    }
    catch (error) {
      logger.warn('audit_log_failed', {
        user_id: request.user?.user_id,
        error: getErrorMessage(error),
      })
    }

    return { success: true }
  })

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
        ip_address: null,
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
    }
    catch (error) {
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
    }
    catch (error) {
      logger.warn('audit_log_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
    }

    return { success: true, revoked }
  })

  app.post('/sessions/track', async (request) => {
    try {
      const rateKey = buildRateLimitKey('session:track', request.ip || 'unknown')
      if (await checkRateLimit({
        logger,
        key: rateKey,
        limit: SESSION_TRACK_RATE_LIMIT,
        ttlSeconds: SESSION_TRACK_RATE_TTL_SECONDS,
        component: 'session_track',
      })) {
        throw new RateLimitError('Too many tracking requests. Please try again later.')
      }

      const body = trackSessionSchema.parse(request.body ?? {})
      const metadataJson = JSON.stringify(body.metadata ?? {})
      if (metadataJson.length > SESSION_TRACK_METADATA_MAX_BYTES) {
        throw new ValidationError('Invalid session tracking request', {
          details: [{ message: 'metadata_too_large' }],
        })
      }
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
        body.device_type
        || detectDeviceType(rawUserAgent)
        || undefined
      const anonymizedIp = anonymizeIpAddress(request.ip)
      const browserFamily = extractBrowserFamily(rawUserAgent)

      await repository.createSession({
        sessionId,
        userId: request.user?.user_id,
        anonId,
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
    }
    catch (error) {
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
