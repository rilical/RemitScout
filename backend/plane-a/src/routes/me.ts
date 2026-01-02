import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { upsertUserAccount } from '../services/user-account'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { getUsageForUser } from '../services/plan-usage'

const planeAPool = getPool(config.db.planeAUrl)
const logger = createLogger('plane-a.me')

export const meRoutes = async (app: FastifyInstance) => {
  app.get('/api/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      await upsertUserAccount(planeAPool, user)
      await ensureUserPlan(planeAPool, user.user_id)

      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!plan) {
        logger.error('plan_not_found', {
          user_id: user.user_id,
        })
        reply.code(500)
        return { error: 'plan_not_found' }
      }

      const entitlements = getEntitlementsForPlan(plan.plan_code)
      const usage = await getUsageForUser(planeAPool, user.user_id)

      logger.debug('me_request_success', {
        user_id: user.user_id,
        plan_code: plan.plan_code,
        status: plan.status,
      })

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
    } catch (error: any) {
      logger.error('me_request_failed', {
        user_id: user.user_id,
        error: error.message,
        stack: error.stack,
      })
      reply.code(500)
      return { 
        error: 'internal_error', 
        message: 'An unexpected error occurred' 
      }
    }
  })
}
