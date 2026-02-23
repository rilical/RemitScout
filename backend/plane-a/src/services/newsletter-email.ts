import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createHash } from 'crypto'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getPool, query } from '../../../shared/db'
import { buildEmailHtml } from './email-layout'

const logger = createLogger('plane-a.newsletter-email')
const planeAPool = getPool(config.db.planeAUrl)

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  if (config.newsletter.enabled === false) {
    return null
  }

  const sesRegion = config.aws.sesRegion
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
  return (result.rowCount ?? 0) > 0
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

  const fromAddress = config.newsletter.from || ''
  if (!fromAddress) {
    throw new Error('newsletter_from_address_missing')
  }

  const fromName = config.newsletter.fromName || 'Remit-Scout Newsletter'
  const confirmUrl = buildLink('/api/v1/newsletter/confirm', verifyToken)
  const unsubscribeUrl = buildLink('/api/v1/newsletter/unsubscribe', unsubscribeToken)

  const subject = 'Confirm your Remit-Scout newsletter subscription'
  const htmlBody = buildEmailHtml({
    title: 'Confirm your subscription',
    subtitle: 'Remit-Scout Newsletter',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Thanks for signing up for the Remit-Scout newsletter.</p>
      <p style="margin: 0 0 16px 0;">Please click the button below to confirm your subscription. You'll start receiving our updates and insights right away.</p>
    `,
    cta: {
      text: 'Confirm subscription',
      url: confirmUrl
    },
    footerHtml: `
      If you did not request this, you can safely ignore this email.<br>
      <a href="${unsubscribeUrl}" style="color:#6b7785; text-decoration:underline; display:inline-block; margin-top:8px;">Unsubscribe</a>
    `,
    theme: 'default'
  })
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

  const fromAddress = config.newsletter.from || ''
  if (!fromAddress) {
    return
  }

  const fromName = config.newsletter.fromName || 'Remit-Scout Newsletter'

  await client.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Welcome to the Remit-Scout Newsletter \u{1f44b}' },
        Body: {
          Html: {
            Data: buildEmailHtml({
              title: 'Welcome to the Newsletter',
              bodyHtml: `
                <p style="margin: 0 0 16px 0;">Hey there \u{1f44b}</p>
                <p style="margin: 0 0 16px 0;">Welcome to the Remit-Scout newsletter! We will send updates, exclusive data, and insights on the remittance market regularly. We're glad to have you with us.</p>
                
                <p style="margin: 32px 0 0 0; font-size: 15px;">
                  Best,<br>
                  <strong>Omar Ghabayen</strong><br>
                  <span style="color:#64748b; font-size:13px;">Founder, Remit-Scout</span>
                </p>
              `,
              footerHtml: 'This email is from the Remit-Scout newsletter. You can unsubscribe at any time from your account settings.',
              theme: 'default'
            })
          },
          Text: {
            Data: 'Welcome to the Remit-Scout newsletter!\nWe will send updates and insights regularly.\n\nBest,\nOmar Ghabayen\nFounder, Remit-Scout',
          },
        },
      },
      Source: `${fromName} <${fromAddress}>`,
      ReplyToAddresses: [fromAddress],
    }),
  )
}
