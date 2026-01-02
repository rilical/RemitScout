import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient } from '../../services/stripe-client'
import { getUserPlan } from '../../services/user-plan'

const planeAPool = getPool(config.db.planeAUrl)

export const verifySessionRoutes = async (app: FastifyInstance) => {
  app.post('/stripe/verify-session', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    
    if (!config.billing.stripe.secretKey) {
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

      return {
        verified: true,
        session_id: session.id,
        status: session.status,
        payment_status: session.payment_status,
      }
    } catch (error: any) {
      reply.code(500)
      return { 
        error: 'verification_failed', 
        message: error.message || 'Failed to verify session' 
      }
    }
  })
}

