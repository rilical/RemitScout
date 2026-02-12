/**
 * Multi-channel notification dispatcher.
 * 
 * This service handles dispatching notifications across multiple channels:
 * - HTTP webhooks (current implementation)
 * - Email (Sprint 4)
 * - SMS (Sprint 4)
 * - Push notifications (Sprint 4)
 * - In-app notifications (Sprint 4)
 * 
 * Architecture:
 * 1. Receives signal from anomaly detector
 * 2. Persists signal to history (audit trail)
 * 3. Loads matching subscriptions from database
 * 4. Dispatches to appropriate channels based on subscription preferences
 * 
 * @sprint Sprint 4: Add email, SMS, and push channel implementations
 */

import { createHmac } from 'crypto'
import { setTimeout as sleep } from 'timers/promises'
import type { Pool } from 'pg'

import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { sendJsonMessage } from '../../../shared/sqs'
import { withWorkerRetry } from '../../../shared/worker-retry'
import type { AnomalyResult } from '../signals/anomaly-detector'
import type { WebhookSubscriptionRecord } from '../repositories'
import { SignalRepository, WebhookRepository } from '../repositories'
import { WEBHOOK_CONFIG, NOTIFICATION_CONFIG, SIGNAL_TYPES } from './config'
import { recordNotificationMetric, recordNotificationDuration } from './aws-services'
import type { SignalType, WebhookPayload } from './types'

const logger = createLogger('plane-b.notifications.dispatcher')
const notificationsQueueUrl = config.queues.notifications.url
const notificationsQueueMode = config.queues.notifications.mode
let notifiedQueueMisconfig = false

export type NotificationsQueueMessage = {
  signalType: SignalType | string
  corridorId: string
  providerId: string
  anomaly: {
    zScore: number
    currentRate: number
    avg24h: number | null
    stdDev24h: number | null
    direction: string | null
  }
  requestedAt: string
}

const normalizeWebhookSignalType = (value: string): WebhookPayload['type'] | null => {
  if (value === 'ARBITRAGE_SIGNAL') {
    return 'ARBITRAGE_SIGNAL'
  }
  return null
}

const normalizeDirection = (
  value: string | null | undefined,
): WebhookPayload['direction'] => {
  if (value === 'above' || value === 'below' || value === 'neutral') {
    return value
  }
  return 'neutral'
}

const enqueueNotification = async (
  payload: NotificationsQueueMessage,
): Promise<boolean> => {
  if (!notificationsQueueUrl) {
    if (!notifiedQueueMisconfig && notificationsQueueMode !== 'off') {
      notifiedQueueMisconfig = true
      logger.warn('notifications_queue_disabled', { reason: 'missing_queue_url' })
    }
    return false
  }

  try {
    await withWorkerRetry(
      () => sendJsonMessage(notificationsQueueUrl, payload),
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 10000 },
    )
    return true
  } catch (error) {
    logger.warn('notifications_queue_enqueue_failed', {
      corridor_id: payload.corridorId,
      provider_id: payload.providerId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const dispatchWebhookBatch = async (
  subscriptions: WebhookSubscriptionRecord[],
  payload: WebhookPayload,
): Promise<void> => {
  if (!subscriptions.length) return

  if (NOTIFICATION_CONFIG.PARALLEL_DISPATCH) {
    const deliveryPromises = subscriptions.map(subscription =>
      dispatchWebhook(subscription, payload)
        .catch(error => {
          logger.error('webhook_dispatch_failed', {
            subscription_id: subscription.subscription_id,
            error: error instanceof Error ? error.message : String(error),
          })
        })
    )
    await Promise.allSettled(deliveryPromises)
  } else {
    for (const subscription of subscriptions) {
      await dispatchWebhook(subscription, payload)
        .catch(error => {
          logger.error('webhook_dispatch_failed', {
            subscription_id: subscription.subscription_id,
            error: error instanceof Error ? error.message : String(error),
          })
        })
    }
  }
}

/**
 * Dispatches arbitrage signal to subscribed webhooks.
 * 
 * This function orchestrates the entire webhook notification flow:
 * 1. Validates the anomaly result (must be detected with valid Z-score)
 * 2. Persists signal to signal_history table for audit trail
 * 3. Loads active webhook subscriptions matching criteria (corridor/provider/threshold)
 * 4. Sends HTTP POST to each subscriber's webhook URL in parallel
 * 5. Implements retry logic with exponential backoff for failed deliveries
 *
 * **Parallel Delivery**: All webhooks are sent concurrently to minimize latency.
 * **Security**: Each webhook includes HMAC-SHA256 signature for authentication.
 * **Retry Logic**: Up to 3 attempts with exponential backoff (1s, 2s, 4s).
 *
 * @param pool - Database connection pool
 * @param corridorId - Corridor identifier (e.g., 'US-MX-USD-MXN')
 * @param providerId - Provider identifier (e.g., 'remitly')
 * @param anomaly - Detected anomaly result with Z-score and rate deviation
 *
 * @example
 * await dispatchSignal(pool, 'US-MX-USD-MXN', 'remitly', {
 *   detected: true,
 *   zScore: 2.5,
 *   currentRate: 19.85,
 *   avg24h: 19.20,
 *   stdDev24h: 0.26,
 *   direction: 'above'
 * })
 * 
 * @sprint Sprint 4: Refactor to support multiple notification channels
 */
export const dispatchSignal = async (
  pool: Pool,
  corridorId: string,
  providerId: string,
  anomaly: AnomalyResult,
): Promise<void> => {
  if (!anomaly.detected || anomaly.zScore === null) return

  const signalRepo = new SignalRepository(pool)
  await signalRepo.insertSignal({
    signalType: 'ARBITRAGE_SIGNAL',
    providerId,
    corridorId,
    currentRate: anomaly.currentRate,
    avg24h: anomaly.avg24h,
    stdDev24h: anomaly.stdDev24h,
    zScore: anomaly.zScore,
  })

  const webhookRepo = new WebhookRepository(pool)
  const subscriptions = await webhookRepo.loadActiveSubscriptions(
    corridorId,
    providerId,
    anomaly.zScore,
  )

  if (!subscriptions.length) {
    logger.debug('no_webhook_subscriptions', {
      corridor_id: corridorId,
      provider_id: providerId,
      z_score: anomaly.zScore,
    })
    return
  }

  const payload: WebhookPayload = {
    type: SIGNAL_TYPES.ARBITRAGE_SIGNAL,
    corridor: corridorId,
    provider: providerId,
    current_rate: anomaly.currentRate,
    avg_24h: anomaly.avg24h ?? 0,
    deviation_sigma: anomaly.zScore,
    direction: anomaly.direction ?? 'neutral',
    timestamp: new Date().toISOString(),
  }

  const queued = notificationsQueueMode !== 'off'
    ? await enqueueNotification({
      signalType: SIGNAL_TYPES.ARBITRAGE_SIGNAL,
      corridorId,
      providerId,
      anomaly: {
        zScore: anomaly.zScore,
        currentRate: anomaly.currentRate,
        avg24h: anomaly.avg24h ?? null,
        stdDev24h: anomaly.stdDev24h ?? null,
        direction: anomaly.direction ?? null,
      },
      requestedAt: new Date().toISOString(),
    })
    : false

  if (notificationsQueueMode === 'queue' && queued) {
    logger.info('notifications_queued', {
      corridor_id: corridorId,
      provider_id: providerId,
      mode: notificationsQueueMode,
    })
    return
  }

  await dispatchWebhookBatch(subscriptions, payload)
}

export const dispatchQueuedSignal = async (
  pool: Pool,
  payload: NotificationsQueueMessage,
): Promise<void> => {
  if (!payload || typeof payload !== 'object') return
  if (!payload.providerId || !payload.corridorId) return
  if (typeof payload.anomaly?.zScore !== 'number') {
    logger.warn('queued_signal_invalid', {
      corridor_id: payload.corridorId,
      provider_id: payload.providerId,
    })
    return
  }

  const webhookRepo = new WebhookRepository(pool)
  const subscriptions = await webhookRepo.loadActiveSubscriptions(
    payload.corridorId,
    payload.providerId,
    payload.anomaly.zScore,
  )

  if (!subscriptions.length) {
    logger.debug('no_webhook_subscriptions', {
      corridor_id: payload.corridorId,
      provider_id: payload.providerId,
      z_score: payload.anomaly.zScore,
    })
    return
  }

  const signalType = normalizeWebhookSignalType(payload.signalType)
  if (!signalType) {
    logger.warn('queued_signal_unsupported_type', {
      corridor_id: payload.corridorId,
      provider_id: payload.providerId,
      signal_type: payload.signalType,
    })
    return
  }

  const webhookPayload: WebhookPayload = {
    type: signalType,
    corridor: payload.corridorId,
    provider: payload.providerId,
    current_rate: payload.anomaly.currentRate,
    avg_24h: payload.anomaly.avg24h ?? 0,
    deviation_sigma: payload.anomaly.zScore,
    direction: normalizeDirection(payload.anomaly.direction),
    timestamp: payload.requestedAt || new Date().toISOString(),
  }

  await dispatchWebhookBatch(subscriptions, webhookPayload)
}

/**
 * Sends webhook HTTP POST request with retry logic.
 *
 * Implements robust delivery with:
 * - HMAC-SHA256 signature for authentication
 * - Request timeout (5 seconds default)
 * - Exponential backoff retry (3 attempts default)
 * - Comprehensive error logging
 *
 * **Signature Verification**: Subscribers should verify the signature using:
 * ```typescript
 * const signature = createHmac('sha256', webhookSecret)
 *   .update(`${timestamp}.${JSON.stringify(payload)}`)
 *   .digest('hex')
 * if (signature !== requestSignature) throw new Error('Invalid signature')
 * ```
 *
 * @param subscription - Webhook subscription record from database
 * @param payload - Signal payload to send
 * 
 * @sprint Sprint 4: Extract to WebhookChannel class implementing INotificationChannel
 * @sprint Sprint 4: Add circuit breaker for failing webhooks
 * @sprint Sprint 4: Persist delivery status to webhook_deliveries table
 */
const dispatchWebhook = async (
  subscription: WebhookSubscriptionRecord,
  payload: WebhookPayload,
): Promise<void> => {
  const rawSecret = subscription.webhook_secret?.trim() ?? ''
  const secrets = rawSecret
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const currentSecret = secrets[0]
  const previousSecret = secrets[1]
  if (!currentSecret) {
    await recordNotificationMetric('webhook', 'failed', 1)
    logger.error('webhook_missing_secret', {
      subscription_id: subscription.subscription_id,
      client_id: subscription.client_id,
      webhook_url: subscription.webhook_url,
    })
    return
  }

  let retryCount = 0
  const startTime = Date.now()

  while (retryCount < WEBHOOK_CONFIG.MAX_RETRIES) {
    try {
      const timestamp = Date.now().toString()
      const payloadString = JSON.stringify(payload)

      const signature = createHmac('sha256', currentSecret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex')

      const previousSignature = previousSecret
        ? createHmac('sha256', previousSecret)
          .update(`${timestamp}.${payloadString}`)
          .digest('hex')
        : null

      const response = await fetch(subscription.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RemitScout-Signature': signature,
          ...(previousSignature ? { 'X-RemitScout-Signature-Previous': previousSignature } : {}),
          'X-RemitScout-Timestamp': timestamp,
        },
        body: payloadString,
        signal: AbortSignal.timeout(WEBHOOK_CONFIG.TIMEOUT_MS),
      })

      if (response.ok) {
        const durationMs = Date.now() - startTime
        await recordNotificationMetric('webhook', 'sent', 1)
        await recordNotificationDuration('webhook', durationMs)
        logger.info('webhook_delivered', {
          subscription_id: subscription.subscription_id,
          status_code: response.status,
          success: true,
          retry_count: retryCount,
          duration_ms: durationMs,
        })
        return
      }

      logger.warn('webhook_delivered', {
        subscription_id: subscription.subscription_id,
        status_code: response.status,
        success: false,
        retry_count: retryCount,
      })
    } catch (error) {
      const errorInfo = error instanceof Error
        ? { message: error.message, name: error.name }
        : { message: String(error) }

      logger.error('webhook_delivered', {
        subscription_id: subscription.subscription_id,
        status_code: null,
        success: false,
        retry_count: retryCount,
        error: errorInfo,
      })
    }

    retryCount += 1
    if (retryCount < WEBHOOK_CONFIG.MAX_RETRIES) {
      const backoffMs = Math.min(
        Math.pow(2, retryCount) * WEBHOOK_CONFIG.BACKOFF_BASE_MS,
        WEBHOOK_CONFIG.MAX_BACKOFF_MS
      )
      await sleep(backoffMs)
    }
  }

  const durationMs = Date.now() - startTime
  await recordNotificationMetric('webhook', 'failed', 1)
  await recordNotificationDuration('webhook', durationMs)
  logger.error('webhook_max_retries_exceeded', {
    subscription_id: subscription.subscription_id,
    status_code: null,
    success: false,
    retry_count: WEBHOOK_CONFIG.MAX_RETRIES,
    duration_ms: durationMs,
  })
}

/**
 * @sprint Sprint 4: Add email notification dispatch
 * 
 * export const dispatchEmail = async (
 *   userId: string,
 *   payload: EmailPayload
 * ): Promise<void> => {
 *   // Implement SendGrid/SES integration
 * }
 */

/**
 * @sprint Sprint 4: Add SMS notification dispatch
 * 
 * export const dispatchSMS = async (
 *   phoneNumber: string,
 *   payload: SmsPayload
 * ): Promise<void> => {
 *   // Implement Twilio/SNS integration
 * }
 */

/**
 * @sprint Sprint 4: Add push notification dispatch
 * 
 * export const dispatchPush = async (
 *   deviceToken: string,
 *   payload: PushPayload
 * ): Promise<void> => {
 *   // Implement Firebase/OneSignal integration
 * }
 */

/**
 * @sprint Sprint 4: Add multi-channel dispatch orchestrator
 * 
 * export const dispatchMultiChannel = async (
 *   pool: Pool,
 *   signal: Signal,
 *   userPreferences: NotificationPreferences
 * ): Promise<void> => {
 *   const channels: NotificationChannel[] = []
 *   
 *   if (userPreferences.email) channels.push('email')
 *   if (userPreferences.sms) channels.push('sms')
 *   if (userPreferences.push) channels.push('push')
 *   
 *   // Dispatch to all preferred channels in parallel
 * }
 */
