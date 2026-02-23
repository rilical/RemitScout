import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../plugins/auth-plugin'
import { ValidationError, NotFoundError, AppError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import {
  createCampaign,
  getCampaign,
  listCampaigns,
  getActiveSubscriberCount,
  previewCampaignHtml,
  sendCampaign,
} from '../services/newsletter-campaign'

const logger = createLogger('plane-a.admin-newsletter')

const createCampaignSchema = z.object({
  subject: z.string().min(1).max(500),
  preview_text: z.string().max(200).optional(),
  body_html: z.string().min(1),
})

const previewSchema = z.object({
  subject: z.string().min(1).max(500),
  preview_text: z.string().max(200).optional(),
  body_html: z.string().min(1),
})

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const adminNewsletterRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool
  const newsletterRepository = app.container.repositories.newsletter

  app.get(
    '/admin/newsletter/subscribers/count',
    { preHandler: requireAdmin() },
    async () => {
      const count = await getActiveSubscriberCount(pool)
      return { count }
    },
  )

  app.get(
    '/admin/newsletter/campaigns',
    { preHandler: requireAdmin() },
    async (request) => {
      const parsed = listSchema.safeParse(request.query ?? {})
      if (!parsed.success) {
        throw new ValidationError('Invalid query', { details: parsed.error.issues })
      }
      const campaigns = await listCampaigns(pool, parsed.data.limit)
      return { campaigns }
    },
  )

  app.get(
    '/admin/newsletter/campaigns/:id',
    { preHandler: requireAdmin() },
    async (request) => {
      const { id } = request.params as { id: string }
      const campaign = await getCampaign(pool, id)
      if (!campaign) {
        throw new NotFoundError('Campaign not found')
      }
      return { campaign }
    },
  )

  app.post(
    '/admin/newsletter/campaigns',
    { preHandler: requireAdmin() },
    async (request) => {
      const parsed = createCampaignSchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        throw new ValidationError('Invalid request', { details: parsed.error.issues })
      }
      const campaign = await createCampaign(pool, {
        subject: parsed.data.subject,
        previewText: parsed.data.preview_text,
        bodyHtml: parsed.data.body_html,
        sentBy: request.user?.email ?? request.user?.user_id ?? null,
      })
      return { campaign }
    },
  )

  app.post(
    '/admin/newsletter/campaigns/:id/send',
    { preHandler: requireAdmin() },
    async (request) => {
      const { id } = request.params as { id: string }
      const campaign = await getCampaign(pool, id)
      if (!campaign) {
        throw new NotFoundError('Campaign not found')
      }
      if (campaign.status !== 'draft') {
        throw new ValidationError('Campaign has already been sent or is in progress', {
          details: [{ message: `status_is_${campaign.status}` }],
        })
      }

      try {
        const result = await sendCampaign(pool, newsletterRepository, id)
        return { success: true, sent: result.sent, failed: result.failed }
      } catch (err) {
        logger.error('admin_newsletter_send_failed', {
          campaignId: id,
          error: err instanceof Error ? err.message : String(err),
        })
        throw new AppError('Failed to send campaign', {
          statusCode: 500,
          code: 'campaign_send_failed',
          cause: err,
        })
      }
    },
  )

  app.post(
    '/admin/newsletter/preview',
    { preHandler: requireAdmin() },
    async (request) => {
      const parsed = previewSchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        throw new ValidationError('Invalid request', { details: parsed.error.issues })
      }
      const html = previewCampaignHtml({
        subject: parsed.data.subject,
        previewText: parsed.data.preview_text,
        bodyHtml: parsed.data.body_html,
      })
      return { html }
    },
  )
}
