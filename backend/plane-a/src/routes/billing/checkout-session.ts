import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan, updatePlanFromStripe } from '../../services/user-plan'

const planeAPool = getPool(config.db.planeAUrl)

export const checkoutSessionRoutes = async (app: FastifyInstance) => {
  app.post('/api/billing/checkout-session', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user
    if (!user) {
      reply.code(401)
      return { error: 'unauthorized' }
    }

    if (!config.billing.stripe.secretKey || !config.billing.stripe.priceIdPlus) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    await ensureUserPlan(planeAPool, user.user_id)
    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan) {
      reply.code(500)
      return { error: 'plan_not_found' }
    }

    const stripe = getStripeClient()
    let customerId = plan.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.user_id },
      })
      customerId = customer.id
      await updatePlanFromStripe(planeAPool, {
        user_id: user.user_id,
        stripe_customer_id: customerId,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: config.billing.stripe.priceIdPlus, quantity: 1 }],
      success_url: `${config.billing.stripe.frontendBaseUrl}/account?checkout=success`,
      cancel_url: `${config.billing.stripe.frontendBaseUrl}/account?checkout=cancel`,
      metadata: {
        user_id: user.user_id,
        plan_code: 'plus',
      },
    })

    return {
      url: session.url,
      session_id: session.id,
    }
  })
}
