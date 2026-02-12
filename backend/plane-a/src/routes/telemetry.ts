import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { requireAdmin } from '../plugins/auth-plugin'
import { buildRateLimitKey, checkRateLimit } from '../utils/rate-limit'
import { ValidationError } from '../../../shared/errors'
import type { PlaneAContainer } from '../container'

const logger = createLogger('plane-a.telemetry')

const searchSchema = z.object({
  session_id: z.string().min(8),
  anon_id: z.string().optional(),
  corridor_id: z.string().min(3),
  amount: z.coerce.number().positive().optional(),
  amount_bucket: z.coerce.number().int().positive().optional(),
  payin: z.string().min(1).optional(),
  payout: z.string().min(1).optional(),
  utm: z.record(z.string()).optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
  page_path: z.string().optional(),
})

const clickSchema = z.object({
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
  quoted_rate: z.coerce.number().positive().optional(),
  quoted_fee: z.coerce.number().nonnegative().optional(),
  is_affiliate: z.coerce.boolean().optional(),
})

const conversionSchema = z.object({
  session_id: z.string().min(8),
  anon_id: z.string().optional(),
  provider_id: z.string().min(1),
  corridor_id: z.string().optional(),
  conversion_value: z.coerce.number().positive().optional(),
  conversion_currency: z.string().length(3).optional(),
  offer_id: z.string().optional(),
  source: z.string().optional(),
  page_path: z.string().optional(),
  utm: z.record(z.string()).optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
})

const sessionSchema = z.object({
  session_id: z.string().optional(),
  anon_id: z.string().optional(),
  referrer: z.string().optional(),
  first_page: z.string().optional(),
  utm: z.record(z.string()).optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  msclkid: z.string().optional(),
})

const analyticsSchema = z.object({
  metric: z.string().min(1),
  hours: z.coerce.number().int().positive().max(720).optional(),
})

const sanitizeTargetUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`
  } catch (error) {
    logger.debug('telemetry_target_url_sanitize_failed', {
      target_url: raw,
      error: error instanceof Error ? error.message : String(error),
    })
    const stripped = raw.split('?')[0] || raw
    return stripped.split('#')[0] || raw
  }
}

const makeId = () => {
  if (typeof randomUUID === 'function') {
    return randomUUID()
  }
  return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const getAnalyticsWindowHours = (hours?: number) => {
  return Number.isFinite(hours) && hours ? hours : 24
}

const getAnalyticsBucket = async (pool: PlaneAContainer['pool']) => {
  const result = await query<{ bucket: Date }>(
    `SELECT date_trunc('hour', NOW()) AS bucket`,
    [],
    pool,
  )
  return result.rows[0]?.bucket ?? new Date()
}

const shouldSkipTelemetry = async (
  userAccountRepository: PlaneAContainer['repositories']['userAccount'],
  userId?: string | null,
): Promise<boolean> => {
  if (!userId) return false
  try {
    const settings = await userAccountRepository.getPrivacySettings(userId)
    if (!settings?.updated_at) return true
    return settings.analytics_enabled === false
  } catch (error) {
    logger.warn('telemetry_privacy_lookup_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const fetchLiveTelemetryMetric = async (
  pool: PlaneAContainer['pool'],
  metric: string,
  since: Date,
) => {
  if (metric === 'heatmap') {
    const result = await query<{
      from_country: string
      to_country: string
      search_count: number
    }>(
      `SELECT split_part(corridor_id, '-', 1) AS from_country,
              split_part(corridor_id, '-', 2) AS to_country,
              COUNT(*)::int AS search_count
       FROM silver.telemetry_search_event
       WHERE ts >= $1
       GROUP BY 1, 2
       ORDER BY search_count DESC
       LIMIT 200`,
      [since],
      pool,
    )
    return result.rows
  }

  if (metric === 'popular_corridors') {
    const result = await query<{
      corridor_id: string
      search_count: number
    }>(
      `SELECT corridor_id,
              COUNT(*)::int AS search_count
       FROM silver.telemetry_search_event
       WHERE ts >= $1
       GROUP BY corridor_id
       ORDER BY search_count DESC
       LIMIT 100`,
      [since],
      pool,
    )
    return result.rows
  }

  if (metric === 'provider_favorites') {
    const result = await query<{
      provider_id: string
      corridor_id: string | null
      click_count: number
    }>(
      `SELECT provider_id,
              corridor_id,
              COUNT(*)::int AS click_count
       FROM silver.telemetry_outbound_click
       WHERE ts >= $1
       GROUP BY provider_id, corridor_id
       ORDER BY click_count DESC
       LIMIT 200`,
      [since],
      pool,
    )
    return result.rows
  }

  if (metric === 'engagement') {
    const result = await query<{
      avg_engagement: number | null
      session_count: number
    }>(
      `SELECT AVG(engagement_count)::float AS avg_engagement,
              COUNT(*)::int AS session_count
       FROM silver.telemetry_session
       WHERE last_activity >= $1`,
      [since],
      pool,
    )
    return {
      avg_engagement: result.rows[0]?.avg_engagement ?? 0,
      session_count: result.rows[0]?.session_count ?? 0,
    }
  }

  return []
}

export const telemetryRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const telemetryRepository = repositories.telemetry
  const userAccountRepository = repositories.userAccount

  app.post('/telemetry/search', async (request, reply) => {
    const parsed = searchSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const input = parsed.data
    const rateKey = buildRateLimitKey('telemetry:search', input.session_id)
    if (await checkRateLimit({ logger, key: rateKey, limit: 100, ttlSeconds: 60, component: 'telemetry' })) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    const amountBucket = input.amount_bucket ?? (
      input.amount ? computeBucketSelection(input.amount).bucket_used : null
    )
    if (!amountBucket) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'amount_bucket_or_amount_required' }] } })
    }

    try {
      if (await shouldSkipTelemetry(userAccountRepository, request.user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

      await telemetryRepository.createOrUpdateSession({
        session_id: input.session_id,
        anon_id: input.anon_id ?? null,
        user_id: request.user?.user_id ?? null,
        first_page: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
      })

      await telemetryRepository.recordSearchEvent({
        session_id: input.session_id,
        user_id: request.user?.user_id ?? null,
        corridor_id: input.corridor_id,
        amount_bucket: amountBucket,
        payin: input.payin ?? 'unknown',
        payout: input.payout ?? 'unknown',
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
        page_path: input.page_path ?? null,
      })

      return { success: true }
    } catch (error) {
      logger.warn('telemetry_search_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/telemetry/click', async (request, reply) => {
    const parsed = clickSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const input = parsed.data
    const rateKey = buildRateLimitKey('telemetry:click', input.session_id)
    if (await checkRateLimit({ logger, key: rateKey, limit: 50, ttlSeconds: 60, component: 'telemetry' })) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    try {
      if (await shouldSkipTelemetry(userAccountRepository, request.user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

      await telemetryRepository.createOrUpdateSession({
        session_id: input.session_id,
        anon_id: input.anon_id ?? null,
        user_id: request.user?.user_id ?? null,
        first_page: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
      })

      await telemetryRepository.recordOutboundClick({
        session_id: input.session_id,
        user_id: request.user?.user_id ?? null,
        provider_id: input.provider_id,
        corridor_id: input.corridor_id ?? null,
        target_url: sanitizeTargetUrl(input.target_url),
        page_path: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
        is_affiliate: input.is_affiliate ?? false,
      })

      await telemetryRepository.recordProviderVisit({
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
        quoted_rate: input.quoted_rate ?? null,
        quoted_fee: input.quoted_fee ?? null,
      })

      return { success: true }
    } catch (error) {
      logger.warn('telemetry_click_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/telemetry/conversion', async (request, reply) => {
    const parsed = conversionSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const input = parsed.data
    const rateKey = buildRateLimitKey('telemetry:conversion', input.session_id)
    if (await checkRateLimit({ logger, key: rateKey, limit: 40, ttlSeconds: 60, component: 'telemetry' })) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    try {
      if (await shouldSkipTelemetry(userAccountRepository, request.user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

      await telemetryRepository.createOrUpdateSession({
        session_id: input.session_id,
        anon_id: input.anon_id ?? null,
        user_id: request.user?.user_id ?? null,
        first_page: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
      })

      await telemetryRepository.recordAffiliateConversion({
        session_id: input.session_id,
        user_id: request.user?.user_id ?? null,
        provider_id: input.provider_id,
        corridor_id: input.corridor_id ?? null,
        conversion_value: input.conversion_value ?? null,
        conversion_currency: input.conversion_currency?.toUpperCase() ?? null,
        offer_id: input.offer_id ?? null,
        source: input.source ?? null,
        page_path: input.page_path ?? null,
        utm: input.utm ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        msclkid: input.msclkid ?? null,
      })

      return { success: true }
    } catch (error) {
      logger.warn('telemetry_conversion_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/telemetry/session', async (request, reply) => {
    const parsed = sessionSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const sessionId = parsed.data.session_id ?? makeId()
    const anonId = parsed.data.anon_id ?? makeId()

    try {
      if (await shouldSkipTelemetry(userAccountRepository, request.user?.user_id)) {
        return { success: true, skipped: 'opt_out' }
      }

      const session = await telemetryRepository.createOrUpdateSession({
        session_id: sessionId,
        anon_id: anonId,
        user_id: request.user?.user_id ?? null,
        first_page: parsed.data.first_page ?? null,
        referrer: parsed.data.referrer ?? null,
        utm: parsed.data.utm ?? null,
        gclid: parsed.data.gclid ?? null,
        fbclid: parsed.data.fbclid ?? null,
        msclkid: parsed.data.msclkid ?? null,
      })

      return {
        success: true,
        session_id: session.session_id,
        anon_id: session.anon_id,
        last_activity: session.last_activity.toISOString(),
      }
    } catch (error) {
      logger.warn('telemetry_session_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/telemetry/analytics', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = analyticsSchema.safeParse(request.query)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const windowHours = getAnalyticsWindowHours(parsed.data.hours)
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)

    try {
      const rows = await telemetryRepository.getAnalyticsAggregate({
        metric_name: parsed.data.metric,
        since: parsed.data.hours ? since : undefined,
      })

      if (!rows.length) {
        const timeBucket = await getAnalyticsBucket(planeAPool)
        const liveValue = await fetchLiveTelemetryMetric(planeAPool, parsed.data.metric, since)
        return {
          data: [
            {
              metric: parsed.data.metric,
              value: liveValue,
              time_bucket: timeBucket.toISOString(),
              dimensions: { window_hours: windowHours, source: 'live' },
              computed_at: new Date().toISOString(),
            },
          ],
        }
      }

      return {
        data: rows.map((row) => ({
          metric: row.metric_name,
          value: row.metric_value,
          time_bucket: row.time_bucket.toISOString(),
          dimensions: row.dimensions,
          computed_at: row.computed_at.toISOString(),
        })),
      }
    } catch (error) {
      logger.error('telemetry_analytics_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
