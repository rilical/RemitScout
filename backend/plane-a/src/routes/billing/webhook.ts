import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import Stripe from 'stripe'
import ipaddr from 'ipaddr.js'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { recordBusinessMetric } from '../../../../shared/business-metrics'
import { getRedisClient } from '../../../../shared/redis'
import { getStripeClient } from '../../services/stripe-client'
import { sendPlusConfirmationEmail } from '../../services/billing-email'
import type { IUserPlanRepository } from '../../repositories'
import { ValidationError } from '../../../../shared/errors'

const logger = createLogger('plane-a.billing.webhook')

const hashPayload = (payload: Buffer) => {
  return createHash('sha256').update(payload).digest('hex')
}

const extractUserId = async (event: Stripe.Event, userPlanRepo: IUserPlanRepository) => {
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

const splitCsv = (value: string | undefined) => {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const resolveClientIp = (request: any): string | null => {
  const forwarded = request?.headers?.['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (typeof raw === 'string' && raw.trim()) {
    const first = raw.split(',')[0]?.trim() || ''
    if (first) return first
  }
  const direct = request?.ip
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  return null
}

const isIpInCidr = (ip: string, cidr: string): boolean => {
  try {
    const parsedIp = ipaddr.parse(ip)
    const normalizedCidr = cidr.includes('/') ? cidr : `${cidr}/32`
    const [range, prefix] = ipaddr.parseCIDR(normalizedCidr)
    return parsedIp.match(range, prefix)
  } catch (error) {
    logger.debug('stripe_webhook_ip_cidr_parse_failed', {
      ip,
      cidr,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const assertIpAllowlisted = (request: any, envVarName: string) => {
  const allowlist = splitCsv(process.env[envVarName])
  if (allowlist.length === 0) return { ok: true as const }
  const ip = resolveClientIp(request)
  if (!ip) {
    return { ok: false as const, reason: 'ip_unavailable' }
  }
  const allowed = allowlist.some((cidr) => isIpInCidr(ip, cidr))
  return allowed ? { ok: true as const } : { ok: false as const, reason: 'ip_not_allowlisted', ip }
}

export const webhookRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const webhookEventRepo = repositories.billingWebhookEvent
  const userPlanRepo = repositories.userPlan

  app.post('/billing/webhook', async (request, reply) => {
    let metricEventType = 'unknown'
    let metricStatus = 'unknown'

    try {
      if (!config.billing.stripe.webhookSecret || !config.billing.stripe.secretKey) {
        metricStatus = 'billing_not_configured'
        reply.code(500)
        return { error: 'billing_not_configured' }
      }

      // Optional IP allowlist hardening (recommended in staging/prod).
      // When unset/empty, rely on signature verification only.
      const ipAllow = assertIpAllowlisted(request, 'STRIPE_WEBHOOK_IP_ALLOWLIST')
      if (!ipAllow.ok) {
        metricStatus = ipAllow.reason
        reply.code(403)
        return { error: 'forbidden', message: 'IP not allowed.' }
      }

      const rawBody = request.body
      const rawBodyBuffer = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(
            typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody ?? {}),
            'utf8',
          )
      const signature = request.headers['stripe-signature']
      if (typeof signature !== 'string') {
        metricStatus = 'missing_signature'
                throw new ValidationError('Invalid request', { details: { error: 'missing_signature' } })
      }

      if (!Buffer.isBuffer(rawBody)) {
        metricStatus = 'missing_raw_body'
                throw new ValidationError('Invalid request', { details: { error: 'missing_raw_body' } })
      }

      const stripe = getStripeClient()
      let event: Stripe.Event
      try {
        const secrets = splitCsv(config.billing.stripe.webhookSecret)
        const candidates = secrets.length > 0 ? secrets : [config.billing.stripe.webhookSecret]
        let verified: Stripe.Event | null = null
        for (const [secretIndex, secret] of candidates.entries()) {
          try {
            verified = stripe.webhooks.constructEvent(rawBody, signature, secret)
            break
          } catch (error) {
            logger.debug('stripe_webhook_signature_check_failed', {
              attempt: secretIndex + 1,
              error: error instanceof Error ? error.message : String(error),
            })
            continue
          }
        }
        if (!verified) {
          metricStatus = 'invalid_signature'
                    throw new ValidationError('Invalid request', { details: { error: 'invalid_signature' } })
        }
        event = verified
      } catch (_error) {
        metricStatus = 'invalid_signature'
                throw new ValidationError('Invalid request', { details: { error: 'invalid_signature' } })
      }

      metricEventType = event.type

      // Replay protection (defense-in-depth): short-circuit if we've processed this event recently.
      const redis = await getRedisClient()
      if (redis) {
        try {
          const seen = await redis.get(`plane-a:stripe:webhook:processed:${event.id}`)
          if (seen) {
            metricStatus = 'duplicate'
            return { received: true, duplicate: true }
          }
        } catch (error) {
          logger.warn('stripe_webhook_redis_replay_check_failed', {
            eventId: event.id,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      const payloadHash = hashPayload(rawBodyBuffer)
      const isNewEvent = await webhookEventRepo.insertEvent({
        eventId: event.id,
        type: event.type,
        payloadHash,
        payloadJson: event,
      })

      if (!isNewEvent) {
        metricStatus = 'duplicate'
        if (redis) {
          try {
            await redis.set(`plane-a:stripe:webhook:processed:${event.id}`, '1', { EX: 24 * 60 * 60 })
          } catch (error) {
            logger.warn('stripe_webhook_redis_replay_mark_failed', {
              eventId: event.id,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
        return { received: true, duplicate: true }
      }

      const userId = await extractUserId(event, userPlanRepo)
      const existingPlan = userId ? await userPlanRepo.getUserPlan(userId) : null
      const wasPlus =
        existingPlan?.plan_code === 'plus' &&
        (existingPlan.status === 'active' || existingPlan.status === 'trialing')

      let processingSucceeded = false
      let processingError = false

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

            if (!wasPlus) {
              await sendPlusConfirmationEmail(planeAPool, userId, {
                planName: 'Remit-Scout Plus',
                trialDays: config.billing.stripe.trialDays || null,
              })
            }
            
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
          processingError = true
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

      if (redis) {
        try {
          await redis.set(`plane-a:stripe:webhook:processed:${event.id}`, '1', { EX: 24 * 60 * 60 })
        } catch (error) {
          logger.warn('stripe_webhook_redis_replay_mark_failed', {
            eventId: event.id,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      metricStatus = !userId ? 'no_user' : processingSucceeded ? 'processed' : processingError ? 'failed' : 'ignored'
      return { received: true }
    } catch (error: unknown) {
      metricStatus = 'crash'
      throw error
    } finally {
      recordBusinessMetric('billing_webhook_events_total', 1, {
        event_type: metricEventType,
        status: metricStatus,
      })
    }
  })
}
