import { setTimeout as sleep } from 'timers/promises'
import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import type { AnomalyResult } from './anomaly-detector'

const logger = createLogger('plane-b.signals.webhook')

type WebhookSubscription = {
  subscription_id: string
  client_id: string
  webhook_url: string
  corridor_filter: string[] | null
  provider_filter: string[] | null
  z_score_threshold: number
}

type SignalPayload = {
  type: 'ARBITRAGE_SIGNAL'
  corridor: string
  provider: string
  current_rate: number
  avg_24h: number
  deviation_sigma: number
  timestamp: string
}

export const dispatchSignal = async (
  pool: Pool,
  corridorId: string,
  providerId: string,
  anomaly: AnomalyResult,
): Promise<void> => {
  if (!anomaly.detected || anomaly.zScore === null) return

  await query(
    `INSERT INTO gold.signal_history
     (signal_type, provider_id, corridor_id, current_rate, avg_24h, stddev_24h, z_score, detected_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      'ARBITRAGE_SIGNAL',
      providerId,
      corridorId,
      anomaly.currentRate,
      anomaly.avg24h,
      anomaly.stdDev24h,
      anomaly.zScore,
    ],
    pool,
  )

  const subscriptions = await query<WebhookSubscription>(
    `SELECT subscription_id, client_id, webhook_url, corridor_filter, provider_filter, z_score_threshold
       FROM gold.webhook_subscriptions
      WHERE active = true
        AND (array_length(corridor_filter, 1) IS NULL OR $1 = ANY(corridor_filter))
        AND (array_length(provider_filter, 1) IS NULL OR $2 = ANY(provider_filter))
        AND z_score_threshold <= $3`,
    [corridorId, providerId, anomaly.zScore],
    pool,
  )

  if (!subscriptions.rows.length) {
    return
  }

  const payload: SignalPayload = {
    type: 'ARBITRAGE_SIGNAL',
    corridor: corridorId,
    provider: providerId,
    current_rate: anomaly.currentRate,
    avg_24h: anomaly.avg24h ?? 0,
    deviation_sigma: anomaly.zScore,
    timestamp: new Date().toISOString(),
  }

  for (const subscription of subscriptions.rows) {
    await dispatchWebhook(subscription, payload)
  }
}

const dispatchWebhook = async (
  subscription: WebhookSubscription,
  payload: SignalPayload,
): Promise<void> => {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(subscription.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        logger.info('webhook_delivered', {
          subscription_id: subscription.subscription_id,
          status_code: response.status,
          success: true,
          retry_count: retryCount,
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
      logger.error('webhook_delivered', {
        subscription_id: subscription.subscription_id,
        status_code: null,
        success: false,
        retry_count: retryCount,
        error,
      })
    }

    retryCount += 1
    if (retryCount < maxRetries) {
      const backoffMs = Math.pow(2, retryCount) * 1000
      await sleep(backoffMs)
    }
  }

  logger.error('webhook_max_retries_exceeded', {
    subscription_id: subscription.subscription_id,
    status_code: null,
    success: false,
    retry_count: maxRetries,
  })
}
