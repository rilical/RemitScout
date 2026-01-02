import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan, updatePlanFromStripe } from '../../services/user-plan'

const planeAPool = getPool(config.db.planeAUrl)

const createCheckoutHandler = async (request: any, reply: any) => {
  const user = request.user!

  if (!config.billing.stripe.secretKey || !config.billing.stripe.priceIdPlus) {
    reply.code(500)
    return { error: 'billing_not_configured' }
  }

  try {
    await ensureUserPlan(planeAPool, user.user_id)
    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan) {
      reply.code(500)
      return { error: 'plan_not_found' }
    }

    // Check if user already has active plus subscription
    if (plan.plan_code === 'plus' && plan.status === 'active' && plan.stripe_subscription_id) {
      reply.code(400)
      return { 
        error: 'subscription_exists', 
        message: 'User already has an active subscription' 
      }
    }

    const stripe = getStripeClient()
    let customerId = plan.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { user_id: user.user_id },
        })
        customerId = customer.id
        
        await updatePlanFromStripe(planeAPool, {
          user_id: user.user_id,
          stripe_customer_id: customerId,
        })
      } catch (error: any) {
        reply.code(500)
        return { 
          error: 'stripe_customer_creation_failed', 
          message: error.message || 'Failed to create Stripe customer' 
        }
      }
    }

    try {
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
    } catch (error: any) {
      reply.code(500)
      return { 
        error: 'stripe_session_creation_failed', 
        message: error.message || 'Failed to create checkout session' 
      }
    }
  } catch (error: any) {
    reply.code(500)
    return { 
      error: 'internal_error', 
      message: 'An unexpected error occurred' 
    }
  }
}

export const checkoutSessionRoutes = async (app: FastifyInstance) => {
  app.post('/api/billing/checkout-session', { preHandler: requireAuth() }, createCheckoutHandler)
  
  // Add route that matches frontend proxy path
  app.post('/stripe/create-checkout', { preHandler: requireAuth() }, createCheckoutHandler)
}
