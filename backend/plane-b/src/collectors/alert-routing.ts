import type { Pool } from 'pg'
import nodemailer from 'nodemailer'

import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

type OpsAlertEventRow = {
  alert_id: string
  provider_id: string | null
  corridor_id: string | null
  amount_bucket: number | null
  http_status: number | null
  block_reason: string | null
  bronze_object_key: string | null
  request_id: string | null
  payload: unknown
  created_at: string
}

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
  const result = await query<OpsAlertEventRow>(
    `SELECT alert_id, provider_id, corridor_id, amount_bucket, http_status, block_reason,
            bronze_object_key, request_id, payload, created_at
       FROM silver.ops_alert_event
      WHERE alert_id = $1`,
    [alertId],
    pool,
  )
  return result.rows[0] ?? null
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

const buildAlertText = (event: OpsAlertEventRow, payload: OpsAlertPayload) => {
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
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text: `:rotating_light: Block alert\n${text}`,
    }),
  })
  if (!response.ok) {
    throw new Error(`slack_webhook_failed:${response.status}`)
  }
  return true
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

export const notifyBlockAlert = async (pool: Pool, alertId: string) => {
  const event = await loadOpsAlertEvent(pool, alertId)
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
    slack: slackConfigured ? 'skipped' : 'skipped',
    email: emailConfigured ? 'skipped' : 'skipped',
  }

  if (slackConfigured) {
    try {
      await sendSlackAlert(text)
      results.slack = 'sent'
    } catch (error) {
      results.slack = 'failed'
      logger.error('alert_slack_failed', { alert_id: event.alert_id, error })
    }
  }

  if (emailConfigured) {
    try {
      await sendEmailAlert(subject, text)
      results.email = 'sent'
    } catch (error) {
      results.email = 'failed'
      logger.error('alert_email_failed', { alert_id: event.alert_id, error })
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
