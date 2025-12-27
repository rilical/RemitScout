import type { FastifyInstance } from 'fastify'
import { createPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { requireAuth } from '../plugins/auth-plugin'
import { upsertUserAccount } from '../services/user-account'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { getUsageForUser } from '../services/plan-usage'

const planeAPool = createPool(config.db.planeAUrl)

export const meRoutes = async (app: FastifyInstance) => {
  app.get('/api/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user
    if (!user) {
      reply.code(401)
      return { error: 'unauthorized' }
    }

    await upsertUserAccount(planeAPool, user)
    await ensureUserPlan(planeAPool, user.user_id)

    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan) {
      reply.code(500)
      return { error: 'plan_not_found' }
    }

    const entitlements = getEntitlementsForPlan(plan.plan_code)
    const usage = await getUsageForUser(planeAPool, user.user_id)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      user: {
        user_id: user.user_id,
        email: user.email,
      },
      plan: {
        plan_code: plan.plan_code,
        status: plan.status,
      },
      entitlements,
      usage,
    }
  })
}
