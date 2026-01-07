import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { requireAdmin } from '../plugins/auth-plugin'
import { TelemetryRepository } from '../repositories'

const logger = createLogger('plane-a.telemetry')
const planeAPool = getPool(config.db.planeAUrl)
const telemetryRepository = new TelemetryRepository(planeAPool)

const searchSchema = z.object({
  session_id: z.string().min(8),
  anon_id: z.string().optional(),
  corridor_id: z.string().min(3),
  amount: z.coerce.number().positive().optional(),
  amount_bucket: z.coerce.number().int().positive().optional(),
  payin: z.string().min(1).optional(),
  payout: z.string().min(1).optional(),
  utm: z.record(z.string()).optional(),
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
  quoted_rate: z.coerce.number().positive().optional(),
  quoted_fee: z.coerce.number().nonnegative().optional(),
  is_affiliate: z.coerce.boolean().optional(),
})

const sessionSchema = z.object({
  session_id: z.string().optional(),
  anon_id: z.string().optional(),
  referrer: z.string().optional(),
  first_page: z.string().optional(),
})

const analyticsSchema = z.object({
  metric: z.string().min(1),
  hours: z.coerce.number().int().positive().max(720).optional(),
})

const sanitizeTargetUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`
  } catch {
    const stripped = raw.split('?')[0] || raw
    return stripped.split('#')[0] || raw
  }
}

const checkRateLimit = async (key: string, limit: number, ttlSeconds: number): Promise<boolean> => {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      logger.warn('telemetry_rate_limit_disabled', { reason: 'redis_unavailable' })
      return false
    }
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, ttlSeconds)
    }
    return count > limit
  } catch (error) {
    logger.warn('telemetry_rate_limit_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
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

const getAnalyticsBucket = async () => {
  const result = await query<{ bucket: Date }>(
    `SELECT date_trunc('hour', NOW()) AS bucket`,
    [],
    planeAPool,
  )
  return result.rows[0]?.bucket ?? new Date()
}

const fetchLiveTelemetryMetric = async (metric: string, since: Date) => {
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
      planeAPool,
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
      planeAPool,
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
      planeAPool,
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
      planeAPool,
    )
    return {
      avg_engagement: result.rows[0]?.avg_engagement ?? 0,
      session_count: result.rows[0]?.session_count ?? 0,
    }
  }

  return []
}

export const telemetryRoutes = async (app: FastifyInstance) => {
  app.post('/telemetry/search', async (request, reply) => {
    const parsed = searchSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    const rateKey = `telemetry:search:${input.session_id}`
    if (await checkRateLimit(rateKey, 100, 60)) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    const amountBucket = input.amount_bucket ?? (
      input.amount ? computeBucketSelection(input.amount).bucket_used : null
    )
    if (!amountBucket) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'amount_bucket_or_amount_required' }] }
    }

    try {
      await telemetryRepository.createOrUpdateSession({
        session_id: input.session_id,
        anon_id: input.anon_id ?? null,
        user_id: request.user?.user_id ?? null,
        first_page: input.page_path ?? null,
      })

      await telemetryRepository.recordSearchEvent({
        session_id: input.session_id,
        user_id: request.user?.user_id ?? null,
        corridor_id: input.corridor_id,
        amount_bucket: amountBucket,
        payin: input.payin ?? 'unknown',
        payout: input.payout ?? 'unknown',
        utm: input.utm ?? null,
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
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const input = parsed.data
    const rateKey = `telemetry:click:${input.session_id}`
    if (await checkRateLimit(rateKey, 50, 60)) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    try {
      await telemetryRepository.createOrUpdateSession({
        session_id: input.session_id,
        anon_id: input.anon_id ?? null,
        user_id: request.user?.user_id ?? null,
        first_page: input.page_path ?? null,
      })

      await telemetryRepository.recordOutboundClick({
        session_id: input.session_id,
        user_id: request.user?.user_id ?? null,
        provider_id: input.provider_id,
        corridor_id: input.corridor_id ?? null,
        target_url: sanitizeTargetUrl(input.target_url),
        page_path: input.page_path ?? null,
        utm: input.utm ?? null,
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

  app.post('/telemetry/session', async (request, reply) => {
    const parsed = sessionSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const sessionId = parsed.data.session_id ?? makeId()
    const anonId = parsed.data.anon_id ?? makeId()

    try {
      const session = await telemetryRepository.createOrUpdateSession({
        session_id: sessionId,
        anon_id: anonId,
        user_id: request.user?.user_id ?? null,
        first_page: parsed.data.first_page ?? null,
        referrer: parsed.data.referrer ?? null,
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
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const windowHours = getAnalyticsWindowHours(parsed.data.hours)
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)

    try {
      const rows = await telemetryRepository.getAnalyticsAggregate({
        metric_name: parsed.data.metric,
        since: parsed.data.hours ? since : undefined,
      })

      if (!rows.length) {
        const timeBucket = await getAnalyticsBucket()
        const liveValue = await fetchLiveTelemetryMetric(parsed.data.metric, since)
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
