import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../../../shared/config'
import { getPool } from '../../../shared/db'
import { verifySupabaseJwt } from '../auth/verify-supabase-jwt'
import { getEntitlementsForPlan } from '../services/entitlements'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'

export const authPlugin = (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    const header = request.headers.authorization
    if (!header) {
      return
    }
    const result = await verifySupabaseJwt(header)
    if ('code' in result) {
      request.authError = result
      return
    }
    request.user = result
  })
}

export const requireAuth = () => async (request: FastifyRequest, reply: FastifyReply) => {
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

  const email = request.user.email?.toLowerCase()
  if (!email || !config.planeA.adminEmails.includes(email)) {
    reply.code(403)
    return reply.send({ error: 'forbidden' })
  }
}

const planeAPool = getPool(config.db.planeAUrl)

const isEntitled = (entitlement: string, entitlements: ReturnType<typeof getEntitlementsForPlan>) => {
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

export const requireEntitlement = (entitlement: string) => async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    reply.code(401)
    return reply.send({ error: 'unauthorized' })
  }

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
}
