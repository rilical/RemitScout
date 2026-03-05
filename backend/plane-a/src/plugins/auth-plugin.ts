import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../../../shared/config'
import { getPool, query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { DailyUsageCounterRepository } from '../repositories'
import { formatCorridorId, parseCorridorId } from '../../../shared/corridor'
import { verifyPlaneAAdminJwt, isPlaneAAdminAccessClaims } from '../auth/admin-jwt'
import { verifySupabaseJwt } from '../auth/verify-supabase-jwt'
import { validateApiKey } from '../services/api-keys'
import { resolveAdminAccess } from '../services/admin-access'
import { isAdminJtiRevoked } from '../services/admin-sessions'
import {
  getInstitutionalClientScopes,
  isInstitutionalClientActive,
  validateInstitutionalClientApiKey,
} from '../services/institutional-clients'
import { getEntitlementsForPlan, type Entitlements, type PlanCode } from '../services/entitlements'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { initUsageLogBuffer, pushUsageLogEntry } from '../services/usage-log-buffer'

type EntitlementType = 'pulse' | 'pulse_full' | 'exports' | 'alerts' | 'history' | 'api_access'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const apiKeyRateLimitStore = new Map<string, RateLimitEntry>()
const institutionalDailyRateLimitStore = new Map<string, RateLimitEntry>()
const API_KEY_RATE_LIMIT_MAX_ENTRIES = 10_000

const normalizeScope = (value: string) => value.trim().toLowerCase()

const toUtcDateString = (value: Date) => value.toISOString().slice(0, 10)

const resolveRequiredApiKeyScopes = (request: FastifyRequest): string[] => {
  const rawPath = request.routeOptions?.url || request.url.split('?')[0] || ''
  if (!rawPath) return []

  const path = rawPath.startsWith('/api/v1') ? rawPath.slice('/api/v1'.length) || '/' : rawPath

  // Ops/admin routes should never be accessible via API keys.
  if (
    path.startsWith('/ops')
    || path.startsWith('/admin')
    || path.startsWith('/audit')
    || path.startsWith('/analytics')
    || path.startsWith('/telemetry/analytics')
  ) {
    return ['__forbidden__']
  }

  if (path.startsWith('/indices')) return ['indices:read']
  if (
    path.startsWith('/providers')
    || path.startsWith('/quotes')
    || path.startsWith('/corridor-currencies')
    || path.startsWith('/corridor-limits')
    || path.startsWith('/rates')
    || path.startsWith('/pulse')
    || path.startsWith('/popular-corridors')
    || path.startsWith('/geo')
  ) {
    return ['corridors:read']
  }
  if (path.startsWith('/exports')) return ['exports:read']
  return []
}

const hasAllScopes = (scopes: string[] | undefined, required: string[]) => {
  if (!required.length) return true
  const set = new Set((scopes ?? []).map(normalizeScope))
  return required.every((scope) => set.has(normalizeScope(scope)))
}

const resolveInstitutionalSurfacePath = (request: FastifyRequest): string => {
  return request.url.split('?')[0] || ''
}

const isInstitutionalSurface = (path: string): boolean => {
  return path.startsWith('/api/v1/indices') || path === '/api/v1/usage'
}

const resolveNormalizedCorridorId = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parts = parseCorridorId(trimmed)
  if (!parts) return null
  return formatCorridorId({
    sourceCountry: parts.sourceCountry.toUpperCase(),
    destCountry: parts.destCountry.toUpperCase(),
    sourceCurrency: parts.sourceCurrency.toUpperCase(),
    destCurrency: parts.destCurrency.toUpperCase(),
  })
}

/**
 * Resolve the corridor ID from both query params (`corridor_id`) and path
 * params (`corridorId`). Routes use both naming conventions. Returns the
 * first valid, normalized corridor ID found, or null.
 */
const resolveCorridorIdFromRequest = (request: FastifyRequest): string | null => {
  const fromQuery = resolveNormalizedCorridorId((request.query as any)?.corridor_id)
  if (fromQuery) return fromQuery
  const fromParams = resolveNormalizedCorridorId((request.params as any)?.corridorId)
  return fromParams
}

/**
 * Check whether the corridors_allowed field effectively restricts access.
 * Returns true when the allowlist is non-null (i.e. there are explicit
 * corridor restrictions). Only null means "allow all"; an empty array
 * means "deny all" (restricted to zero corridors).
 */
const hasCorridorRestrictions = (corridorsAllowed: string[] | null): corridorsAllowed is string[] => {
  return corridorsAllowed !== null
}

const getSecondsUntilNextUtcMidnight = (now: Date): number => {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const deltaMs = Math.max(0, next.getTime() - now.getTime())
  return Math.max(1, Math.ceil(deltaMs / 1000))
}

/**
 * Fire-and-forget DB write-through for daily usage counter.
 * Increments the persistent counter so the count survives Redis failures.
 * Never blocks the request — errors are logged and swallowed.
 */
const writeThroughDbCounter = (repo: DailyUsageCounterRepository, clientId: string): void => {
  repo.incrementAndGet(clientId).catch((error) => {
    rateLimitLogger.warn('daily_usage_db_write_through_failed', {
      client_id: clientId,
      error: error instanceof Error ? error.message : String(error),
    })
  })
}

/**
 * Recover the daily usage count from the DB when Redis is unavailable.
 * Uses incrementAndGet so the DB reflects this request too.
 * Returns the new count after incrementing, or -1 if the DB is also down.
 */
const recoverCountFromDb = async (repo: DailyUsageCounterRepository, clientId: string): Promise<number> => {
  try {
    return await repo.incrementAndGet(clientId)
  } catch (error) {
    rateLimitLogger.warn('daily_usage_db_recovery_failed', {
      client_id: clientId,
      error: error instanceof Error ? error.message : String(error),
    })
    // If DB is also down, fall through to in-memory fallback.
    return -1
  }
}

const applyInstitutionalDailyRateLimit = async (
  request: FastifyRequest,
  reply: FastifyReply,
  clientId: string,
  maxRequestsPerDay: number,
): Promise<boolean> => {
  const now = new Date()
  const dateKey = toUtcDateString(now)
  const secondsUntilReset = getSecondsUntilNextUtcMidnight(now)
  const resetAtMs = now.getTime() + secondsUntilReset * 1000

  const redis = await getRedisClient()
  if (redis) {
    try {
      const redisKey = `plane-a:inst-daily:${clientId}:${dateKey}`
      const current = await redis.incr(redisKey)
      if (current === 1) {
        await redis.expire(redisKey, secondsUntilReset)
      }

      // Fire-and-forget: persist to DB so the count survives Redis restarts.
      writeThroughDbCounter(dailyUsageRepo, clientId)

      reply.header('X-RateLimit-Daily-Limit', String(maxRequestsPerDay))
      reply.header('X-RateLimit-Daily-Remaining', String(Math.max(0, maxRequestsPerDay - current)))
      reply.header('X-RateLimit-Daily-Reset', String(resetAtMs))

      if (current > maxRequestsPerDay) {
        reply.code(429)
        reply.send({
          error: 'daily_limit_exceeded',
          message: 'Daily request limit exceeded.',
          retryAfter: secondsUntilReset,
        })
        return false
      }
      return true
    } catch (redisError) {
      rateLimitLogger.warn('daily_rate_limit_redis_failed_recovering_from_db', {
        client_id: clientId,
        error: redisError instanceof Error ? redisError.message : String(redisError),
      })
      // Fall through to DB recovery path below.
    }
  }

  // Redis unavailable or errored — recover the authoritative count from DB.
  const dbCount = await recoverCountFromDb(dailyUsageRepo, clientId)

  if (dbCount >= 0) {
    // DB recovery succeeded; dbCount is the post-increment value.
    reply.header('X-RateLimit-Daily-Limit', String(maxRequestsPerDay))
    reply.header('X-RateLimit-Daily-Remaining', String(Math.max(0, maxRequestsPerDay - dbCount)))
    reply.header('X-RateLimit-Daily-Reset', String(resetAtMs))

    if (dbCount > maxRequestsPerDay) {
      reply.code(429)
      reply.send({
        error: 'daily_limit_exceeded',
        message: 'Daily request limit exceeded.',
        retryAfter: secondsUntilReset,
      })
      return false
    }
    return true
  }

  // Last resort: in-memory daily limiter (best-effort; not distributed).
  const memoryKey = `${clientId}:${dateKey}`
  const entry = institutionalDailyRateLimitStore.get(memoryKey)
  const nowMs = now.getTime()
  if (!entry || entry.resetAt < nowMs) {
    institutionalDailyRateLimitStore.set(memoryKey, { count: 1, resetAt: resetAtMs })
    reply.header('X-RateLimit-Daily-Limit', String(maxRequestsPerDay))
    reply.header('X-RateLimit-Daily-Remaining', String(Math.max(0, maxRequestsPerDay - 1)))
    reply.header('X-RateLimit-Daily-Reset', String(resetAtMs))
    if (1 > maxRequestsPerDay) {
      reply.code(429)
      reply.send({
        error: 'daily_limit_exceeded',
        message: 'Daily request limit exceeded.',
        retryAfter: secondsUntilReset,
      })
      return false
    }
    return true
  }

  entry.count += 1
  reply.header('X-RateLimit-Daily-Limit', String(maxRequestsPerDay))
  reply.header('X-RateLimit-Daily-Remaining', String(Math.max(0, maxRequestsPerDay - entry.count)))
  reply.header('X-RateLimit-Daily-Reset', String(entry.resetAt))

  if (entry.count > maxRequestsPerDay) {
    reply.code(429)
    reply.send({
      error: 'daily_limit_exceeded',
      message: 'Daily request limit exceeded.',
      retryAfter: secondsUntilReset,
    })
    return false
  }

  return true
}

export const authPlugin = (app: FastifyInstance) => {
  initUsageLogBuffer(planeAPool)

  app.addHook('preHandler', async (request: FastifyRequest) => {
    const apiKeyToken = resolveApiKeyToken(request)
    if (apiKeyToken) {
      const institutional = await validateInstitutionalClientApiKey(planeAPool, apiKeyToken)
      if (institutional) {
        request.institutionalClient = institutional
        return
      }

      const apiKey = await validateApiKey(planeAPool, apiKeyToken)
      if (apiKey) {
        request.apiKey = apiKey
        return
      }

      request.apiKeyError = { code: 'invalid_api_key', message: 'Invalid API key.' }
    }

    const header = request.headers.authorization
    if (!header) {
      return
    }
    const adminResult = await verifyPlaneAAdminJwt(header)
    if (!('code' in adminResult)) {
      const claims = adminResult.claims as Record<string, unknown> | undefined
      const jti = typeof claims?.jti === 'string' ? claims.jti : ''
      if (jti && await isAdminJtiRevoked(jti)) {
        request.authError = {
          code: 'revoked_token',
          message: 'Session has been revoked. Please sign in again.',
        }
        return
      }
      request.user = adminResult
      return
    }

    const result = await verifySupabaseJwt(header)
    if ('code' in result) {
      request.authError = result
      if (result.code !== 'missing_token') {
        try {
          await logAuditEvent(planeAPool, {
            actorId: 'anonymous',
            actorType: 'user',
            action: 'auth.failed',
            entityType: 'auth',
            metadata: {
              code: result.code,
              message: result.message,
            },
            category: 'security',
            severity: 'warning',
            ...getRequestContext(request),
          })
        } catch (error) {
          logger.warn('audit_log_failed', {
            error: getErrorMessage(error),
          })
        }
      }
      return
    }

    try {
      const tombstone = await query<{ user_id: string }>(
        `SELECT user_id
         FROM silver.account_deletion_tombstone
         WHERE user_id = $1`,
        [result.user_id],
        planeAPool,
      )
      if (tombstone.rowCount && tombstone.rowCount > 0) {
        request.accountDeleted = true
        return
      }
    } catch (error) {
      logger.warn('account_deletion_tombstone_lookup_failed', {
        user_id: result.user_id,
        error: getErrorMessage(error),
      })
    }

    request.user = result
  })

  // Institutional-only enforcement that must apply even to routes that don't use requireEntitlement.
  // Runs after auth has identified the institutional client.
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.institutionalClient) return

    // Global guard: reject expired or inactive institutional clients on ALL routes.
    if (!isInstitutionalClientActive(request.institutionalClient)) {
      reply.code(403)
      reply.send({ error: 'forbidden', code: 'institutional_inactive' })
      return
    }

    // Global guard: enforce corridor allowlist on ALL routes when a corridor_id is present.
    // Resolves corridor from both query params (?corridor_id=) and path params (/:corridorId).
    const corridorsAllowed = request.institutionalClient.corridors_allowed
    if (hasCorridorRestrictions(corridorsAllowed)) {
      const corridorId = resolveCorridorIdFromRequest(request)
      if (corridorId && !corridorsAllowed.includes(corridorId)) {
        logger.warn('institutional_corridor_blocked', {
          client_id: request.institutionalClient.id,
          corridor_id: corridorId,
          allowed_count: corridorsAllowed.length,
        })
        reply.code(403)
        reply.send({ error: 'corridor_not_allowed', corridor_id: corridorId })
        return
      }
    }

    const path = resolveInstitutionalSurfacePath(request)
    if (!isInstitutionalSurface(path)) return

    // Daily limiter counts authenticated institutional traffic, regardless of downstream 4xx.
    const allowed = await applyInstitutionalDailyRateLimit(
      request,
      reply,
      request.institutionalClient.id,
      Math.max(0, Number(request.institutionalClient.rate_limit_daily) || 0),
    )
    if (!allowed) {
      return
    }
  })

  // Best-effort usage logging for institutional surfaces.
  // Entries are buffered in-memory and flushed to DB periodically in bulk
  // to reduce per-request write contention on public.api_usage_log.
  app.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.institutionalClient) return
    const path = resolveInstitutionalSurfacePath(request)
    if (!isInstitutionalSurface(path)) return

    const corridorId = resolveCorridorIdFromRequest(request)
    const endpoint = request.routeOptions?.url || path
    const responseTimeMs = Number.isFinite(reply.elapsedTime) ? Math.round(reply.elapsedTime) : null

    pushUsageLogEntry({
      clientId: request.institutionalClient.id,
      endpoint,
      corridorId,
      responseTimeMs,
      statusCode: reply.statusCode,
    })
  })
}

export const requireAuth = () => {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.accountDeleted) {
      reply.code(403)
      return reply.send({
        error: 'account_deleted',
        code: 'account_deleted',
        message: 'This account has been deleted.',
      })
    }

    if (request.authError) {
      const errorCode = request.authError.code
      const statusCode = errorCode === 'missing_token' ? 401 : 401
      reply.code(statusCode)
      return reply.send({
        error: 'unauthorized',
        code: errorCode,
        message: request.authError.message,
      })
    }

    if (!request.user) {
      if (request.apiKeyError) {
        reply.code(401)
        return reply.send({
          error: 'unauthorized',
          code: request.apiKeyError.code,
          message: request.apiKeyError.message,
        })
      }
      reply.code(401)
      return reply.send({ error: 'unauthorized' })
    }
  }
  ;(handler as { __guardTag?: string }).__guardTag = 'requireAuth'
  return handler
}

export const requireAdmin = () => {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.accountDeleted) {
      reply.code(403)
      return reply.send({ error: 'account_deleted', message: 'This account has been deleted.' })
    }

    if (!request.user) {
      reply.code(401)
      return reply.send({ error: 'unauthorized' })
    }

    const claims = request.user.claims as Record<string, unknown> | undefined
    if (isPlaneAAdminAccessClaims(claims)) {
      const jti = typeof claims?.jti === 'string' ? claims.jti : ''
      if (jti && await isAdminJtiRevoked(jti)) {
        reply.code(401)
        return reply.send({
          error: 'unauthorized',
          code: 'revoked_token',
          message: 'Session has been revoked. Please sign in again.',
        })
      }
    }

    const access = await resolveAdminAccess({
      pool: planeAPool,
      userId: request.user.user_id,
      email: request.user.email ?? null,
    })

    if (!access.allowed) {
      if (access.denyReason === 'admin_allowlist_required_but_unconfigured') {
        logger.error('admin_allowlist_required_but_unconfigured', {
          env: config.env,
          user_id: request.user.user_id,
        })
      } else if (access.denyReason === 'admin_allowlist_denied') {
        logger.warn('admin_allowlist_denied', {
          user_id: request.user.user_id,
          has_email: Boolean(request.user.email),
        })
      } else {
        logger.warn('admin_role_required', {
          user_id: request.user.user_id,
          supabase_role: request.user.role ?? null,
          app_role: access.appRole,
        })
      }

      reply.code(403)
      return reply.send({ error: 'forbidden' })
    }

    if (adminMfaRequired) {
      const mfaVerifiedClaim = claims?.mfa_verified === true
      const hasTotpAmr = hasTotpMfaAmr(claims)
      if (!mfaVerifiedClaim && !hasTotpAmr) {
        logger.warn('admin_mfa_required', {
          user_id: request.user.user_id,
        })
        reply.code(403)
        return reply.send({
          error: 'mfa_required',
          message: 'Multi-factor authentication is required for admin access.',
        })
      }
    }

    return
  }
  ;(handler as { __guardTag?: string }).__guardTag = 'requireAdmin'
  return handler
}

export const requireSuperAdmin = () => {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.accountDeleted) {
      reply.code(403)
      return reply.send({ error: 'account_deleted', message: 'This account has been deleted.' })
    }

    if (!request.user) {
      reply.code(401)
      return reply.send({ error: 'unauthorized' })
    }

    const claims = request.user.claims as Record<string, unknown> | undefined
    if (adminMfaRequired) {
      const mfaVerifiedClaim = claims?.mfa_verified === true
      const hasTotpAmr = hasTotpMfaAmr(claims)
      if (!mfaVerifiedClaim && !hasTotpAmr) {
        logger.warn('super_admin_mfa_required', {
          user_id: request.user.user_id,
        })
        reply.code(403)
        return reply.send({
          error: 'mfa_required',
          message: 'Multi-factor authentication is required for admin access.',
        })
      }
    }

    try {
      const result = await query<{ app_role: string | null }>(
        `SELECT app_role FROM silver.user_account WHERE user_id = $1`,
        [request.user.user_id],
        planeAPool,
      )
      const appRole = result.rows[0]?.app_role
      if (appRole === 'super_admin') {
        return
      }
    } catch (error) {
      logger.warn('super_admin_role_lookup_failed', {
        user_id: request.user.user_id,
        error: getErrorMessage(error),
      })
    }

    reply.code(403)
    return reply.send({ error: 'forbidden' })
  }
  ;(handler as { __guardTag?: string }).__guardTag = 'requireSuperAdmin'
  return handler
}

const planeAPool = getPool(config.db.planeAUrl)
const logger = createLogger('plane-a.auth-plugin')
const rateLimitLogger = createLogger('plane-a.rate-limit')
const dailyUsageRepo = new DailyUsageCounterRepository(planeAPool)

const hasTotpMfaAmr = (claims: Record<string, unknown> | undefined): boolean => {
  const amr = Array.isArray(claims?.amr)
    ? claims.amr as Array<{ method?: string; mfa?: boolean }>
    : []
  return amr.some((entry) => {
    if (!entry) return false
    if (entry.mfa === true) return true
    return entry.method === 'totp'
  })
}

const adminMfaRequired = config.planeA.adminMfaRequired

const isEntitled = (entitlement: EntitlementType, entitlements: ReturnType<typeof getEntitlementsForPlan>) => {
  if (entitlement === 'pulse') {
    return entitlements.pulse_access !== 'none'
  }
  if (entitlement === 'pulse_full') {
    return entitlements.pulse_access === 'full'
  }
  if (entitlement === 'exports') {
    return entitlements.exports_enabled
  }
  if (entitlement === 'alerts') {
    return entitlements.alerts_max === null || entitlements.alerts_max > 0
  }
  if (entitlement === 'history') {
    return entitlements.history_max_days === null || entitlements.history_max_days > 0
  }
  if (entitlement === 'api_access') {
    return entitlements.api_access
  }
  return false
}

const resolveApiKeyToken = (request: FastifyRequest): string | null => {
  const raw = request.headers['x-api-key']
  if (!raw) return null
  if (Array.isArray(raw)) {
    return raw[0]?.trim() || null
  }
  if (typeof raw === 'string') {
    return raw.trim() || null
  }
  return null
}

const isPlanActive = (status?: string | null): boolean => {
  return status === 'active' || status === 'trialing'
}

const isPaidEntitlement = (entitlement: EntitlementType): boolean => {
  return entitlement === 'pulse' || entitlement === 'pulse_full' || entitlement === 'exports' || entitlement === 'api_access'
}

const applyApiKeyRateLimit = async (
  request: FastifyRequest,
  reply: FastifyReply,
  keyId: string,
): Promise<boolean> => {
  const maxRequests = config.planeA.enterpriseApiRateLimitMax
  const windowMs = config.planeA.enterpriseApiRateLimitWindowMs
  if (!maxRequests || maxRequests <= 0) {
    return true
  }

  const now = Date.now()

  // Best-effort in-memory eviction for local fallback mode.
  if (apiKeyRateLimitStore.size > API_KEY_RATE_LIMIT_MAX_ENTRIES) {
    for (const [entryKey, entry] of apiKeyRateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        apiKeyRateLimitStore.delete(entryKey)
      }
    }
  }

  const redis = await getRedisClient()
  if (redis) {
    const redisKey = `plane-a:enterprise-api:${keyId}`
    const current = await redis.incr(redisKey)
    if (current === 1) {
      await redis.expire(redisKey, Math.ceil(windowMs / 1000))
    }
    const ttl = await redis.ttl(redisKey)
    const resetAt = now + (ttl > 0 ? ttl * 1000 : windowMs)

    reply.header('X-RateLimit-Limit', String(maxRequests))
    reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current)))
    reply.header('X-RateLimit-Reset', String(resetAt))

    if (current > maxRequests) {
      logger.warn('enterprise_api_rate_limit_exceeded', {
        key_id: keyId,
        max: maxRequests,
        current,
      })
      reply.code(429)
      reply.send({
        error: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil(windowMs / 1000),
      })
      return false
    }
    return true
  }

  const entry = apiKeyRateLimitStore.get(keyId)
  if (!entry || entry.resetAt < now) {
    apiKeyRateLimitStore.set(keyId, { count: 1, resetAt: now + windowMs })
    reply.header('X-RateLimit-Limit', String(maxRequests))
    reply.header('X-RateLimit-Remaining', String(maxRequests - 1))
    reply.header('X-RateLimit-Reset', String(now + windowMs))
    return true
  }

  entry.count += 1
  reply.header('X-RateLimit-Limit', String(maxRequests))
  reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)))
  reply.header('X-RateLimit-Reset', String(entry.resetAt))

  if (entry.count > maxRequests) {
    logger.warn('enterprise_api_rate_limit_exceeded', {
      key_id: keyId,
      max: maxRequests,
      current: entry.count,
    })
    reply.code(429)
    reply.send({
      error: 'rate_limit_exceeded',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.ceil(windowMs / 1000)} seconds.`,
    })
    return false
  }

  return true
}

export const requireEntitlement = (entitlement: EntitlementType) => {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.accountDeleted) {
      reply.code(403)
      return reply.send({ error: 'account_deleted', message: 'This account has been deleted.' })
    }

    // Institutional clients are not part of the Supabase user plan system.
    if (request.institutionalClient) {
      if (!isInstitutionalClientActive(request.institutionalClient)) {
        reply.code(403)
        return reply.send({ error: 'forbidden', code: 'institutional_inactive' })
      }
      if (entitlement !== 'api_access') {
        reply.code(403)
        return reply.send({ error: 'forbidden' })
      }

      const scopes = getInstitutionalClientScopes(request.institutionalClient.tier)
      const requiredScopes = resolveRequiredApiKeyScopes(request)
      if (!hasAllScopes(scopes, requiredScopes)) {
        reply.code(403)
        return reply.send({
          error: 'insufficient_scope',
          requiredScopes,
        })
      }

      const corridorsAllowed = request.institutionalClient.corridors_allowed
      if (hasCorridorRestrictions(corridorsAllowed)) {
        const corridorId = resolveCorridorIdFromRequest(request)
        if (corridorId && !corridorsAllowed.includes(corridorId)) {
          logger.warn('institutional_corridor_blocked', {
            client_id: request.institutionalClient.id,
            corridor_id: corridorId,
            allowed_count: corridorsAllowed.length,
            source: 'requireEntitlement',
          })
          reply.code(403)
          return reply.send({ error: 'corridor_not_allowed', corridor_id: corridorId })
        }
      }

      return
    }

    const userId = request.user?.user_id ?? request.apiKey?.user_id
    if (!userId) {
      if (request.apiKeyError) {
        reply.code(401)
        return reply.send({
          error: 'unauthorized',
          code: request.apiKeyError.code,
          message: request.apiKeyError.message,
        })
      }
      reply.code(401)
      return reply.send({ error: 'unauthorized' })
    }

    try {
      await ensureUserPlan(planeAPool, userId)
      const plan = await getUserPlan(planeAPool, userId)

      if (!plan) {
        reply.code(500)
        return reply.send({ error: 'plan_not_found' })
      }
      if (request.apiKey && plan.plan_code !== 'enterprise') {
        reply.code(403)
        return reply.send({ error: 'enterprise_required' })
      }
      if (request.apiKey && !isPlanActive(plan.status)) {
        reply.code(403)
        return reply.send({ error: 'plan_inactive' })
      }
      if (request.user && isPaidEntitlement(entitlement) && !isPlanActive(plan.status)) {
        reply.code(403)
        return reply.send({ error: 'plan_inactive' })
      }

      const normalizedPlanCode: PlanCode = plan.plan_code === 'plus' || plan.plan_code === 'enterprise' || plan.plan_code === 'free'
        ? plan.plan_code
        : 'free'
      const effectivePlanCode: PlanCode = isPlanActive(plan.status) ? normalizedPlanCode : 'free'
      const entitlements: Entitlements = getEntitlementsForPlan(effectivePlanCode)
      if (!isEntitled(entitlement, entitlements)) {
        reply.code(403)
        return reply.send({ error: 'forbidden', entitlement })
      }

      request.entitlementsContext = {
        planCode: effectivePlanCode,
        entitlements,
      }

      if (request.apiKey) {
        const requiredScopes = resolveRequiredApiKeyScopes(request)
        if (!hasAllScopes(request.apiKey.scopes, requiredScopes)) {
          reply.code(403)
          return reply.send({
            error: 'insufficient_scope',
            requiredScopes,
          })
        }
        const allowed = await applyApiKeyRateLimit(request, reply, request.apiKey.key_id)
        if (!allowed) {
          return
        }
      }
    } catch (error) {
      const logger = createLogger('plane-a.auth-plugin')
      logger.error('entitlement_check_failed', {
        user_id: userId,
        entitlement,
        error: error as Error,
      })

      reply.code(500)
      return reply.send({ error: 'internal_server_error', message: 'Failed to check entitlements' })
    }
  }
  ;(handler as { __guardTag?: string }).__guardTag = `requireEntitlement:${entitlement}`
  return handler
}
