import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'
import { AppError, ValidationError } from '../../../../shared/errors'

const planeAPool = getPool(config.db.planeAUrl)
const logger = createLogger('plane-a.billing-portal')

export const billingPortalRoutes = async (app: FastifyInstance) => {
  app.get('/billing/portal', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    if (!isStripeConfigured()) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    try {
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!plan || !plan.stripe_customer_id) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'customer_not_found',
            message: 'No Stripe customer was found for this account.',
          },
        })
      }

      const stripe = getStripeClient()
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: plan.stripe_customer_id,
          return_url: `${config.billing.stripe.frontendBaseUrl}/dashboard?tab=account`,
        })

        return { url: session.url }
      } catch (error: unknown) {
        const errorMessage = isStripeError(error) 
          ? error.message 
          : getErrorMessage(error)
        reply.code(500)
        return { 
          error: 'stripe_portal_creation_failed', 
          message: errorMessage || 'Failed to create billing portal session' 
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      logger.warn('billing_portal_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new AppError('An unexpected error occurred', {
        statusCode: 500,
        code: 'internal_error',
        cause: error,
      })
    }
  })
}
