import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured, isStripeMockMisconfigured } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'

const planeAPool = getPool(config.db.planeAUrl)

export const billingPortalRoutes = async (app: FastifyInstance) => {
  app.get('/billing/portal', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    if (isStripeMockMisconfigured()) {
      reply.code(500)
      return { error: 'billing_misconfigured' }
    }

    if (!isStripeConfigured()) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    try {
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!plan || !plan.stripe_customer_id) {
        reply.code(400)
        return { error: 'customer_not_found' }
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
    } catch (error: unknown) {
      reply.code(500)
      return { 
        error: 'internal_error', 
        message: 'An unexpected error occurred' 
      }
    }
  })
}
