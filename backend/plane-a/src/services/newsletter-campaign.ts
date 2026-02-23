import {
  PinpointClient,
  SendMessagesCommand,
  type AddressConfiguration,
} from '@aws-sdk/client-pinpoint'
import { createHash } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { buildEmailHtml } from './email-layout'
import type { INewsletterRepository } from '../repositories/interfaces/newsletter-repository.interface'

const logger = createLogger('plane-a.newsletter-campaign')

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 50

let pinpointClient: PinpointClient | null = null

const getPinpointClient = (): PinpointClient | null => {
  if (!config.newsletter.pinpoint.enabled || !config.newsletter.pinpoint.appId) {
    return null
  }
  if (!pinpointClient) {
    pinpointClient = new PinpointClient({ region: config.newsletter.pinpoint.region })
  }
  return pinpointClient
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashEmail = (email: string): string =>
  createHash('sha256').update(normalizeEmail(email)).digest('hex')

const isSuppressedEmail = async (email: string, pool: Pool): Promise<boolean> => {
  const result = await query(
    `SELECT 1 FROM silver.email_suppression WHERE email_hash = $1 LIMIT 1`,
    [hashEmail(email)],
    pool,
  )
  return (result.rowCount ?? 0) > 0
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export type CampaignRow = {
  id: string
  subject: string
  preview_text: string | null
  body_html: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  sent_by: string | null
  started_at: Date | null
  completed_at: Date | null
  created_at: Date
  updated_at: Date
}

export type CreateCampaignInput = {
  subject: string
  previewText?: string | null
  bodyHtml: string
  sentBy?: string | null
}

export const createCampaign = async (
  pool: Pool,
  input: CreateCampaignInput,
): Promise<CampaignRow> => {
  const result = await query<CampaignRow>(
    `INSERT INTO silver.newsletter_campaign (subject, preview_text, body_html, sent_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.subject, input.previewText ?? null, input.bodyHtml, input.sentBy ?? null],
    pool,
  )
  return result.rows[0]
}

export const getCampaign = async (
  pool: Pool,
  id: string,
): Promise<CampaignRow | null> => {
  const result = await query<CampaignRow>(
    `SELECT * FROM silver.newsletter_campaign WHERE id = $1`,
    [id],
    pool,
  )
  return result.rows[0] ?? null
}

export const listCampaigns = async (
  pool: Pool,
  limit = 50,
): Promise<CampaignRow[]> => {
  const result = await query<CampaignRow>(
    `SELECT * FROM silver.newsletter_campaign ORDER BY created_at DESC LIMIT $1`,
    [limit],
    pool,
  )
  return result.rows
}

export const getActiveSubscriberCount = async (
  pool: Pool,
): Promise<number> => {
  const result = await query<{ count: string }>(
    `SELECT count(*) as count FROM silver.newsletter_subscriber WHERE status = 'active'`,
    [],
    pool,
  )
  return parseInt(result.rows[0]?.count ?? '0', 10)
}

export const buildNewsletterHtml = (opts: {
  subject: string
  previewText?: string | null
  bodyHtml: string
  unsubscribeUrl?: string | null
}): string => {
  const siteUrl = config.newsletter.baseUrl || 'https://remit-scout.com'
  const footerParts = [
    'You received this email because you subscribed to the Remit-Scout newsletter.',
  ]
  if (opts.unsubscribeUrl) {
    footerParts.push(
      `<a href="${opts.unsubscribeUrl}" style="color:#6b7785; text-decoration:underline; display:inline-block; margin-top:8px;">Unsubscribe</a>`,
    )
  }

  return buildEmailHtml({
    title: opts.subject,
    subtitle: 'Remit-Scout Newsletter',
    preheader: opts.previewText,
    bodyHtml: opts.bodyHtml,
    footerHtml: footerParts.join('<br>'),
    theme: 'default',
    siteUrl,
  })
}

export const previewCampaignHtml = (opts: {
  subject: string
  previewText?: string | null
  bodyHtml: string
}): string => {
  return buildNewsletterHtml({
    subject: opts.subject,
    previewText: opts.previewText,
    bodyHtml: opts.bodyHtml,
    unsubscribeUrl: '#',
  })
}

export const sendCampaign = async (
  pool: Pool,
  newsletterRepository: INewsletterRepository,
  campaignId: string,
): Promise<{ sent: number; failed: number }> => {
  const client = getPinpointClient()
  if (!client) {
    throw new Error('pinpoint_not_configured')
  }

  const campaign = await getCampaign(pool, campaignId)
  if (!campaign) {
    throw new Error('campaign_not_found')
  }
  if (campaign.status !== 'draft') {
    throw new Error(`campaign_invalid_status:${campaign.status}`)
  }

  await query(
    `UPDATE silver.newsletter_campaign SET status = 'sending', started_at = now(), updated_at = now() WHERE id = $1`,
    [campaignId],
    pool,
  )

  const subscribers = await newsletterRepository.getActiveSubscribers(10000)
  const validSubscribers: { email: string; unsubscribeTokenHash: string }[] = []
  for (const sub of subscribers) {
    if (!(await isSuppressedEmail(sub.email, pool))) {
      validSubscribers.push({
        email: sub.email,
        unsubscribeTokenHash: sub.unsubscribe_token_hash,
      })
    }
  }

  await query(
    `UPDATE silver.newsletter_campaign SET total_recipients = $1, updated_at = now() WHERE id = $2`,
    [validSubscribers.length, campaignId],
    pool,
  )

  let sentCount = 0
  let failedCount = 0
  const baseUrl = (config.newsletter.baseUrl || 'https://remit-scout.com').replace(/\/$/, '')
  const fromAddress = config.newsletter.from || config.communications.email.sesFromAddress
  const fromName = config.newsletter.fromName || 'Remit-Scout Newsletter'

  for (let i = 0; i < validSubscribers.length; i += BATCH_SIZE) {
    const batch = validSubscribers.slice(i, i + BATCH_SIZE)
    const addresses: Record<string, AddressConfiguration> = {}

    const perRecipientHtml: Record<string, string> = {}
    for (const sub of batch) {
      const unsubscribeUrl = `${baseUrl}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(sub.unsubscribeTokenHash)}`
      perRecipientHtml[sub.email] = buildNewsletterHtml({
        subject: campaign.subject,
        previewText: campaign.preview_text,
        bodyHtml: campaign.body_html,
        unsubscribeUrl,
      })
      addresses[sub.email] = { ChannelType: 'EMAIL' }
    }

    try {
      for (const sub of batch) {
        try {
          await client.send(
            new SendMessagesCommand({
              ApplicationId: config.newsletter.pinpoint.appId,
              MessageRequest: {
                Addresses: {
                  [sub.email]: { ChannelType: 'EMAIL' },
                },
                MessageConfiguration: {
                  EmailMessage: {
                    FromAddress: `${fromName} <${fromAddress}>`,
                    SimpleEmail: {
                      Subject: { Data: campaign.subject },
                      HtmlPart: { Data: perRecipientHtml[sub.email] },
                      Headers: [
                        {
                          Name: 'List-Unsubscribe',
                          Value: `<${baseUrl}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(sub.unsubscribeTokenHash)}>`,
                        },
                        {
                          Name: 'List-Unsubscribe-Post',
                          Value: 'List-Unsubscribe=One-Click',
                        },
                      ],
                    },
                  },
                },
              },
            }),
          )
          sentCount++
        } catch (err) {
          failedCount++
          logger.warn('newsletter_send_individual_failed', {
            campaignId,
            email: sub.email,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      await query(
        `UPDATE silver.newsletter_campaign SET sent_count = $1, failed_count = $2, updated_at = now() WHERE id = $3`,
        [sentCount, failedCount, campaignId],
        pool,
      )
    } catch (err) {
      logger.error('newsletter_batch_failed', {
        campaignId,
        batchStart: i,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (i + BATCH_SIZE < validSubscribers.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  const finalStatus = failedCount === validSubscribers.length ? 'failed' : 'sent'
  await query(
    `UPDATE silver.newsletter_campaign
     SET status = $1, sent_count = $2, failed_count = $3, completed_at = now(), updated_at = now()
     WHERE id = $4`,
    [finalStatus, sentCount, failedCount, campaignId],
    pool,
  )

  logger.info('newsletter_campaign_complete', {
    campaignId,
    status: finalStatus,
    sentCount,
    failedCount,
    totalRecipients: validSubscribers.length,
  })

  return { sent: sentCount, failed: failedCount }
}
