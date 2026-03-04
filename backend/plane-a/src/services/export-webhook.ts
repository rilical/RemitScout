/**
 * Export Webhook Delivery Service
 *
 * Fires async POST requests to institutional clients' webhook_url
 * when an export job completes (status = 'done' or 'failed').
 *
 * - HMAC-SHA256 signature in X-Webhook-Signature header
 * - 10s timeout per attempt
 * - 3 retry attempts with exponential backoff (1s, 2s, 4s)
 * - Fire-and-forget: never blocks the export completion flow
 */

import { createHmac } from 'crypto'
import { setTimeout as sleep } from 'timers/promises'
import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.export-webhook')

const WEBHOOK_TIMEOUT_MS = 10_000
const WEBHOOK_MAX_RETRIES = 3
const WEBHOOK_BACKOFF_BASE_MS = 1_000

type WebhookClientInfo = {
  webhook_url: string
  webhook_secret: string
}

export type ExportWebhookPayload = {
  event: 'export.completed'
  exportId: string
  status: 'done' | 'failed'
  completedAt: string
  downloadUrl: string | null
}

/**
 * Look up the institutional client's webhook configuration by user_id.
 *
 * Links user_id -> silver.api_key.key_hash -> institutional_client.api_key_hash
 * to find the institutional client, then returns webhook_url and webhook_secret
 * if both are configured.
 *
 * Returns null if the user has no institutional client record or no webhook configured.
 */
const getClientWebhookInfo = async (
  pool: Pool,
  userId: string,
): Promise<WebhookClientInfo | null> => {
  try {
    const result = await query<WebhookClientInfo>(
      `SELECT ic.webhook_url, ic.webhook_secret
       FROM public.institutional_client ic
       JOIN silver.api_key ak ON ak.key_hash = ic.api_key_hash
       WHERE ak.user_id = $1
         AND ak.revoked_at IS NULL
         AND ic.status = 'active'
         AND ic.webhook_url IS NOT NULL
         AND ic.webhook_secret IS NOT NULL
       LIMIT 1`,
      [userId],
      pool,
    )
    return result.rows[0] ?? null
  } catch (error) {
    logger.warn('webhook_client_lookup_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Compute HMAC-SHA256 signature for a webhook payload.
 */
const computeSignature = (secret: string, payload: string): string => {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Deliver the webhook payload with retries and exponential backoff.
 * This function is designed to be called fire-and-forget (no await needed at call site).
 */
const deliverWebhook = async (
  webhookUrl: string,
  webhookSecret: string,
  payload: ExportWebhookPayload,
): Promise<void> => {
  const payloadString = JSON.stringify(payload)
  const signature = computeSignature(webhookSecret, payloadString)

  for (let attempt = 0; attempt < WEBHOOK_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: payloadString,
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      })

      if (response.ok) {
        logger.info('export_webhook_delivered', {
          export_id: payload.exportId,
          status: payload.status,
          attempt: attempt + 1,
          status_code: response.status,
        })
        return
      }

      logger.warn('export_webhook_non_2xx', {
        export_id: payload.exportId,
        attempt: attempt + 1,
        status_code: response.status,
      })
    } catch (error) {
      logger.warn('export_webhook_attempt_failed', {
        export_id: payload.exportId,
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < WEBHOOK_MAX_RETRIES - 1) {
      const delayMs = WEBHOOK_BACKOFF_BASE_MS * Math.pow(2, attempt)
      await sleep(delayMs)
    }
  }

  logger.error('export_webhook_delivery_exhausted', {
    export_id: payload.exportId,
    status: payload.status,
    max_retries: WEBHOOK_MAX_RETRIES,
  })
}

/**
 * Fire-and-forget webhook delivery for export completion.
 *
 * Looks up the institutional client's webhook_url by user_id, and if configured,
 * asynchronously delivers an export.completed event. This function logs errors
 * internally and never throws.
 */
export const fireExportWebhook = (
  pool: Pool,
  params: {
    exportId: string
    userId: string
    status: 'done' | 'failed'
    completedAt: Date
    downloadUrl: string | null
  },
): void => {
  // Fire-and-forget: start the async chain but don't await it
  void (async () => {
    try {
      const clientInfo = await getClientWebhookInfo(pool, params.userId)
      if (!clientInfo) {
        return
      }

      const payload: ExportWebhookPayload = {
        event: 'export.completed',
        exportId: params.exportId,
        status: params.status,
        completedAt: params.completedAt.toISOString(),
        downloadUrl: params.downloadUrl,
      }

      await deliverWebhook(clientInfo.webhook_url, clientInfo.webhook_secret, payload)
    } catch (error) {
      logger.error('export_webhook_unexpected_error', {
        export_id: params.exportId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })()
}
