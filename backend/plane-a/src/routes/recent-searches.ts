import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { requireAuth } from '../plugins/auth-plugin'
import { RecentSearchRepository } from '../repositories'

const logger = createLogger('plane-a.recent-searches')
const planeAPool = getPool(config.db.planeAUrl)
const recentSearchRepository = new RecentSearchRepository(planeAPool)

const listSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

const createSchema = z.object({
  from_country: z.string().length(2),
  to_country: z.string().length(2),
  amount: z.coerce.number().positive(),
  method: z.enum(['bank', 'cash', 'wallet']),
  best_provider_name: z.string().optional(),
  best_provider_recipient: z.coerce.number().positive().optional(),
})

const checkRateLimit = async (userId: string): Promise<boolean> => {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      logger.warn('recent_search_rate_limit_disabled', { reason: 'redis_unavailable' })
      return false
    }
    const key = `recent-search:rate:${userId}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 3600)
    }
    return count > 100
  } catch (error) {
    logger.warn('recent_search_rate_limit_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const toRecentSearchPayload = (row: {
  id: string
  from_country: string
  to_country: string
  amount: number
  method: string
  best_provider_name: string | null
  best_provider_recipient: number | null
  created_at: Date
}) => ({
  id: row.id,
  from: row.from_country,
  to: row.to_country,
  amount: row.amount,
  method: row.method,
  bestProvider: row.best_provider_name
    ? {
        name: row.best_provider_name,
        recipientGets: row.best_provider_recipient ?? 0,
      }
    : undefined,
  createdAt: row.created_at.toISOString(),
})

export const recentSearchRoutes = async (app: FastifyInstance) => {
  app.get('/recent-searches', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const user = request.user!
    const limit = parsed.data.limit ?? 20

    try {
      const rows = await recentSearchRepository.getByUserAndLimit(user.user_id, limit)
      return {
        data: rows.map(toRecentSearchPayload),
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('recent_search_list_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/recent-searches', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const user = request.user!
    const input = parsed.data

    if (await checkRateLimit(user.user_id)) {
      reply.code(429)
      return { error: 'rate_limited' }
    }

    try {
      const record = await recentSearchRepository.upsertRecent(
        {
          user_id: user.user_id,
          from_country: input.from_country.toUpperCase(),
          to_country: input.to_country.toUpperCase(),
          amount: input.amount,
          method: input.method,
          best_provider_name: input.best_provider_name ?? null,
          best_provider_recipient: input.best_provider_recipient ?? null,
        },
        5,
      )

      await recentSearchRepository.trimUserSearches(user.user_id, 50)

      return {
        success: true,
        search: toRecentSearchPayload(record),
      }
    } catch (error) {
      logger.error('recent_search_create_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
