import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../../../shared/config'
import { getPool } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { verifySupabaseJwt } from '../auth/verify-supabase-jwt'
import { getEntitlementsForPlan } from '../services/entitlements'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'

type EntitlementType = 'pulse' | 'exports' | 'alerts' | 'history'

export const authPlugin = (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
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
          const logger = createLogger('plane-a.auth-plugin')
          logger.warn('audit_log_failed', {
            error: getErrorMessage(error),
          })
        }
      }
      return
    }
    request.user = result
  })
}

export const requireAuth = () => async (request: FastifyRequest, reply: FastifyReply) => {
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
    reply.code(401)
    return reply.send({ error: 'unauthorized' })
  }
}

export const requireAdmin = () => async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.code(401)
    return reply.send({ error: 'unauthorized' })
  }

  const supabaseRole = request.user.role
  if (supabaseRole === 'admin' || supabaseRole === 'super_admin') {
    return
  }

  const email = request.user.email?.toLowerCase()
  if (email && config.planeA.adminEmails.includes(email)) {
    return
  }

  reply.code(403)
  return reply.send({ error: 'forbidden' })
}

const planeAPool = getPool(config.db.planeAUrl)

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
  return false
}

export const requireEntitlement = (entitlement: EntitlementType) => async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.code(401)
    return reply.send({ error: 'unauthorized' })
  }

  try {
    await ensureUserPlan(planeAPool, request.user.user_id)
    const plan = await getUserPlan(planeAPool, request.user.user_id)
    
    if (!plan) {
      reply.code(500)
      return reply.send({ error: 'plan_not_found' })
    }

    const entitlements = getEntitlementsForPlan(plan.plan_code)
    if (!isEntitled(entitlement, entitlements)) {
      reply.code(403)
      return reply.send({ error: 'forbidden', entitlement })
    }
  } catch (error) {
    const logger = createLogger('plane-a.auth-plugin')
    logger.error('entitlement_check_failed', {
      user_id: request.user.user_id,
      entitlement,
      error: error as Error,
    })
    
    reply.code(500)
    return reply.send({ error: 'internal_server_error', message: 'Failed to check entitlements' })
  }
}
