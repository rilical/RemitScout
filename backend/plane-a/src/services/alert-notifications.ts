import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import { createHash, randomBytes } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import { generateAlertUnsubscribeToken } from './alert-unsubscribe'
import { sendPushNotification } from './push-delivery'

const logger = createLogger('plane-a.alert-notifications')

let sesClient: SESClient | null = null
let snsClient: SNSClient | null = null

const resolveAlertBaseUrl = (): string => (
  config.alerts.unsubscribe.baseUrl ||
  config.billing.stripe.frontendBaseUrl ||
  config.newsletter.baseUrl ||
  ''
)

const getSesClient = (): SESClient | null => {
  const sesRegion = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1'
  const alertsEmailEnabled = process.env.ALERTS_EMAIL_ENABLED === '1' || process.env.ALERTS_EMAIL_ENABLED === 'true'
  const alertsEmailFrom = process.env.ALERTS_EMAIL_FROM || process.env.SES_FROM_ADDRESS

  if (!alertsEmailEnabled || !alertsEmailFrom) {
    return null
  }

  if (!sesClient) {
    sesClient = new SESClient({ region: sesRegion })
  }

  return sesClient
}

const getSnsClient = (): SNSClient | null => {
  const snsRegion = process.env.SNS_REGION || process.env.AWS_REGION || 'us-east-1'
  const alertsSmsEnabled = process.env.ALERTS_SMS_ENABLED === '1' || process.env.ALERTS_SMS_ENABLED === 'true'

  if (!alertsSmsEnabled) {
    return null
  }

  if (!snsClient) {
    snsClient = new SNSClient({ region: snsRegion })
  }

  return snsClient
}

type NotificationSettings = {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  rateAlertsEnabled: boolean
  weeklySummaryEnabled: boolean
  marketUpdatesEnabled: boolean
  productUpdatesEnabled: boolean
  promotionalEnabled: boolean
}

type NotificationPref = {
  unsubscribed: boolean
  digestEnabled: boolean
  marketingOptIn: boolean
  timezone: string
  dailySendHour: number
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
  rateAlertsEnabled: true,
  weeklySummaryEnabled: true,
  marketUpdatesEnabled: false,
  productUpdatesEnabled: true,
  promotionalEnabled: false,
}

const DEFAULT_NOTIFICATION_PREF: NotificationPref = {
  unsubscribed: false,
  digestEnabled: true,
  marketingOptIn: false,
  timezone: 'UTC',
  dailySendHour: 9,
}

const sanitizeHeaderValue = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim()

const buildRawEmail = (params: {
  from: string
  to: string
  subject: string
  replyTo?: string
  listUnsubscribe?: string | null
  text: string
  html: string
}): string => {
  const boundary = `NextPart_${randomBytes(12).toString('hex')}`
  const headers = [
    `From: ${sanitizeHeaderValue(params.from)}`,
    `To: ${sanitizeHeaderValue(params.to)}`,
    `Subject: ${sanitizeHeaderValue(params.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    params.replyTo ? `Reply-To: ${sanitizeHeaderValue(params.replyTo)}` : null,
    params.listUnsubscribe ? `List-Unsubscribe: <${sanitizeHeaderValue(params.listUnsubscribe)}>` : null,
    params.listUnsubscribe ? 'List-Unsubscribe-Post: List-Unsubscribe=One-Click' : null,
  ].filter(Boolean).join('\r\n')

  return [
    headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

async function isEmailSuppressed(pool: Pool, email: string): Promise<boolean> {
  const emailHash = hashEmail(email)
  const result = await pool.query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = $1 LIMIT 1`,
    [emailHash],
  )
  return result.rows.length > 0
}

const toNotificationSettings = (row?: {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  rate_alerts_enabled: boolean
  weekly_summary_enabled: boolean
  market_updates_enabled: boolean
  product_updates_enabled: boolean
  promotional_enabled: boolean
} | null): NotificationSettings => {
  if (!row) return { ...DEFAULT_NOTIFICATION_SETTINGS }
  return {
    emailEnabled: row.email_enabled,
    smsEnabled: row.sms_enabled,
    pushEnabled: row.push_enabled,
    rateAlertsEnabled: row.rate_alerts_enabled,
    weeklySummaryEnabled: row.weekly_summary_enabled,
    marketUpdatesEnabled: row.market_updates_enabled,
    productUpdatesEnabled: row.product_updates_enabled,
    promotionalEnabled: row.promotional_enabled,
  }
}

const getNotificationSettings = async (pool: Pool, userId: string): Promise<NotificationSettings> => {
  const result = await pool.query(
    `SELECT email_enabled,
            sms_enabled,
            push_enabled,
            rate_alerts_enabled,
            weekly_summary_enabled,
            market_updates_enabled,
            product_updates_enabled,
            promotional_enabled
     FROM silver.notification_settings
     WHERE user_id = $1`,
    [userId],
  )
  return toNotificationSettings(result.rows[0] ?? null)
}

const getNotificationPref = async (
  pool: Pool,
  userId: string,
  channel: 'email' | 'sms' | 'push',
): Promise<NotificationPref> => {
  const result = await pool.query(
    `SELECT unsubscribed,
            digest_enabled,
            marketing_opt_in,
            timezone,
            daily_send_hour
     FROM silver.notification_pref
     WHERE user_id = $1 AND owner_type = 'user' AND channel = $2
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [userId, channel],
  )

  const row = result.rows[0]
  if (!row) return { ...DEFAULT_NOTIFICATION_PREF }
  return {
    unsubscribed: row.unsubscribed,
    digestEnabled: row.digest_enabled,
    marketingOptIn: row.marketing_opt_in,
    timezone: row.timezone || DEFAULT_NOTIFICATION_PREF.timezone,
    dailySendHour: Number.isFinite(row.daily_send_hour)
      ? row.daily_send_hour
      : DEFAULT_NOTIFICATION_PREF.dailySendHour,
  }
}

const getUserEmail = async (pool: Pool, userId: string): Promise<string | null> => {
  const result = await pool.query(
    `SELECT email FROM silver.user_account WHERE user_id = $1`,
    [userId],
  )
  return result.rows[0]?.email ?? null
}

const isChannelEnabled = (settings: NotificationSettings, channel: 'email' | 'sms' | 'push') => {
  if (channel === 'email') return settings.emailEnabled
  if (channel === 'sms') return settings.smsEnabled
  if (channel === 'push') return settings.pushEnabled
  return false
}

export async function sendAlertEmail(
  pool: Pool,
  userId: string,
  alertId: string,
  subject: string,
  message: string,
  context?: Record<string, unknown>,
): Promise<boolean> {
  void context
  try {
    const settings = await getNotificationSettings(pool, userId)
    if (!settings.rateAlertsEnabled || !isChannelEnabled(settings, 'email')) {
      logger.debug('alert_email_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: !settings.rateAlertsEnabled ? 'rate_alerts_disabled' : 'email_disabled',
      })
      return false
    }

    const pref = await getNotificationPref(pool, userId, 'email')
    if (pref.unsubscribed) {
      logger.debug('alert_email_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: 'unsubscribed',
      })
      return false
    }

    const email = (await getUserEmail(pool, userId)) ?? undefined
    if (!email) {
      logger.debug('alert_email_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: 'no_email',
      })
      return false
    }
    if (await isEmailSuppressed(pool, email)) {
      logger.debug('alert_email_suppressed', {
        user_id: userId,
        alert_id: alertId,
        email_hash: hashEmail(email),
      })
      return false
    }

    const client = getSesClient()
    if (!client) {
      logger.warn('alert_email_not_configured', {
        user_id: userId,
        alert_id: alertId,
      })
      return false
    }

    const alertsEmailFrom = process.env.ALERTS_EMAIL_FROM || process.env.SES_FROM_ADDRESS || 'alerts@remitscout.com'
    const alertsEmailFromName = process.env.ALERTS_EMAIL_FROM_NAME || 'Remit-Scout Alerts'
    const siteUrl = resolveAlertBaseUrl()
    if (!siteUrl) {
      logger.warn('alert_email_site_url_missing', {
        user_id: userId,
        alert_id: alertId,
      })
      return false
    }
    const unsubscribeToken = generateAlertUnsubscribeToken(userId)
    const unsubscribeLink = unsubscribeToken
      ? `${siteUrl.replace(/\/$/, '')}/api/alerts/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
      : null

    const metricLabel = (value?: string) => {
      switch (value) {
        case 'sendScore':
          return 'Smart score'
        case 'recipientGets':
          return 'Recipient gets'
        case 'totalCost':
          return 'Total cost'
        case 'fee':
          return 'Fee'
        case 'midMarketRate':
          return 'Mid-market rate'
        case 'rate':
          return 'Rate'
        case 'index':
          return 'Index'
        default:
          return 'Value'
      }
    }

    const formatComparator = (value?: string) => {
      switch (value) {
        case 'gt':
          return 'greater than'
        case 'gte':
          return 'at least'
        case 'lt':
          return 'less than'
        case 'lte':
          return 'at most'
        case 'crosses_above':
          return 'crossed above'
        case 'crosses_below':
          return 'crossed below'
        default:
          return 'compared to'
      }
    }

    const targetPayload = (context?.target_payload ?? {}) as Record<string, unknown>
    const targetFrom = typeof targetPayload.from === 'string' ? targetPayload.from.toUpperCase() : null
    const targetTo = typeof targetPayload.to === 'string' ? targetPayload.to.toUpperCase() : null
    const targetMethod = typeof targetPayload.method === 'string' ? targetPayload.method : null
    const metric = typeof context?.metric === 'string' ? context.metric : undefined
    const comparator = typeof context?.comparator === 'string' ? context.comparator : undefined
    const threshold = context?.threshold
    const currentValue = context?.current_value
    const summaryTarget = targetFrom && targetTo
      ? `${targetFrom} → ${targetTo}${targetMethod ? ` (${targetMethod})` : ''}`
      : 'Your tracked corridor'

    const metaLines = [
      metric ? `${metricLabel(metric)} ${formatComparator(comparator)} ${threshold ?? ''}`.trim() : null,
      targetFrom && targetTo ? `Corridor: ${summaryTarget}` : null,
    ].filter(Boolean)

    const detailRows = [
      metric ? { label: 'Metric', value: metricLabel(metric) } : null,
      comparator ? { label: 'Condition', value: formatComparator(comparator) } : null,
      threshold !== undefined ? { label: 'Threshold', value: String(threshold) } : null,
      currentValue !== undefined ? { label: 'Current value', value: String(currentValue) } : null,
      targetFrom && targetTo ? { label: 'Corridor', value: summaryTarget } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>

    const detailRowsHtml = detailRows.length > 0
      ? detailRows.map((row) => (
        `<tr>
          <td style="padding:6px 0; color:#52616b; width:32%; font-weight:600; vertical-align:top;">${row.label}</td>
          <td style="padding:6px 0; color:#1f2933; vertical-align:top;">${row.value}</td>
        </tr>`
      )).join('')
      : ''

    const preheader = message.replace(/\n/g, ' ').slice(0, 120)
    const managePrefsUrl = `${siteUrl.replace(/\/$/, '')}/dashboard?tab=account&section=notifications`
    const textBody = [
      message,
      '',
      ...(detailRows.map((row) => `${row.label}: ${row.value}`)),
      '',
      metaLines.length > 0 ? metaLines.join(' · ') : 'Automated alert from Remit-Scout.',
      `Manage notification preferences: ${managePrefsUrl}`,
      unsubscribeLink ? `Unsubscribe: ${unsubscribeLink}` : null,
    ].filter(Boolean).join('\n')

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Remit-Scout Rate Alert</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#1f2933;">
  <span style="display:none; visibility:hidden; opacity:0; height:0; width:0;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb; padding:24px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e6edf5; box-shadow:0 12px 32px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="background:#1d4ed8; color:#ffffff; padding:28px 32px;">
              <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.85;">Remit-Scout</div>
              <div style="font-size:24px; font-weight:700; margin-top:6px;">Rate Alert</div>
              <div style="font-size:13px; margin-top:8px; opacity:0.85;">${summaryTarget}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;">
              <div style="background:#f7f9fc; border:1px solid #e6edf5; border-radius:12px; padding:16px 18px; font-size:15px; line-height:1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              ${detailRowsHtml ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px; font-size:13px; border-collapse:collapse;">
                ${detailRowsHtml}
              </table>
              ` : ''}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td bgcolor="#1d4ed8" style="border-radius:10px;">
                    <a href="${siteUrl}/dashboard?tab=alerts" style="display:inline-block; padding:12px 20px; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px;">View Alert</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:20px; padding-top:16px; border-top:1px solid #e6edf5; font-size:12px; color:#6b7785; line-height:1.6;">
                <div>${metaLines.length > 0 ? metaLines.join(' · ') : 'Automated alert from Remit-Scout.'}</div>
                <div style="margin-top:10px;">
                  <a href="${managePrefsUrl}" style="color:#6b7785; text-decoration:underline;">Manage notification preferences</a>
                  ${unsubscribeLink ? ` | <a href="${unsubscribeLink}" style="color:#6b7785; text-decoration:underline;">Unsubscribe</a>` : ''}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    const fromHeader = `${alertsEmailFromName} <${alertsEmailFrom}>`
    const rawEmail = buildRawEmail({
      from: fromHeader,
      to: email,
      subject,
      replyTo: alertsEmailFrom,
      listUnsubscribe: unsubscribeLink,
      text: textBody,
      html: htmlBody,
    })

    await client.send(
      new SendRawEmailCommand({
        Source: alertsEmailFrom,
        Destinations: [email],
        RawMessage: {
          Data: Buffer.from(rawEmail),
        },
      }),
    )

    logger.info('alert_email_sent', {
      user_id: userId,
      alert_id: alertId,
      email,
    })

    return true
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('alert_email_send_failed', {
      user_id: userId,
      alert_id: alertId,
      error: message,
    })
    return false
  }
}

export async function sendAlertSms(
  pool: Pool,
  userId: string,
  alertId: string,
  message: string,
): Promise<boolean> {
  void message
  try {
    const settings = await getNotificationSettings(pool, userId)
    if (!settings.rateAlertsEnabled || !isChannelEnabled(settings, 'sms')) {
      logger.debug('alert_sms_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: !settings.rateAlertsEnabled ? 'rate_alerts_disabled' : 'sms_disabled',
      })
      return false
    }

    const pref = await getNotificationPref(pool, userId, 'sms')
    if (pref.unsubscribed) {
      logger.debug('alert_sms_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: 'unsubscribed',
      })
      return false
    }

    const client = getSnsClient()
    if (!client) {
      logger.debug('alert_sms_not_configured', {
        user_id: userId,
        alert_id: alertId,
      })
      return false
    }

    logger.debug('alert_sms_disabled', {
      user_id: userId,
      alert_id: alertId,
      reason: 'phone_number_missing',
    })

    return false
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('alert_sms_send_failed', {
      user_id: userId,
      alert_id: alertId,
      error: message,
    })
    return false
  }
}

export async function sendAlertPush(
  pool: Pool,
  userId: string,
  alertId: string,
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const settings = await getNotificationSettings(pool, userId)
    if (!settings.rateAlertsEnabled || !isChannelEnabled(settings, 'push')) {
      logger.debug('alert_push_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: !settings.rateAlertsEnabled ? 'rate_alerts_disabled' : 'push_disabled',
      })
      return false
    }

    const pref = await getNotificationPref(pool, userId, 'push')
    if (pref.unsubscribed) {
      logger.debug('alert_push_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: 'unsubscribed',
      })
      return false
    }

    const baseUrl = resolveAlertBaseUrl()
    if (!baseUrl) {
      logger.warn('alert_push_site_url_missing', {
        user_id: userId,
        alert_id: alertId,
      })
      return false
    }
    const result = await sendPushNotification(pool, userId, {
      title,
      body: message,
      url: `${baseUrl.replace(/\/$/, '')}/dashboard?tab=alerts`,
      icon: '/icons/icon-192.png',
    })

    if (result.delivered > 0) {
      logger.info('alert_push_sent', {
        user_id: userId,
        alert_id: alertId,
        delivered: result.delivered,
        failed: result.failed,
      })
      return true
    }

    logger.debug('alert_push_not_sent', {
      user_id: userId,
      alert_id: alertId,
      delivered: result.delivered,
      failed: result.failed,
      skipped: result.skipped,
    })
    return false
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('alert_push_send_failed', {
      user_id: userId,
      alert_id: alertId,
      error: message,
    })
    return false
  }
}

export async function suppressEmail(pool: Pool, email: string, reason: 'bounce' | 'complaint' | 'manual'): Promise<void> {
  const emailHash = hashEmail(email)
  await pool.query(
    `INSERT INTO silver.email_suppression (email_hash, reason)
     VALUES ($1, $2)
     ON CONFLICT (email_hash) DO UPDATE SET reason = $2`,
    [emailHash, reason],
  )
  logger.info('email_suppressed', {
    email_hash: emailHash,
    reason,
  })
}
