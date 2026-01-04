import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createHash } from 'crypto'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getPool, query } from '../../../shared/db'

const logger = createLogger('plane-a.newsletter-email')
const planeAPool = getPool(config.db.planeAUrl)

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  if (config.newsletter.enabled === false) {
    return null
  }

  const sesRegion = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1'
  if (!sesClient) {
    sesClient = new SESClient({ region: sesRegion })
  }
  return sesClient
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashEmail = (email: string): string => {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex')
}

const isSuppressedEmail = async (email: string): Promise<boolean> => {
  if (!planeAPool) return false
  const emailHash = hashEmail(email)
  const result = await query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = $1 LIMIT 1`,
    [emailHash],
    planeAPool,
  )
  return result.rowCount > 0
}

const buildLink = (path: string, token: string): string => {
  const base = config.newsletter.baseUrl || config.billing.stripe.frontendBaseUrl
  const normalized = base.replace(/\/$/, '')
  return `${normalized}${path}?token=${encodeURIComponent(token)}`
}

export const sendConfirmationEmail = async (
  email: string,
  verifyToken: string,
  unsubscribeToken: string,
): Promise<void> => {
  if (config.newsletter.enabled === false) {
    logger.info('newsletter_email_disabled')
    return
  }

  if (await isSuppressedEmail(email)) {
    throw new Error('email_suppressed')
  }

  const client = getSesClient()
  if (!client) {
    throw new Error('ses_not_configured')
  }

  const fromAddress = config.newsletter.from || process.env.SES_FROM_ADDRESS || ''
  if (!fromAddress) {
    throw new Error('newsletter_from_address_missing')
  }

  const fromName = config.newsletter.fromName || 'Remit-Scout Newsletter'
  const confirmUrl = buildLink('/api/newsletter/confirm', verifyToken)
  const unsubscribeUrl = buildLink('/api/newsletter/unsubscribe', unsubscribeToken)

  const subject = 'Confirm your Remit-Scout newsletter subscription'
  const htmlBody = `
    <p>Thanks for signing up for the Remit-Scout newsletter.</p>
    <p><a href="${confirmUrl}">Confirm your subscription</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p style="margin-top:24px;font-size:12px;color:#6b7280;">
      <a href="${unsubscribeUrl}">Unsubscribe</a>
    </p>
  `
  const textBody = [
    'Thanks for signing up for the Remit-Scout newsletter.',
    `Confirm your subscription: ${confirmUrl}`,
    'If you did not request this, you can ignore this email.',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n')

  await client.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
          Text: { Data: textBody },
        },
      },
      Source: `${fromName} <${fromAddress}>`,
      ReplyToAddresses: [fromAddress],
    }),
  )
}

export const sendWelcomeEmail = async (email: string): Promise<void> => {
  if (config.newsletter.enabled === false) {
    return
  }

  const client = getSesClient()
  if (!client) return

  const fromAddress = config.newsletter.from || process.env.SES_FROM_ADDRESS || ''
  if (!fromAddress) {
    return
  }

  const fromName = config.newsletter.fromName || 'Remit-Scout Newsletter'

  await client.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Welcome to the Remit-Scout Newsletter' },
        Body: {
          Html: {
            Data: '<p>Welcome to the Remit-Scout newsletter.</p><p>We will send updates and insights regularly.</p>',
          },
          Text: {
            Data: 'Welcome to the Remit-Scout newsletter.\nWe will send updates and insights regularly.',
          },
        },
      },
      Source: `${fromName} <${fromAddress}>`,
      ReplyToAddresses: [fromAddress],
    }),
  )
}
