import type { FastifyInstance } from 'fastify'
import { recordRequest } from '../../../../shared/api-metrics'
import { requireAuth } from '../../plugins/auth-plugin'
import { getUserPlan } from '../../services/user-plan'
import { resolveEffectiveEntitlements } from '../../services/effective-entitlements'
import { logger } from './shared'

export const registerAlertsEvaluationRoutes = async (app: FastifyInstance) => {
  const { pool } = app.container

  app.get('/alerts/smart-notifier', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const plan = await getUserPlan(pool, user.user_id)
      const effective = await resolveEffectiveEntitlements({
        pool,
        userId: user.user_id,
        email: user.email ?? null,
        supabaseRole: user.role ?? null,
        plan,
      })
      if (!effective.entitlements.smart_alerts_enabled) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/alerts/smart-notifier', 403, durationSeconds)

        reply.code(403)
        return {
          success: false,
          error: 'plus_required',
          message: 'Smart Notifier is available for Plus members only.',
        }
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/smart-notifier', 200, durationSeconds)

      return {
        success: true,
        message: 'Smart alerts send weekly best-time notifications when sufficient data is available.',
        cadence: 'weekly',
        availability: 'data-dependent',
        features: [
          'Weekly best-time window recommendations',
          'Confidence-gated notifications',
          'Latest-available data coverage',
        ],
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/smart-notifier', 500, durationSeconds)

      logger.error('smart_notifier_check_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to check Smart Notifier status',
      }
    }
  })
}
