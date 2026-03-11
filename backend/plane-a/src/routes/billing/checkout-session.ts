import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { AppError, ConflictError, ValidationError } from '../../../../shared/errors'
import { recordBusinessMetric } from '../../../../shared/business-metrics'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'

const logger = createLogger('plane-a.billing.checkout-session')
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

    if (body.plan_code !== 'plus') {
      throw new ValidationError('Unsupported plan code', {
        details: {
          error: 'unsupported_plan_code',
          message: 'Enterprise plans are provisioned through sales.',
          plan_code: body.plan_code,
        },
      })
    }

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
    if (
      plan.plan_code === 'plus'
      && (plan.status === 'active' || plan.status === 'trialing')
      && plan.stripe_subscription_id
    ) {
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

        // Atomic compare-and-set: only write if no other request has set it yet.
        const result = await query(
          `UPDATE silver.user_plan
           SET stripe_customer_id = $1, updated_at = NOW()
           WHERE user_id = $2 AND stripe_customer_id IS NULL
           RETURNING stripe_customer_id`,
          [customerId, user.user_id],
          planeAPool,
        )

        if (result.rowCount === 0) {
          // Another request already set the customer ID — clean up the orphan.
          logger.warn('stripe_customer_race_detected', {
            user_id: user.user_id,
            orphaned_customer_id: customerId,
          })

          try {
            await stripe.customers.del(customerId)
          } catch (delError: unknown) {
            logger.error('stripe_orphan_cleanup_failed', {
              user_id: user.user_id,
              orphaned_customer_id: customerId,
              error: isStripeError(delError) ? delError.message : getErrorMessage(delError),
            })
          }

          // Re-read to get the winning customer ID.
          const updatedPlan = await getUserPlan(planeAPool, user.user_id)
          if (!updatedPlan?.stripe_customer_id) {
            throw new AppError('Stripe customer ID missing after race resolution', {
              statusCode: 500,
              code: 'stripe_customer_race_unresolved',
            })
          }
          customerId = updatedPlan.stripe_customer_id
        }
      } catch (error: unknown) {
        if (error instanceof AppError) throw error
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
        allow_promotion_codes: true,
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
      throw new ValidationError('Invalid request data', { details: error.issues, cause: error })
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
