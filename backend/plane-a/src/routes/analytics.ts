import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { AnalyticsRepository } from '../repositories'

const logger = createLogger('plane-a.analytics')
const planeAPool = getPool(config.db.planeAUrl)
const analyticsRepository = new AnalyticsRepository(planeAPool)

const dateRangeSchema = z.object({
  start_date: z.string().min(1),
  end_date: z.string().min(1),
})

const corridorSchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  sort_by: z.enum(['search_count', 'click_count', 'trend']).optional(),
})

const corridorTrendSchema = dateRangeSchema.extend({
  corridor_id: z.string().optional(),
  bucket: z.enum(['hour', 'day', 'week']).optional(),
})

const providersSchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  sort_by: z.enum(['click_count', 'ctr', 'unique_users']).optional(),
})

const providerCtrSchema = dateRangeSchema.extend({
  provider_id: z.string().optional(),
  bucket: z.enum(['hour', 'day', 'week']).optional(),
})

const engagementSchema = dateRangeSchema.extend({
  bucket: z.enum(['hour', 'day', 'week']).optional(),
})

const heatmapSchema = dateRangeSchema.extend({
  aggregation: z.enum(['country', 'city']).optional(),
  metric: z.enum(['search_count', 'click_count', 'unique_users']).optional(),
})

const savingsSchema = dateRangeSchema.extend({
  corridor_id: z.string().optional(),
})

const userBehaviorSchema = dateRangeSchema.extend({
  pattern_type: z.enum(['search_frequency', 'corridor_preferences', 'amount_distribution']).optional(),
})

const revenueSchema = dateRangeSchema.extend({
  provider_id: z.string().optional(),
  corridor_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
})

const parseDateRange = (input: { start_date: string; end_date: string }) => {
  const start = new Date(input.start_date)
  const end = new Date(input.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null
  }
  return { start, end }
}

export const analyticsRoutes = async (app: FastifyInstance) => {
  app.get('/analytics/corridors', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = corridorSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const corridors = await analyticsRepository.getPopularCorridors({
        startDate: range.start,
        endDate: range.end,
        limit: parsed.data.limit ?? 20,
      })

      return {
        corridors,
        period: {
          start_date: range.start.toISOString(),
          end_date: range.end.toISOString(),
        },
      }
    } catch (error) {
      logger.error('analytics_corridors_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/corridors/trends', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = corridorTrendSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const trends = await analyticsRepository.getCorridorTrends({
        corridorId: parsed.data.corridor_id,
        startDate: range.start,
        endDate: range.end,
        bucket: parsed.data.bucket ?? 'day',
      })

      return { trends }
    } catch (error) {
      logger.error('analytics_corridor_trends_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/providers', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = providersSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const providers = await analyticsRepository.getFavoriteProviders({
        startDate: range.start,
        endDate: range.end,
        limit: parsed.data.limit ?? 20,
      })

      return { providers }
    } catch (error) {
      logger.error('analytics_providers_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/providers/ctr', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = providerCtrSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const ctrData = await analyticsRepository.getProviderClickThroughRates({
        providerId: parsed.data.provider_id,
        startDate: range.start,
        endDate: range.end,
        bucket: parsed.data.bucket ?? 'day',
      })

      return { ctr_data: ctrData }
    } catch (error) {
      logger.error('analytics_provider_ctr_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/engagement', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = engagementSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const engagement = await analyticsRepository.getEngagementMetrics({
        startDate: range.start,
        endDate: range.end,
        bucket: parsed.data.bucket ?? 'day',
      })

      return { engagement }
    } catch (error) {
      logger.error('analytics_engagement_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/engagement/sessions', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = dateRangeSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const metrics = await analyticsRepository.getSessionMetrics({
        startDate: range.start,
        endDate: range.end,
      })

      return metrics
    } catch (error) {
      logger.error('analytics_session_metrics_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/heatmap', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = heatmapSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const heatmap = await analyticsRepository.getGeographicHeatmap({
        startDate: range.start,
        endDate: range.end,
        aggregation: parsed.data.aggregation ?? 'country',
      })

      return { heatmap }
    } catch (error) {
      logger.error('analytics_heatmap_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/savings', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = savingsSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const savings = await analyticsRepository.getSavingsMetrics({
        startDate: range.start,
        endDate: range.end,
        corridorId: parsed.data.corridor_id,
      })

      return savings
    } catch (error) {
      logger.error('analytics_savings_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/users', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = userBehaviorSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const patterns = await analyticsRepository.getUserBehaviorPatterns({
        startDate: range.start,
        endDate: range.end,
        patternType: parsed.data.pattern_type ?? 'search_frequency',
      })

      return { patterns }
    } catch (error) {
      logger.error('analytics_user_patterns_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/analytics/revenue', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = revenueSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const range = parseDateRange(parsed.data)
    if (!range) {
      reply.code(400)
      return { error: 'invalid_date_range' }
    }

    try {
      const revenue = await analyticsRepository.getRevenueMetrics({
        startDate: range.start,
        endDate: range.end,
        providerId: parsed.data.provider_id,
        corridorId: parsed.data.corridor_id,
        limit: parsed.data.limit ?? 200,
      })

      return {
        revenue,
        period: {
          start_date: range.start.toISOString(),
          end_date: range.end.toISOString(),
        },
      }
    } catch (error) {
      logger.error('analytics_revenue_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
