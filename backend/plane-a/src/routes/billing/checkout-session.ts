import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan, updatePlanFromStripe } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'

const planeAPool = getPool(config.db.planeAUrl)

const createCheckoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user!

  if ((!config.billing.stripe.secretKey && !config.billing.stripe.mockEnabled) || !config.billing.stripe.priceIdPlus) {
    reply.code(500)
    return { error: 'billing_not_configured' }
  }

  try {
    const body = request.body as { plan_code?: string; billing_interval?: 'month' | 'year' }
    const billingInterval = body.billing_interval || 'month'

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
      } catch (error: unknown) {
        const errorMessage = isStripeError(error) 
          ? error.message 
          : getErrorMessage(error)
        reply.code(500)
        return { 
          error: 'stripe_customer_creation_failed', 
          message: errorMessage || 'Failed to create Stripe customer' 
        }
      }
    }

    try {
      const priceId = billingInterval === 'year' 
        ? (config.billing.stripe.priceIdPlusAnnual || config.billing.stripe.priceIdPlus)
        : config.billing.stripe.priceIdPlus

      if (!priceId) {
        reply.code(500)
        return { 
          error: 'price_not_configured', 
          message: `Price ID not configured for ${billingInterval} billing` 
        }
      }

      const trialDays = config.billing.stripe.trialDays
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${config.billing.stripe.frontendBaseUrl}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.billing.stripe.frontendBaseUrl}/plus/failed?checkout=cancel`,
        ...(trialDays > 0 ? { subscription_data: { trial_period_days: trialDays } } : {}),
        metadata: {
          user_id: user.user_id,
          plan_code: 'plus',
          billing_interval: billingInterval,
        },
      })

      return {
        url: session.url,
        session_id: session.id,
      }
    } catch (error: unknown) {
      const errorMessage = isStripeError(error) 
        ? error.message 
        : getErrorMessage(error)
      reply.code(500)
      return { 
        error: 'stripe_session_creation_failed', 
        message: errorMessage || 'Failed to create checkout session' 
      }
    }
  } catch (error: unknown) {
    reply.code(500)
    return { 
      error: 'internal_error', 
      message: 'An unexpected error occurred' 
    }
  }
}

export const checkoutSessionRoutes = async (app: FastifyInstance) => {
  app.post('/billing/checkout-session', { preHandler: requireAuth() }, createCheckoutHandler)
  
  // Add route that matches frontend proxy path
  app.post('/stripe/create-checkout', { preHandler: requireAuth() }, createCheckoutHandler)
}
