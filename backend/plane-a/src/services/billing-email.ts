import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createHash } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { buildEmailHtml } from './email-layout'

const logger = createLogger('plane-a.billing-email')

let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  if (!config.email.billingEmail.enabled || !config.email.billingEmail.from) {
    return null
  }

  if (!sesClient) {
    sesClient = new SESClient({ region: config.aws.sesRegion })
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
  return (result.rowCount ?? 0) > 0
}

const getUserEmail = async (pool: Pool, userId: string): Promise<string | null> => {
  const result = await query<{ email: string | null }>(
    `SELECT email FROM silver.user_account WHERE user_id = $1`,
    [userId],
    pool,
  )
  return result.rows[0]?.email ?? null
}

const getFrom = () => {
  const fromAddress = config.email.billingEmail.from
  const fromName = config.email.billingEmail.fromName
  return { fromAddress, fromName }
}

const getDashboardUrl = () => {
  const siteUrl = config.billing.stripe.frontendBaseUrl
  if (!siteUrl) return null
  return `${siteUrl.replace(/\/$/, '')}/dashboard`
}

const sendEmail = async (params: {
  to: readonly string[]
  subject: string
  textBody: string
  htmlBody: string
  userIdForLogs?: string
}): Promise<boolean> => {
  const client = getSesClient()
  const { fromAddress, fromName } = getFrom()

  if (!client) {
    logger.info('billing_email_disabled', { user_id: params.userIdForLogs })
    return false
  }
  if (!fromAddress) {
    logger.warn('billing_email_from_missing', { user_id: params.userIdForLogs })
    return false
  }
  if (!params.to.length) return false

  try {
    await client.send(
      new SendEmailCommand({
        Source: `${fromName} <${fromAddress}>`,
        Destination: { ToAddresses: [...params.to] },
        Message: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: params.textBody, Charset: 'UTF-8' },
            Html: { Data: params.htmlBody, Charset: 'UTF-8' },
          },
        },
      }),
    )

    logger.info('billing_email_sent', { user_id: params.userIdForLogs })
    return true
  } catch (error: unknown) {
    logger.warn('billing_email_failed', {
      user_id: params.userIdForLogs,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const sendBillingEmailToUser = async (params: {
  pool: Pool
  userId: string
  subject: string
  textBody: string
  htmlBody: string
}): Promise<boolean> => {
  const email = await getUserEmail(params.pool, params.userId)
  if (!email) {
    logger.warn('billing_email_missing', { user_id: params.userId })
    return false
  }

  if (await isSuppressedEmail(params.pool, email)) {
    logger.info('billing_email_suppressed', { user_id: params.userId })
    return false
  }

  return await sendEmail({
    to: [email],
    subject: params.subject,
    textBody: params.textBody,
    htmlBody: params.htmlBody,
    userIdForLogs: params.userId,
  })
}

export const sendPlusConfirmationEmail = async (
  pool: Pool,
  userId: string,
  options?: { planName?: string },
): Promise<boolean> => {
  const planName = options?.planName || 'Remit-Scout Plus'
  const dashboardUrl = getDashboardUrl()
  if (!dashboardUrl) {
    logger.warn('billing_email_site_url_missing', { user_id: userId })
    return false
  }

  const subject = `Your ${planName} subscription is active`

  const textBody = [
    `Thanks for joining ${planName}.`,
    'Your subscription is now active.',
    `Manage your plan: ${dashboardUrl}`,
  ].filter(Boolean).join('\n')

  const htmlBody = buildEmailHtml({
    title: 'Subscription Active',
    subtitle: planName,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Thanks for joining <strong>${planName}</strong>.</p>
      <p style="margin: 0 0 16px 0;">Your subscription is now active. You now have full access to premium features, alerts, and market insights.</p>
    `,
    cta: {
      text: 'Go to your dashboard',
      url: dashboardUrl
    },
    footerHtml: `This email confirms your new subscription. You can manage your billing settings in your dashboard at any time.`,
    theme: 'success'
  })

  return await sendBillingEmailToUser({ pool, userId, subject, textBody, htmlBody })
}

export const sendPaymentFailedEmail = async (
  pool: Pool,
  userId: string,
  options?: { planName?: string },
): Promise<boolean> => {
  const planName = options?.planName || 'Remit-Scout Plus'
  const dashboardUrl = getDashboardUrl()
  if (!dashboardUrl) {
    logger.warn('billing_email_site_url_missing', { user_id: userId })
    return false
  }

  const subject = `Payment failed for your ${planName} subscription`
  const textBody = [
    `We couldn't process your payment for ${planName}.`,
    'Your access may be interrupted if payment isn’t updated.',
    `Update your billing details: ${dashboardUrl}?tab=account`,
  ].join('\n')

  const htmlBody = buildEmailHtml({
    title: 'Payment Failed',
    subtitle: planName,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">We couldn't process your payment for <strong>${planName}</strong>.</p>
      <p style="margin: 0 0 16px 0;">Your access may be interrupted soon if your payment method isn't updated. Please check your card details to ensure uninterrupted access.</p>
    `,
    cta: {
      text: 'Update billing details',
      url: `${dashboardUrl}?tab=account`
    },
    footerHtml: 'Automated billing alert from Remit-Scout.',
    theme: 'warning'
  })

  return await sendBillingEmailToUser({ pool, userId, subject, textBody, htmlBody })
}

export const sendCancellationEmail = async (
  pool: Pool,
  userId: string,
  options?: { planName?: string },
): Promise<boolean> => {
  const planName = options?.planName || 'Remit-Scout Plus'
  const dashboardUrl = getDashboardUrl()
  if (!dashboardUrl) {
    logger.warn('billing_email_site_url_missing', { user_id: userId })
    return false
  }

  const subject = `Your ${planName} subscription was cancelled`
  const textBody = [
    `Your ${planName} subscription has been cancelled.`,
    `You can manage your plan in your dashboard: ${dashboardUrl}?tab=account`,
  ].join('\n')

  const htmlBody = buildEmailHtml({
    title: 'Subscription Cancelled',
    subtitle: planName,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Your <strong>${planName}</strong> subscription has been successfully cancelled.</p>
      <p style="margin: 0 0 16px 0;">We're sorry to see you go. If you change your mind, you can resubscribe at any time from your dashboard.</p>
    `,
    cta: {
      text: 'Go to your dashboard',
      url: `${dashboardUrl}?tab=account`
    },
    footerHtml: 'Automated billing alert from Remit-Scout.',
    theme: 'default'
  })

  return await sendBillingEmailToUser({ pool, userId, subject, textBody, htmlBody })
}

export const sendCancellationScheduledEmail = async (
  pool: Pool,
  userId: string,
  options?: { planName?: string; cancelAtIso?: string | null },
): Promise<boolean> => {
  const planName = options?.planName || 'Remit-Scout Plus'
  const dashboardUrl = getDashboardUrl()
  if (!dashboardUrl) {
    logger.warn('billing_email_site_url_missing', { user_id: userId })
    return false
  }

  const cancelAtLabel = options?.cancelAtIso
    ? (() => {
      const parsed = new Date(options.cancelAtIso)
      if (Number.isNaN(parsed.getTime())) return null
      return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    })()
    : null

  const subject = `Cancellation scheduled for your ${planName} subscription`
  const textBody = [
    `Your ${planName} subscription is scheduled to cancel${cancelAtLabel ? ` on ${cancelAtLabel}` : ''}.`,
    'You will keep access until the end of your current billing period.',
    `Manage your plan: ${dashboardUrl}?tab=account`,
  ].join('\n')

  const htmlBody = buildEmailHtml({
    title: 'Cancellation Scheduled',
    subtitle: planName,
    bodyHtml: `
      <p style="margin: 0 0 16px 0;">Your <strong>${planName}</strong> subscription is scheduled to cancel${cancelAtLabel ? ` on <strong>${cancelAtLabel}</strong>` : ''}.</p>
      <p style="margin: 0 0 16px 0;">You will keep your premium access until the end of your current billing period. Once the period ends, you won't be charged again.</p>
    `,
    cta: {
      text: 'Manage your subscription',
      url: `${dashboardUrl}?tab=account`
    },
    footerHtml: 'Automated billing alert from Remit-Scout.',
    theme: 'default'
  })

  return await sendBillingEmailToUser({ pool, userId, subject, textBody, htmlBody })
}

export const sendChargebackAdminEmail = async (params: {
  pool?: Pool
  userId?: string | null
  disputeId: string
  chargeId?: string | null
  customerId?: string | null
  reason?: string | null
  status?: string | null
  amount?: number | null
  currency?: string | null
}): Promise<boolean> => {
  const adminEmails = config.planeA.adminEmails || []
  if (adminEmails.length === 0) {
    logger.warn('billing_admin_email_missing', {
      message: 'No PLANE_A_ADMIN_EMAILS configured; chargeback alert email skipped.',
    })
    return false
  }

  const userEmail =
    params.pool && params.userId
      ? await getUserEmail(params.pool, params.userId).catch(() => null)
      : null

  const subject = 'Stripe chargeback / dispute created'
  const lines = [
    `dispute_id=${params.disputeId}`,
    params.chargeId ? `charge_id=${params.chargeId}` : null,
    params.customerId ? `customer_id=${params.customerId}` : null,
    params.userId ? `user_id=${params.userId}` : null,
    userEmail ? `user_email=${userEmail}` : null,
    params.reason ? `reason=${params.reason}` : null,
    params.status ? `status=${params.status}` : null,
    params.amount != null && params.currency ? `amount=${params.amount} ${params.currency}` : null,
  ].filter(Boolean).join('\n')

  const textBody = [
    'A Stripe dispute was created.',
    '',
    lines,
  ].join('\n')

  const htmlBody = buildEmailHtml({
    title: 'Chargeback Dispute',
    subtitle: 'Admin Alert',
    bodyHtml: `
      <p style="margin: 0 0 16px 0;"><strong>A Stripe dispute was created.</strong></p>
      <div style="background:#f7f9fc; border:1px solid #e6edf5; border-radius:12px; padding:16px 18px; font-size:13px; line-height:1.6;">
        <pre style="white-space:pre-wrap; margin:0;">${lines}</pre>
      </div>
    `,
    theme: 'danger'
  })

  return await sendEmail({
    to: adminEmails,
    subject,
    textBody,
    htmlBody,
  })
}
