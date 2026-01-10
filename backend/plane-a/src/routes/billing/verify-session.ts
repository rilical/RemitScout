import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { getUserPlan, updatePlanFromStripe } from '../../services/user-plan'
import { sendPlusConfirmationEmail } from '../../services/billing-email'
import { getErrorMessage, isStripeError } from '../../types/errors'

const planeAPool = getPool(config.db.planeAUrl)

export const verifySessionRoutes = async (app: FastifyInstance) => {
  app.post('/billing/verify-session', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    
    if (!config.billing.stripe.secretKey && !config.billing.stripe.mockEnabled) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    const body = request.body as { sessionId?: string }
    if (!body?.sessionId) {
      reply.code(400)
      return { error: 'missing_session_id' }
    }

    try {
      const stripe = getStripeClient()
      const session = await stripe.checkout.sessions.retrieve(body.sessionId)
      
      // Verify session belongs to this user
      const plan = await getUserPlan(planeAPool, user.user_id)
      const sessionCustomerId = typeof session.customer === 'string' ? session.customer : null
      if (!plan || !plan.stripe_customer_id || plan.stripe_customer_id !== sessionCustomerId) {
        reply.code(403)
        return { error: 'session_mismatch' }
      }

      if (config.billing.stripe.mockEnabled) {
        const isComplete = session.status === 'complete' || session.payment_status === 'paid'
        if (isComplete) {
          const wasPlus =
            plan.plan_code === 'plus' && (plan.status === 'active' || plan.status === 'trialing')
          let subscriptionId: string | null = null
          if (typeof session.subscription === 'string') {
            subscriptionId = session.subscription
          }
          if (!subscriptionId && plan.stripe_customer_id) {
            const list = await stripe.subscriptions.list({ customer: plan.stripe_customer_id, limit: 1 })
            subscriptionId = list.data[0]?.id ?? null
          }
          await updatePlanFromStripe(planeAPool, {
            user_id: user.user_id,
            plan_code: 'plus',
            status: 'active',
            stripe_subscription_id: subscriptionId,
          })
          if (!wasPlus) {
            await sendPlusConfirmationEmail(planeAPool, user.user_id, {
              planName: 'Remit-Scout Plus',
              trialDays: config.billing.stripe.trialDays || null,
            })
          }
        }
      }

      return {
        verified: true,
        session_id: session.id,
        status: session.status,
        payment_status: session.payment_status,
      }
    } catch (error: unknown) {
      const errorMessage = isStripeError(error) 
        ? error.message 
        : getErrorMessage(error)
      reply.code(500)
      return { 
        error: 'verification_failed', 
        message: errorMessage || 'Failed to verify session' 
      }
    }
  })
}
