import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { AppError, ValidationError } from '../../../../shared/errors'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { getUserPlan } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'

const planeAPool = getPool(config.db.planeAUrl)

const verifySessionSchema = z.object({
  // Stripe Checkout Session IDs look like `cs_test_...` / `cs_live_...` (not UUIDs).
  sessionId: z.string().min(1).refine((value) => value.startsWith('cs_'), 'Invalid sessionId'),
})

export const verifySessionRoutes = async (app: FastifyInstance) => {
  app.post('/billing/verify-session', { preHandler: requireAuth() }, async (request) => {
    const user = request.user!
    
    if (!isStripeConfigured()) {
      throw new AppError('Billing not configured', {
        statusCode: 500,
        code: 'billing_not_configured',
      })
    }

    let body: { sessionId: string }
    try {
      body = verifySessionSchema.parse(request.body ?? {})
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', {
          details: error.issues,
          cause: error,
        })
      }
      throw error
    }

    try {
      const stripe = getStripeClient()
      const session = await stripe.checkout.sessions.retrieve(body.sessionId)
      
      // Verify session belongs to this user
      const plan = await getUserPlan(planeAPool, user.user_id)
      const sessionCustomerId = typeof session.customer === 'string' ? session.customer : null
      if (!plan || !plan.stripe_customer_id || plan.stripe_customer_id !== sessionCustomerId) {
        throw new AppError('Session does not belong to user', {
          statusCode: 403,
          code: 'session_mismatch',
        })
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
      throw new AppError(errorMessage || 'Failed to verify session', {
        statusCode: 500,
        code: 'verification_failed',
        cause: error,
      })
    }
  })
}
