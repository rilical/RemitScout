import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { AppError, ConflictError, ValidationError } from '../../../../shared/errors'
import { recordBusinessMetric } from '../../../../shared/business-metrics'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan, updatePlanFromStripe } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'

const planeAPool = getPool(config.db.planeAUrl)

const checkoutSessionSchema = z.object({
  // Valid plan codes are centrally defined (see entitlements), but duplicated here for runtime validation.
  plan_code: z.enum(['free', 'plus', 'enterprise']),
  billing_interval: z.enum(['month', 'year']).default('month'),
})

const createCheckoutHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
  const user = request.user!
  let metricStatus: 'success' | 'error' = 'error'

  try {
    const body = checkoutSessionSchema.parse(request.body)
    const billingInterval = body.billing_interval || 'month'

    // Validate input before surfacing server configuration errors.
    if (!isStripeConfigured() || !config.billing.stripe.priceIdPlus) {
      throw new AppError('Billing not configured', { statusCode: 500, code: 'billing_not_configured' })
    }

    await ensureUserPlan(planeAPool, user.user_id)
    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan) {
      throw new AppError('Plan not found', { statusCode: 500, code: 'plan_not_found' })
    }

    // Check if user already has active plus subscription
    if (plan.plan_code === 'plus' && plan.status === 'active' && plan.stripe_subscription_id) {
      throw new ConflictError('User already has an active subscription')
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
        throw new AppError('Failed to create Stripe customer', {
          statusCode: 500,
          code: 'stripe_customer_creation_failed',
          details: { message: errorMessage },
          cause: error,
        })
      }
    }

    try {
      const priceId = billingInterval === 'year' 
        ? (config.billing.stripe.priceIdPlusAnnual || config.billing.stripe.priceIdPlus)
        : config.billing.stripe.priceIdPlus

      if (!priceId) {
        throw new AppError(`Price ID not configured for ${billingInterval} billing`, {
          statusCode: 500,
          code: 'price_not_configured',
        })
      }

      const trialDays = config.billing.stripe.trialDays
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        // Helps correlate Stripe sessions/subscriptions back to our internal user ID.
        client_reference_id: user.user_id,
        // Stripe-hosted Checkout theming is controlled in Stripe Dashboard (Branding + custom domain).
        // We still set locale to improve UX.
        locale: 'auto',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${config.billing.stripe.frontendBaseUrl}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.billing.stripe.frontendBaseUrl}/plus/failed?checkout=cancel`,
        subscription_data: {
          ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
          metadata: {
            user_id: user.user_id,
            plan_code: 'plus',
            billing_interval: billingInterval,
          },
        },
        metadata: {
          user_id: user.user_id,
          plan_code: 'plus',
          billing_interval: billingInterval,
        },
      })

      metricStatus = 'success'
      return {
        url: session.url,
        session_id: session.id,
      }
    } catch (error: unknown) {
      const errorMessage = isStripeError(error) 
        ? error.message 
        : getErrorMessage(error)
      throw new AppError('Failed to create checkout session', {
        statusCode: 500,
        code: 'stripe_session_creation_failed',
        details: { message: errorMessage },
        cause: error,
      })
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', { details: error.errors, cause: error })
    }
    throw error
  } finally {
    recordBusinessMetric('billing_checkout_total', 1, {
      event_type: 'checkout_session',
      status: metricStatus,
    })
  }
}

export const checkoutSessionRoutes = async (app: FastifyInstance) => {
  app.post('/billing/checkout-session', { preHandler: requireAuth() }, createCheckoutHandler)
  
  // Add route that matches frontend proxy path
  app.post('/stripe/create-checkout', { preHandler: requireAuth() }, createCheckoutHandler)
}
