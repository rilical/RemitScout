import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../../../shared/config'
import { getPool, query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { verifySupabaseJwt } from '../auth/verify-supabase-jwt'
import { validateApiKey } from '../services/api-keys'
import { getEntitlementsForPlan, type Entitlements, type PlanCode } from '../services/entitlements'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'

type EntitlementType = 'pulse' | 'exports' | 'alerts' | 'history' | 'api_access'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const apiKeyRateLimitStore = new Map<string, RateLimitEntry>()

export const authPlugin = (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    const apiKeyToken = resolveApiKeyToken(request)
    if (apiKeyToken) {
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
}

export const requireAuth = () => async (request: FastifyRequest, reply: FastifyReply) => {
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
      message: request.authError.message 
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

export const requireAdmin = () => async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.accountDeleted) {
    reply.code(403)
    return reply.send({ error: 'account_deleted', message: 'This account has been deleted.' })
  }

  if (!request.user) {
    reply.code(401)
    return reply.send({ error: 'unauthorized' })
  }

  const email = request.user.email?.toLowerCase()
  const allowlist = config.planeA.adminEmails
  if (allowlist.length > 0) {
    if (email && allowlist.includes(email)) {
      return
    }
    reply.code(403)
    return reply.send({ error: 'forbidden' })
  }

  const supabaseRole = request.user.role
  if (supabaseRole === 'admin' || supabaseRole === 'super_admin') {
    return
  }

  try {
    const result = await query<{ app_role: string | null }>(
      `SELECT app_role FROM silver.user_account WHERE user_id = $1`,
      [request.user.user_id],
      planeAPool,
    )
    const appRole = result.rows[0]?.app_role
    if (appRole === 'admin' || appRole === 'super_admin') {
      return
    }
  } catch (error) {
    logger.warn('admin_role_lookup_failed', {
      user_id: request.user.user_id,
      error: getErrorMessage(error),
    })
  }

  reply.code(403)
  return reply.send({ error: 'forbidden' })
}

const planeAPool = getPool(config.db.planeAUrl)
const logger = createLogger('plane-a.auth-plugin')

const isEntitled = (entitlement: EntitlementType, entitlements: ReturnType<typeof getEntitlementsForPlan>) => {
  if (entitlement === 'pulse') {
    return entitlements.pulse_access !== 'none'
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
  return entitlement === 'pulse' || entitlement === 'exports' || entitlement === 'api_access'
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

export const requireEntitlement = (entitlement: EntitlementType) => async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.accountDeleted) {
    reply.code(403)
    return reply.send({ error: 'account_deleted', message: 'This account has been deleted.' })
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
