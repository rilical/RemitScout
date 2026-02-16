import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { ValidationError, NotFoundError } from '../../../shared/errors'

const logger = createLogger('plane-a.provider-visits')

const trackSchema = z.object({
  session_id: z.string().min(8),
  anon_id: z.string().optional(),
  provider_id: z.string().min(1),
  corridor_id: z.string().optional(),
  target_url: z.string().min(1),
  page_path: z.string().optional(),
  utm: z.record(z.string()).optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
  ttclid: z.string().optional(),
  li_fat_id: z.string().optional(),
  quoted_rate: z.coerce.number().positive().optional(),
  quoted_fee: z.coerce.number().nonnegative().optional(),
})

const pendingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional(),
})

const feedbackSchema = z.object({
  completed_transfer: z.boolean(),
  transfer_amount: z.coerce.number().positive().optional(),
  transfer_date: z.string().optional(),
  actual_rate: z.coerce.number().positive().optional(),
  actual_fee: z.coerce.number().nonnegative().optional(),
  feedback_rating: z.coerce.number().int().min(1).max(5).optional(),
  feedback_notes: z.string().max(2000).optional(),
})

const sanitizeTargetUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`
  } catch (error) {
    logger.debug('provider_visit_target_url_sanitize_failed', {
      raw_target_url: raw,
      error: error instanceof Error ? error.message : String(error),
    })
    const stripped = raw.split('?')[0] || raw
    return stripped.split('#')[0] || raw
  }
}

const toDateOrNull = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const providerVisitRoutes = async (app: FastifyInstance) => {
  const providerVisitRepository = app.container.repositories.providerVisit

  app.post('/provider-visits/track', async (request, reply) => {
    const parsed = trackSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const input = parsed.data
    try {
      await providerVisitRepository.createVisit({
        provider_id: input.provider_id,
        corridor_id: input.corridor_id ?? null,
        user_id: request.user?.user_id ?? null,
        anon_session_id: input.anon_id ?? null,
        session_id: input.session_id,
        target_url: sanitizeTargetUrl(input.target_url),
        page_path: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
        ttclid: input.ttclid ?? null,
        li_fat_id: input.li_fat_id ?? null,
        quoted_rate: input.quoted_rate ?? null,
        quoted_fee: input.quoted_fee ?? null,
      })
      return { success: true }
    } catch (error) {
      logger.warn('provider_visit_track_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/provider-visits/pending-feedback', { preHandler: requireAuth() }, async (request) => {
    const parsed = pendingSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const limit = parsed.data.limit ?? 3
    const user = request.user!
    const visits = await providerVisitRepository.listPendingFeedback(user.user_id, limit, 30)

    const ids = visits.map((visit) => visit.id)
    await providerVisitRepository.markReturned(ids)

    return {
      success: true,
      visits: visits.map((visit) => ({
        id: visit.id,
        provider_id: visit.provider_id,
        provider_name: visit.provider_name,
        corridor_id: visit.corridor_id,
        visit_timestamp: visit.visit_timestamp.toISOString(),
        target_url: visit.target_url,
        page_path: visit.page_path,
        quoted_rate: visit.quoted_rate,
        quoted_fee: visit.quoted_fee,
      })),
    }
  })

  app.post('/provider-visits/:id/feedback', { preHandler: requireAuth() }, async (request, _reply) => {
    const parsed = feedbackSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const user = request.user!
    const visitId = String((request.params as { id: string }).id)
    const visit = await providerVisitRepository.getVisitById(visitId)

    if (!visit || visit.user_id !== user.user_id) {
            throw new NotFoundError('Not found', { details: { error: 'not_found' } })
    }

    const transferDate = toDateOrNull(parsed.data.transfer_date)
    if (parsed.data.transfer_date && !transferDate) {
            throw new ValidationError('Invalid request', { details: { error: 'invalid_date', field: 'transfer_date' } })
    }

    let rateDifferencePct: number | null = null
    if (
      parsed.data.actual_rate &&
      visit.quoted_rate &&
      Number.isFinite(parsed.data.actual_rate) &&
      Number.isFinite(visit.quoted_rate)
    ) {
      rateDifferencePct =
        ((parsed.data.actual_rate - visit.quoted_rate) / visit.quoted_rate) * 100
    }

    const updated = await providerVisitRepository.recordFeedback(visitId, user.user_id, {
      completed_transfer: parsed.data.completed_transfer,
      transfer_amount: parsed.data.transfer_amount ?? null,
      transfer_date: transferDate ?? null,
      actual_rate: parsed.data.actual_rate ?? null,
      actual_fee: parsed.data.actual_fee ?? null,
      rate_difference_pct: rateDifferencePct ?? null,
      feedback_rating: parsed.data.feedback_rating ?? null,
      feedback_notes: parsed.data.feedback_notes ?? null,
    })

    if (!updated) {
            throw new NotFoundError('Not found', { details: { error: 'not_found' } })
    }

    return { success: true }
  })
}
