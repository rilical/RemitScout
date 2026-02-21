import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getErrorMessage } from '../types/errors'

const logger = createLogger('plane-a.admin-webhooks')

type AdminWebhookEvent =
  | 'enterprise_access_granted'
  | 'enterprise_access_revoked'
  | 'institutional_client_created'
  | 'institutional_client_status_changed'
  | 'institutional_api_key_rotated'
  | 'provider_stale_threshold'
  | 'export_job_failure'

type AdminWebhookPayload = {
  title: string
  event: AdminWebhookEvent
  actorId?: string
  metadata?: Record<string, unknown>
}

const normalizeWebhookUrl = () => {
  const raw = config.alerts.slackWebhookUrl || ''
  const trimmed = raw.trim()
  if (!trimmed || !trimmed.startsWith('https://')) {
    return null
  }
  return trimmed
}

const toMarkdownList = (metadata?: Record<string, unknown>) => {
  if (!metadata) return ''
  const entries = Object.entries(metadata)
  if (!entries.length) return ''
  return entries
    .map(([key, value]) => `• *${key}*: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')
}

export const sendAdminWebhook = async (payload: AdminWebhookPayload) => {
  const webhookUrl = normalizeWebhookUrl()
  if (!webhookUrl) {
    return
  }

  const details = toMarkdownList(payload.metadata)
  const textLines = [
    `*${payload.title}*`,
    `event=${payload.event}`,
    payload.actorId ? `actor=${payload.actorId}` : null,
    details || null,
  ].filter(Boolean)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text: textLines.join('\n'),
      }),
    })

    if (!response.ok) {
      logger.warn('admin_webhook_delivery_failed', {
        event: payload.event,
        status: response.status,
      })
    }
  }
  catch (error) {
    logger.warn('admin_webhook_delivery_failed', {
      event: payload.event,
      error: getErrorMessage(error),
    })
  }
}
