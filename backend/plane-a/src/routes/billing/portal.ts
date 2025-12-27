import type { FastifyInstance } from 'fastify'
import { createPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan } from '../../services/user-plan'

const planeAPool = createPool(config.db.planeAUrl)

export const billingPortalRoutes = async (app: FastifyInstance) => {
  app.get('/api/billing/portal', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user
    if (!user) {
      reply.code(401)
      return { error: 'unauthorized' }
    }

    if (!config.billing.stripe.secretKey) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    await ensureUserPlan(planeAPool, user.user_id)
    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan || !plan.stripe_customer_id) {
      reply.code(400)
      return { error: 'customer_not_found' }
    }

    const stripe = getStripeClient()
    const session = await stripe.billingPortal.sessions.create({
      customer: plan.stripe_customer_id,
      return_url: `${config.billing.stripe.frontendBaseUrl}/account`,
    })

    return { url: session.url }
  })
}
