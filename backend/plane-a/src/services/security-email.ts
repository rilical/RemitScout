import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { buildEmailHtml } from './email-layout'

const logger = createLogger('plane-a.security-email')

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  if (!config.securityEmail.enabled || !config.securityEmail.from) {
    return null
  }

  if (!sesClient) {
    const region = config.communications.email.sesRegion || config.aws.sesRegion
    sesClient = new SESClient({ region })
  }

  return sesClient
}

const getBaseUrl = () => {
  return config.billing.stripe.frontendBaseUrl || config.alerts.unsubscribe.baseUrl || config.newsletter.baseUrl || 'https://remit-scout.com'
}

export const sendNewSignInEmail = async (params: {
  pool: Pool
  userId: string
  email: string
  signInDetails: {
    ipAddress?: string | null
    userAgent?: string | null
    location?: string | null
    timestamp?: Date | string
  }
}): Promise<boolean> => {
  const client = getSesClient()
  const fromAddress = config.securityEmail.from
  const fromName = config.securityEmail.fromName

  if (!client || !fromAddress) {
    logger.info('security_email_disabled_or_missing_from', { user_id: params.userId })
    return false
  }

  // Check suppression
  const result = await query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = digest($1, 'sha256')::text LIMIT 1`,
    [params.email.trim().toLowerCase()],
    params.pool,
  )
  if ((result.rowCount ?? 0) > 0) {
    logger.info('security_email_suppressed', { user_id: params.userId })
    return false
  }

  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const subject = 'New sign-in to your Remit-Scout account'
  
  const timeStr = params.signInDetails.timestamp 
    ? new Date(params.signInDetails.timestamp).toLocaleString('en-US', { timeZone: 'UTC', timeZoneName: 'short' })
    : new Date().toLocaleString('en-US', { timeZone: 'UTC', timeZoneName: 'short' })

  const device = params.signInDetails.userAgent || 'Unknown Device'
  const location = params.signInDetails.location || 'Unknown Location'
  const ip = params.signInDetails.ipAddress || 'Unknown IP'

  const htmlBody = buildEmailHtml({
    title: 'New Sign-in Detected',
    subtitle: 'Security Alert',
    preheader: 'We noticed a new sign-in to your Remit-Scout account from a new device or location.',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We noticed a recent sign-in to your Remit-Scout account from a new device or location.</p>
      
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin: 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; line-height:1.6; color:#334155;">
          <tr>
            <td style="padding:4px 0; font-weight:600; width:80px; color:#64748b;">Device</td>
            <td style="padding:4px 0;">${device}</td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-weight:600; color:#64748b;">Location</td>
            <td style="padding:4px 0;">${location}</td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-weight:600; color:#64748b;">IP</td>
            <td style="padding:4px 0;">${ip}</td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-weight:600; color:#64748b;">Time</td>
            <td style="padding:4px 0;">${timeStr}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 16px 0;"><strong>If this was you</strong>, you can safely ignore this email.</p>
      <p style="margin: 0 0 16px 0;"><strong>If you don't recognize this activity</strong>, please secure your account immediately by changing your password.</p>
    `,
    cta: {
      text: 'Secure your account',
      url: `${baseUrl}/forgot-password`
    },
    footerHtml: 'This is an automated security notification from Remit-Scout. Do not reply to this email.',
    theme: 'warning'
  })

  const textBody = [
    'We noticed a new sign-in to your Remit-Scout account.',
    '',
    `Device: ${device}`,
    `Location: ${location}`,
    `IP Address: ${ip}`,
    `Time: ${timeStr}`,
    '',
    'If this was you, you can safely ignore this email.',
    'If you do not recognize this activity, please secure your account immediately by resetting your password:',
    `${baseUrl}/forgot-password`,
  ].join('\n')

  try {
    await client.send(
      new SendEmailCommand({
        Source: `${fromName} <${fromAddress}>`,
        Destination: { ToAddresses: [params.email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: textBody, Charset: 'UTF-8' },
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      }),
    )

    logger.info('new_signin_email_sent', { user_id: params.userId })
    return true
  } catch (error: unknown) {
    logger.error('new_signin_email_failed', {
      user_id: params.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
