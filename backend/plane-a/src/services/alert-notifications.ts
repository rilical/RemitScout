import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { createHash } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import { generateAlertUnsubscribeToken } from './alert-unsubscribe'

const logger = createLogger('plane-a.alert-notifications')

let sesClient: SESClient | null = null
let snsClient: SNSClient | null = null

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

async function getUserNotificationPrefs(pool: Pool, userId: string): Promise<{
  email?: string
  sms?: string
  unsubscribed: boolean
  digestEnabled: boolean
} | null> {
  const result = await pool.query(
    `SELECT channel, unsubscribed, digest_enabled
     FROM silver.notification_pref
     WHERE user_id = $1 AND owner_type = 'user' AND unsubscribed = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  )

  if (result.rows.length === 0) {
    return null
  }

  const pref = result.rows[0]
  
  // Get user email from user_account
  const userResult = await pool.query(
    `SELECT email FROM silver.user_account WHERE user_id = $1`,
    [userId],
  )

  return {
    email: userResult.rows[0]?.email,
    unsubscribed: pref.unsubscribed,
    digestEnabled: pref.digest_enabled,
  }
}

export async function sendAlertEmail(
  pool: Pool,
  userId: string,
  alertId: string,
  subject: string,
  message: string,
  context?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const prefs = await getUserNotificationPrefs(pool, userId)
    if (!prefs || prefs.unsubscribed || !prefs.email) {
      logger.debug('alert_email_skipped', {
        user_id: userId,
        alert_id: alertId,
        reason: !prefs ? 'no_prefs' : prefs.unsubscribed ? 'unsubscribed' : 'no_email',
      })
      return false
    }

    const email = prefs.email
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
    const siteUrl = config.alerts.unsubscribe.baseUrl || 'https://remitscout.com'
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
  try {
    const client = getSnsClient()
    if (!client) {
      logger.debug('alert_sms_not_configured', {
        user_id: userId,
        alert_id: alertId,
      })
      return false
    }

    // TODO: Get phone number from user profile when mobile support is added
    // For now, SMS is prepared but not active
    logger.debug('alert_sms_prepared', {
      user_id: userId,
      alert_id: alertId,
      message: 'SMS notifications prepared for future mobile support',
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

