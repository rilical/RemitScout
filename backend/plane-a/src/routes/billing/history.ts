import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { requireAuth } from '../../plugins/auth-plugin'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { ensureUserPlan, getUserPlan } from '../../services/user-plan'
import { getErrorMessage, isStripeError } from '../../types/errors'
import { AppError, ValidationError } from '../../../../shared/errors'

const planeAPool = getPool(config.db.planeAUrl)

export const billingHistoryRoutes = async (app: FastifyInstance) => {
  app.get('/billing/history', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    if (!isStripeConfigured()) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    try {
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)

      if (!plan || !plan.stripe_customer_id) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'customer_not_found',
            message: 'No Stripe customer was found for this account.',
          },
        })
      }

      const stripe = getStripeClient()
      const invoices = await stripe.invoices.list({
        customer: plan.stripe_customer_id,
        limit: 24,
      })

      return {
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
          amount: typeof invoice.amount_paid === 'number' ? invoice.amount_paid / 100 : null,
          currency: invoice.currency ? invoice.currency.toUpperCase() : null,
          status: invoice.status ?? null,
          invoice_url: invoice.hosted_invoice_url ?? null,
        })),
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error
      }
      const errorMessage = isStripeError(error)
        ? error.message
        : getErrorMessage(error)
      reply.code(500)
      return {
        error: 'billing_history_failed',
        message: errorMessage || 'Failed to fetch billing history',
      }
    }
  })
}
