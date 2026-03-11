/**
 * SNS -> Better Uptime relay
 *
 * We use a Lambda relay instead of SNS HTTPS subscription because SNS requires
 * subscription confirmation and Better Uptime webhooks won't confirm SNS.
 *
 * Expected Better Uptime integration: "Incoming Webhook" (Better Stack).
 * Map `incident.id` to the integration's Alert ID for dedupe, and
 * map `incident.status` to trigger resolve when "resolved".
 */

import { createLogger } from '../../shared/logger'

const logger = createLogger('script.betteruptime-sns-relay-lambda')

const WEBHOOK_URL = process.env.BETTERUPTIME_WEBHOOK_URL
const ENV_NAME = process.env.ENV_NAME || process.env.APP_ENV || process.env.NODE_ENV || 'unknown'

type SnsRecord = {
  Sns?: {
    MessageId?: string
    TopicArn?: string
    Subject?: string
    Timestamp?: string
    Message?: string
  }
}

type SnsEvent = {
  Records?: SnsRecord[]
}

type CloudWatchAlarmMessage = {
  AlarmName?: string
  AlarmArn?: string
  AWSAccountId?: string
  NewStateValue?: string
  OldStateValue?: string
  NewStateReason?: string
  StateChangeTime?: string
  Region?: string
  Trigger?: unknown
}

type BetterUptimeIncidentStatus = 'alert' | 'resolved'

const isObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
)

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const truncate = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) return value
  return value.slice(0, Math.max(0, maxChars - 12)) + '...[truncated]'
}

const toIsoString = (value: unknown): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const resolveSeverityFromTopic = (topicArn: string | undefined): 'critical' | 'warning' | 'info' => {
  const raw = String(topicArn || '').toLowerCase()
  if (raw.includes('critical')) return 'critical'
  if (raw.includes('warning')) return 'warning'
  if (raw.includes('ops')) return 'warning'
  return 'info'
}

const isCloudWatchAlarm = (value: unknown): value is CloudWatchAlarmMessage => {
  if (!isObject(value)) return false
  return (
    typeof value.AlarmName === 'string'
    && typeof value.NewStateValue === 'string'
    && typeof value.NewStateReason === 'string'
  )
}

const resolveIncidentStatus = (cw: CloudWatchAlarmMessage | null): BetterUptimeIncidentStatus => {
  const state = String(cw?.NewStateValue || '').toUpperCase()
  if (state === 'OK') return 'resolved'
  return 'alert'
}

const buildIncidentPayload = (params: {
  record: SnsRecord
}) => {
  const sns = params.record.Sns || {}
  const topicArn = sns.TopicArn
  const subject = sns.Subject
  const messageRaw = sns.Message || ''
  const timestamp = toIsoString(sns.Timestamp) || new Date().toISOString()

  const parsed = typeof messageRaw === 'string' ? safeJsonParse(messageRaw) : null
  const cw = isCloudWatchAlarm(parsed) ? parsed : null

  const severity = resolveSeverityFromTopic(topicArn)
  const status = resolveIncidentStatus(cw)

  const incidentId = cw?.AlarmName
    ? `cloudwatch:${ENV_NAME}:${cw.AlarmName}`
    : `sns:${ENV_NAME}:${String(sns.MessageId || 'unknown')}`

  const title = cw?.AlarmName
    ? `[${ENV_NAME}] ${cw.AlarmName}: ${String(cw.NewStateValue).toUpperCase()}`
    : `[${ENV_NAME}] ${subject || 'SNS alert'}`

  const description = cw
    ? [
        `State: ${String(cw.OldStateValue || '').toUpperCase()} -> ${String(cw.NewStateValue || '').toUpperCase()}`,
        `Reason: ${cw.NewStateReason || ''}`,
        cw.Region ? `Region: ${cw.Region}` : null,
        cw.AWSAccountId ? `Account: ${cw.AWSAccountId}` : null,
        cw.AlarmArn ? `AlarmArn: ${cw.AlarmArn}` : null,
        `Timestamp: ${timestamp}`,
      ].filter(Boolean).join('\n')
    : truncate(messageRaw, 4000)

  const metadata = {
    env: ENV_NAME,
    severity,
    source: 'aws_sns',
    sns: {
      messageId: sns.MessageId || null,
      topicArn: topicArn || null,
      subject: subject || null,
      timestamp,
    },
    cloudwatch: cw
      ? {
          alarmName: cw.AlarmName || null,
          alarmArn: cw.AlarmArn || null,
          newStateValue: cw.NewStateValue || null,
          oldStateValue: cw.OldStateValue || null,
          newStateReason: cw.NewStateReason || null,
          stateChangeTime: toIsoString(cw.StateChangeTime),
          region: cw.Region || null,
          accountId: cw.AWSAccountId || null,
        }
      : null,
  }

  return {
    incident: {
      id: incidentId,
      status,
      severity,
      title,
      description,
      metadata,
    },
  }
}

const postToWebhook = async (payload: unknown) => {
  if (!WEBHOOK_URL) {
    throw new Error('BETTERUPTIME_WEBHOOK_URL is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': `remit-scout-betteruptime-relay/${ENV_NAME}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = truncate(await res.text().catch(() => ''), 1000)
      throw new Error(`Better Uptime webhook returned ${res.status}: ${body}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const handler = async (event: SnsEvent): Promise<{ ok: boolean; sent: number }> => {
  const records = Array.isArray(event?.Records) ? event.Records : []
  if (records.length === 0) {
    logger.warn('no_records', { scope: 'betteruptime_relay' })
    return { ok: true, sent: 0 }
  }

  let sent = 0
  const errors: string[] = []

  // Sequential processing keeps the webhook load bounded and preserves ordering.
  for (const record of records) {
    try {
      const payload = buildIncidentPayload({ record })
      await postToWebhook(payload)
      sent += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(message)
      logger.error('betteruptime_relay_record_failed', { error: message })
    }
  }

  if (errors.length > 0) {
    // Fail the invocation so SNS retries. Ensure Better Uptime dedupe uses incident.id to avoid duplicates.
    throw new Error(`betteruptime_relay_failed: ${errors.join(' | ')}`)
  }

  return { ok: true, sent }
}

