import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { buildEmailHtml } from './email-layout'

const logger = createLogger('plane-a.welcome-email')

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  const enabled = process.env.WELCOME_EMAIL_ENABLED !== '0' && process.env.WELCOME_EMAIL_ENABLED !== 'false'
  const fromAddress = process.env.WELCOME_EMAIL_FROM || process.env.SES_FROM_ADDRESS
  if (!enabled || !fromAddress) {
    return null
  }

  if (!sesClient) {
    const region = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1'
    sesClient = new SESClient({ region })
  }

  return sesClient
}

const getDashboardUrl = () => {
  const siteUrl = config.billing.stripe.frontendBaseUrl || config.newsletter.baseUrl
  if (!siteUrl) return null
  return `${siteUrl.replace(/\/$/, '')}/dashboard`
}

export const sendWelcomeEmail = async (params: {
  pool: Pool
  userId: string
  email: string
  name?: string | null
}): Promise<boolean> => {
  const client = getSesClient()
  const fromAddress = process.env.WELCOME_EMAIL_FROM || process.env.SES_FROM_ADDRESS || ''
  const fromName = process.env.WELCOME_EMAIL_FROM_NAME || 'Remit-Scout'

  if (!client || !fromAddress) {
    logger.info('welcome_email_disabled_or_missing_from', { user_id: params.userId })
    return false
  }

  // Check suppression
  const result = await query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = digest($1, 'sha256')::text LIMIT 1`,
    [params.email.trim().toLowerCase()],
    params.pool,
  )
  if ((result.rowCount ?? 0) > 0) {
    logger.info('welcome_email_suppressed', { user_id: params.userId })
    return false
  }

  const dashboardUrl = getDashboardUrl() || 'https://remit-scout.com/dashboard'
  const subject = 'Welcome to Remit-Scout \u{1f44b}'
  const greeting = params.name ? `Hey ${params.name} \u{1f44b}` : 'Hey there \u{1f44b}'

  const htmlBody = buildEmailHtml({
    title: 'Welcome to Remit-Scout',
    subtitle: 'The smartest way to track remittance rates',
    preheader: 'Welcome to Remit-Scout! Track real-time rates and get notified when it is the best time to send money.',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">${greeting}</p>
      <p style="margin: 0 0 16px 0;">Welcome to Remit-Scout! We help you track real-time exchange rates, compare providers, and send money when the rates are best.</p>
      
      <div style="background:#f8fafc; border-radius:12px; padding:16px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color:#0f172a;">Get started in 3 steps:</h3>
        <ol style="margin: 0; padding-left: 20px; color:#334155; line-height: 1.6;">
          <li style="margin-bottom: 8px;"><strong>Track a corridor</strong> \u2014 Pick your send and receive countries.</li>
          <li style="margin-bottom: 8px;"><strong>Set an alert</strong> \u2014 Tell us what rate or amount you want.</li>
          <li style="margin-bottom: 0;"><strong>Get notified</strong> \u2014 We'll email you the moment your target is reached.</li>
        </ol>
      </div>

      <p style="margin: 0 0 16px 0;">Ready to catch the best rates?</p>
      
      <p style="margin: 32px 0 0 0; font-size: 15px;">
        Best,<br>
        <strong>Omar Ghabayen</strong><br>
        <span style="color:#64748b; font-size:13px;">Founder, Remit-Scout</span>
      </p>
    `,
    cta: {
      text: 'Set up your first alert',
      url: `${dashboardUrl}?tab=alerts&action=new`
    },
    footerHtml: 'You are receiving this because you signed up for Remit-Scout. If you need help, simply reply to this email.',
    theme: 'default'
  })

  const textBody = [
    greeting,
    '',
    "Welcome to Remit-Scout! We help you track real-time exchange rates, compare providers, and send money when the rates are best.",
    '',
    'Get started by setting up your first alert:',
    `${dashboardUrl}?tab=alerts&action=new`,
    '',
    'Best,',
    'Omar Ghabayen',
    'Founder, Remit-Scout',
    '',
    'If you need help, simply reply to this email.',
  ].join('\n')

  try {
    await client.send(
      new SendEmailCommand({
        Source: `${fromName} <${fromAddress}>`,
        Destination: { ToAddresses: [params.email] },
        ReplyToAddresses: ['support@remit-scout.com'],
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: textBody, Charset: 'UTF-8' },
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      }),
    )

    logger.info('welcome_email_sent', { user_id: params.userId })
    return true
  } catch (error: unknown) {
    logger.error('welcome_email_failed', {
      user_id: params.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
