import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import { createHash } from 'crypto'
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

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
    .alert-message { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .unsubscribe { color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Rate Alert</h2>
    </div>
    <div class="content">
      <div class="alert-message">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <a href="${siteUrl}/dashboard?tab=alerts" class="button">View Alert</a>
      <div class="footer">
        <p>This is an automated alert from Remit-Scout.</p>
        <p class="unsubscribe">
          <a href="${siteUrl.replace(/\/$/, '')}/dashboard?tab=account&section=notifications">Manage notification preferences</a>
          ${unsubscribeLink ? ` | <a href="${unsubscribeLink}">Unsubscribe</a>` : ''}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    await client.send(
      new SendEmailCommand({
        Source: `${alertsEmailFromName} <${alertsEmailFrom}>`,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: message,
              Charset: 'UTF-8',
            },
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
          },
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
