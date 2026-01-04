import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import Stripe from 'stripe'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { getStripeClient } from '../../services/stripe-client'
import { BillingWebhookEventRepository, UserPlanRepository } from '../../repositories'

const logger = createLogger('plane-a.billing.webhook')

const hashPayload = (payload: Buffer) => {
  return createHash('sha256').update(payload).digest('hex')
}

const extractUserId = async (event: Stripe.Event, userPlanRepo: UserPlanRepository) => {
  const dataObject = event.data.object as { metadata?: { user_id?: string }; customer?: string }
  const metadataUserId = dataObject?.metadata?.user_id
  if (metadataUserId) {
    return String(metadataUserId)
  }
  const customerId = dataObject?.customer
  if (typeof customerId === 'string') {
    const plan = await userPlanRepo.getUserPlanByCustomerId(customerId)
    return plan?.user_id || null
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
  app.post('/billing/webhook', async (request, reply) => {
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

    const planeAPool = getPool(config.db.planeAUrl)
    const webhookEventRepo = new BillingWebhookEventRepository(planeAPool)
    const userPlanRepo = new UserPlanRepository(planeAPool)

    const payloadHash = hashPayload(rawBody)
    const isNewEvent = await webhookEventRepo.insertEvent({
      eventId: event.id,
      type: event.type,
      payloadHash,
      payloadJson: event,
    })

    if (!isNewEvent) {
      return { received: true, duplicate: true }
    }

    const userId = await extractUserId(event, userPlanRepo)

    let processingSucceeded = false

    if (userId) {
      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as { subscription?: string | Stripe.Subscription | null }
          const subscriptionId = typeof session?.subscription === 'string' 
            ? session.subscription 
            : session?.subscription && typeof session.subscription === 'object' && 'id' in session.subscription
            ? session.subscription.id
            : null
          
          await userPlanRepo.updatePlan({
            user_id: userId,
            plan_code: 'plus',
            status: 'active',
            stripe_subscription_id: subscriptionId,
          })
          
          logger.info('webhook_checkout_completed', {
            eventId: event.id,
            userId,
            subscriptionId,
          })
          
          processingSucceeded = true
        }

        if (event.type === 'customer.subscription.deleted') {
          await userPlanRepo.updatePlan({
            user_id: userId,
            plan_code: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          
          logger.info('webhook_subscription_deleted', {
            eventId: event.id,
            userId,
          })
          
          processingSucceeded = true
        } else if (event.type.startsWith('customer.subscription.')) {
          const subscription = event.data.object as { 
            status?: string
            id?: string
            current_period_end?: number
          }
          const status = subscription?.status
          
          if (!status || typeof status !== 'string') {
            logger.warn('webhook_invalid_subscription_status', {
              eventId: event.id,
              userId,
              subscriptionId: subscription?.id,
            })
            processingSucceeded = true
          } else {
            const currentPeriodEnd = toUnixTimestamp(subscription?.current_period_end)

            let planCode: string | undefined
            if (status === 'active' || status === 'trialing') {
              planCode = 'plus'
            } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
              planCode = 'free'
            }

            await userPlanRepo.updatePlan({
              user_id: userId,
              plan_code: planCode,
              status: status,
              stripe_subscription_id: subscription?.id || null,
              current_period_end: currentPeriodEnd,
            })
            
            logger.info('webhook_subscription_updated', {
              eventId: event.id,
              userId,
              status,
              planCode,
            })
            
            processingSucceeded = true
          }
        }

        if (event.type === 'invoice.payment_failed') {
          await userPlanRepo.updatePlan({
            user_id: userId,
            status: 'past_due',
          })
          
          logger.info('webhook_payment_failed', {
            eventId: event.id,
            userId,
          })
          
          processingSucceeded = true
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        logger.error('webhook_processing_failed', {
          eventId: event.id,
          eventType: event.type,
          userId,
          error: errorMessage,
          stack: errorStack,
        })
        processingSucceeded = false
      }
    }

    if (processingSucceeded || !userId) {
      await webhookEventRepo.markAsProcessed(event.id)
    }

    return { received: true }
  })
}
