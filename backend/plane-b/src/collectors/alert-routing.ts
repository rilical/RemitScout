import type { Pool } from 'pg'
import nodemailer from 'nodemailer'

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { formatError, isError } from '../../../shared/utils/error-handling'
import type { OpsAlertRecord } from '../repositories'
import { OpsAlertRepository } from '../repositories'

type OpsAlertPayload = {
  payin_method?: string
  payout_method?: string
  collector_type?: string
  trace_id?: string
  request_fingerprint?: string
}

const logger = createLogger('plane-b.alerts')
let emailTransporter: nodemailer.Transporter | null = null

const loadOpsAlertEvent = async (pool: Pool, alertId: string) => {
  const repo = new OpsAlertRepository(pool)
  return repo.getAlert(alertId)
}

const normalizePayload = (payload: unknown): OpsAlertPayload => {
  if (!payload || typeof payload !== 'object') return {}
  return payload as OpsAlertPayload
}

const getEmailTransporter = () => {
  const emailConfig = config.alerts.email
  const hasConfig = Boolean(emailConfig.smtpHost) && emailConfig.to.length > 0 && Boolean(emailConfig.from)
  if (!emailConfig.enabled || !hasConfig) return null
  if (emailTransporter) return emailTransporter
  emailTransporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpSecure,
    auth: emailConfig.smtpUser
      ? {
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPass,
        }
      : undefined,
  })
  return emailTransporter
}

const buildAlertText = (event: OpsAlertRecord, payload: OpsAlertPayload) => {
  const payinMethod = payload.payin_method ?? 'n/a'
  const payoutMethod = payload.payout_method ?? 'n/a'
  const collectorType = payload.collector_type ?? 'n/a'
  const traceId = payload.trace_id ?? event.request_id ?? 'n/a'
  const fingerprint = payload.request_fingerprint ?? 'n/a'
  return [
    `Provider block detected (${event.provider_id ?? 'unknown'}).`,
    `Corridor: ${event.corridor_id ?? 'unknown'}`,
    `Amount bucket: ${event.amount_bucket ?? 'n/a'}`,
    `Payin/Payout: ${payinMethod} -> ${payoutMethod}`,
    `HTTP: ${event.http_status ?? 'n/a'}`,
    `Reason: ${event.block_reason ?? 'unknown'}`,
    `Collector: ${collectorType}`,
    `Trace: ${traceId}`,
    `Fingerprint: ${fingerprint}`,
    `Alert ID: ${event.alert_id}`,
  ].join('\n')
}

const sendSlackAlert = async (text: string) => {
  const webhookUrl = config.alerts.slackWebhookUrl
  if (!webhookUrl) return false

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `:rotating_light: Block alert\n${text}`,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!response.ok) {
      throw new Error(`slack_webhook_failed:${response.status}`)
    }
    return true
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (isError(error) && error.name === 'AbortError') {
      throw new Error('slack_webhook_timeout')
    }
    throw error
  }
}

const sendEmailAlert = async (subject: string, text: string) => {
  const emailConfig = config.alerts.email
  const transporter = getEmailTransporter()
  if (!emailConfig.enabled || !transporter) return false

  await transporter.sendMail({
    from: emailConfig.from,
    to: emailConfig.to.join(','),
    subject,
    text,
  })
  return true
}

export const notifyBlockAlert = async (
  pool: Pool,
  alertId: string,
  options: { force?: boolean } = {},
) => {
  if (!alertId || typeof alertId !== 'string' || alertId.trim().length === 0) {
    logger.warn('alert_invalid_id', { alert_id: alertId })
    return
  }

  if (config.queues.opsAlerts.mode === 'queue' && !options.force) {
    logger.info('alert_queue_mode_skip', { alert_id: alertId })
    return
  }

  let event: OpsAlertRecord | null
  try {
    event = await loadOpsAlertEvent(pool, alertId)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('alert_load_failed', {
      alert_id: alertId,
      error: message,
      stack,
    })
    return
  }

  if (!event) {
    logger.warn('alert_missing', { alert_id: alertId })
    return
  }
  const payload = normalizePayload(event.payload)
  const slackConfigured = Boolean(config.alerts.slackWebhookUrl)
  const emailConfigured = Boolean(getEmailTransporter())

  if (!slackConfigured && !emailConfigured) {
    logger.info('alert_log_only', {
      alert_id: event.alert_id,
      provider_id: event.provider_id,
      corridor_id: event.corridor_id,
      http_status: event.http_status,
      reason: event.block_reason,
    })
    return
  }

  const text = buildAlertText(event, payload)
  const subject = `Block alert: ${event.provider_id ?? 'unknown'} (${event.http_status ?? 'n/a'})`
  const results: Record<string, 'sent' | 'skipped' | 'failed'> = {
    slack: 'skipped',  // Will be updated to 'sent' or 'failed' if slackConfigured is true
    email: 'skipped',  // Will be updated to 'sent' or 'failed' if emailConfigured is true
  }

  if (slackConfigured) {
    try {
      await sendSlackAlert(text)
      results.slack = 'sent'
    } catch (error: unknown) {
      results.slack = 'failed'
      const { message, stack } = formatError(error)
      logger.error('alert_slack_failed', {
        alert_id: event.alert_id,
        error: message,
        stack,
      })
    }
  }

  if (emailConfigured) {
    try {
      await sendEmailAlert(subject, text)
      results.email = 'sent'
    } catch (error: unknown) {
      results.email = 'failed'
      const { message, stack } = formatError(error)
      logger.error('alert_email_failed', {
        alert_id: event.alert_id,
        error: message,
        stack,
      })
    }
  }

  logger.info('alert_routed', {
    alert_id: event.alert_id,
    provider_id: event.provider_id,
    corridor_id: event.corridor_id,
    http_status: event.http_status,
    reason: event.block_reason,
    slack: results.slack,
    email: results.email,
  })
}
