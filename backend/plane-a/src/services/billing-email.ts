import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createHash } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'

const logger = createLogger('plane-a.billing-email')

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  const enabled = process.env.BILLING_EMAIL_ENABLED !== '0' && process.env.BILLING_EMAIL_ENABLED !== 'false'
  const fromAddress = process.env.BILLING_EMAIL_FROM || process.env.SES_FROM_ADDRESS
  if (!enabled || !fromAddress) {
    return null
  }

  if (!sesClient) {
    const region = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1'
    sesClient = new SESClient({ region })
  }

  return sesClient
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashEmail = (email: string): string => {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex')
}

const isSuppressedEmail = async (pool: Pool, email: string): Promise<boolean> => {
  const result = await query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = $1 LIMIT 1`,
    [hashEmail(email)],
    pool,
  )
  return result.rowCount > 0
}

const getUserEmail = async (pool: Pool, userId: string): Promise<string | null> => {
  const result = await query<{ email: string | null }>(
    `SELECT email FROM silver.user_account WHERE user_id = $1`,
    [userId],
    pool,
  )
  return result.rows[0]?.email ?? null
}

export const sendPlusConfirmationEmail = async (
  pool: Pool,
  userId: string,
  options?: { planName?: string; trialDays?: number | null },
): Promise<boolean> => {
  try {
    const email = await getUserEmail(pool, userId)
    if (!email) {
      logger.warn('billing_email_missing', { user_id: userId })
      return false
    }

    if (await isSuppressedEmail(pool, email)) {
      logger.info('billing_email_suppressed', { user_id: userId })
      return false
    }

    const client = getSesClient()
    if (!client) {
      logger.info('billing_email_disabled', { user_id: userId })
      return false
    }

    const fromAddress = process.env.BILLING_EMAIL_FROM || process.env.SES_FROM_ADDRESS || ''
    if (!fromAddress) {
      logger.warn('billing_email_from_missing', { user_id: userId })
      return false
    }

    const fromName = process.env.BILLING_EMAIL_FROM_NAME || 'Remit-Scout Billing'
    const planName = options?.planName || 'Remit-Scout Plus'
    const trialDays = options?.trialDays ?? null
    const siteUrl = config.billing.stripe.frontendBaseUrl || 'http://localhost:3000'
    const dashboardUrl = `${siteUrl.replace(/\/$/, '')}/dashboard`

    const subject = `Your ${planName} subscription is active`
    const trialLine = trialDays && trialDays > 0 ? `You have ${trialDays} days free before billing starts.` : null

    const textBody = [
      `Thanks for joining ${planName}.`,
      'Your subscription is now active.',
      trialLine,
      `Manage your plan: ${dashboardUrl}`,
    ].filter(Boolean).join('\n')

    const htmlBody = `
      <p>Thanks for joining ${planName}.</p>
      <p>Your subscription is now active.</p>
      ${trialLine ? `<p>${trialLine}</p>` : ''}
      <p><a href="${dashboardUrl}">Go to your dashboard</a></p>
    `.trim()

    await client.send(
      new SendEmailCommand({
        Source: `${fromName} <${fromAddress}>`,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: textBody, Charset: 'UTF-8' },
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      }),
    )

    logger.info('billing_email_sent', { user_id: userId })
    return true
  } catch (error: unknown) {
    logger.warn('billing_email_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
