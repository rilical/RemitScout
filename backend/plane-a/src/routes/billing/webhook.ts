import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import Stripe from 'stripe'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { getStripeClient } from '../../services/stripe-client'
import { updatePlanFromStripe } from '../../services/user-plan'

const planeAPool = getPool(config.db.planeAUrl)

const hashPayload = (payload: Buffer) => {
  return createHash('sha256').update(payload).digest('hex')
}

const lookupUserIdByCustomerId = async (customerId: string) => {
  const result = await planeAPool.query<{ user_id: string }>(
    `SELECT user_id FROM silver.user_plan WHERE stripe_customer_id = $1`,
    [customerId]
  )
  return result.rows[0]?.user_id || null
}

const extractUserId = async (event: Stripe.Event) => {
  const dataObject = event.data.object as any
  const metadataUserId = dataObject?.metadata?.user_id
  if (metadataUserId) {
    return String(metadataUserId)
  }
  const customerId = dataObject?.customer
  if (typeof customerId === 'string') {
    return await lookupUserIdByCustomerId(customerId)
  }
  return null
}

const toUnixTimestamp = (value: unknown) => {
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString()
  }
  return null
}

export const webhookRoutes = async (app: FastifyInstance) => {
  app.post('/api/billing/webhook', async (request, reply) => {
    if (!config.billing.stripe.webhookSecret || !config.billing.stripe.secretKey) {
      reply.code(500)
      return { error: 'billing_not_configured' }
    }

    const signature = request.headers['stripe-signature']
    if (typeof signature !== 'string') {
      reply.code(400)
      return { error: 'missing_signature' }
    }

    const rawBody = request.body
    if (!Buffer.isBuffer(rawBody)) {
      reply.code(400)
      return { error: 'missing_raw_body' }
    }

    const stripe = getStripeClient()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, config.billing.stripe.webhookSecret)
    } catch (_error) {
      reply.code(400)
      return { error: 'invalid_signature' }
    }

    const payloadHash = hashPayload(rawBody)
    const insertResult = await planeAPool.query(
      `
      INSERT INTO silver.billing_webhook_event (event_id, type, payload_hash, payload_json)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (event_id) DO NOTHING
      `,
      [event.id, event.type, payloadHash, event]
    )

    if (insertResult.rowCount === 0) {
      return { received: true, duplicate: true }
    }

    const userId = await extractUserId(event)

    if (userId) {
      if (event.type === 'checkout.session.completed') {
        await updatePlanFromStripe(planeAPool, {
          user_id: userId,
          plan_code: 'plus',
          status: 'active',
        })
      }

      if (event.type.startsWith('customer.subscription.')) {
        const subscription = event.data.object as any
        const status = subscription?.status
        const currentPeriodEnd = toUnixTimestamp(subscription?.current_period_end)

        await updatePlanFromStripe(planeAPool, {
          user_id: userId,
          plan_code: status ? 'plus' : undefined,
          status: typeof status === 'string' ? status : undefined,
          stripe_subscription_id: subscription?.id || null,
          current_period_end: currentPeriodEnd,
        })
      }

      if (event.type === 'invoice.payment_failed') {
        await updatePlanFromStripe(planeAPool, {
          user_id: userId,
          status: 'past_due',
        })
      }
    }

    await planeAPool.query(
      `UPDATE silver.billing_webhook_event SET processed_at = NOW() WHERE event_id = $1`,
      [event.id]
    )

    return { received: true }
  })
}
