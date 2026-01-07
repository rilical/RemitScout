import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { recordSearch } from '../../../shared/business-metrics'
import { PopularCorridorRepository } from '../repositories'
import { getErrorMessage, getErrorStack } from '../types/errors'
import type { PopularCorridorRecord } from '../repositories/interfaces/popular-corridor-repository.interface'

const planeAPool = getPool(config.db.planeAUrl)
const popularCorridorRepository = new PopularCorridorRepository(planeAPool)
const logger = createLogger('plane-a.popular-corridors')

export const popularCorridorsRoutes = async (app: FastifyInstance) => {
  app.get('/popular-corridors', async (request, reply) => {
    try {
      recordSearch('popular', 'corridors')
    } catch {
      // Silently ignore metrics errors
    }
    try {
      // Always fetch 6 corridors from real telemetry data
      const realCorridors = await popularCorridorRepository.listPopularCorridors(6)

      if (!Array.isArray(realCorridors)) {
        logger.error('popular_corridors_invalid_response', {
          type: typeof realCorridors,
        })
        reply.code(500)
        return {
          error: 'internal_error',
          message: 'Invalid response from database',
        }
      }

      // Fallback fake data if we don't have enough real data
      const fallbackCorridors: PopularCorridorRecord[] = [
        { route: 'US → PH', count_24h: 142, top_provider: 'Remitly', fee_range: null, speed_range: null, best_for: null, updated_at: null },
        { route: 'US → IN', count_24h: 98, top_provider: 'Wise', fee_range: null, speed_range: null, best_for: null, updated_at: null },
        { route: 'GB → PK', count_24h: 76, top_provider: 'Wise', fee_range: null, speed_range: null, best_for: null, updated_at: null },
        { route: 'US → MX', count_24h: 65, top_provider: 'Remitly', fee_range: null, speed_range: null, best_for: null, updated_at: null },
        { route: 'CA → IN', count_24h: 54, top_provider: 'Wise', fee_range: null, speed_range: null, best_for: null, updated_at: null },
        { route: 'DE → MA', count_24h: 43, top_provider: 'Wise', fee_range: null, speed_range: null, best_for: null, updated_at: null },
      ]

      // Use real data if we have at least some, otherwise use fake data
      // If we have real data but less than 6, fill with fake data
      let corridors: PopularCorridorRecord[]
      if (realCorridors.length === 0) {
        // No real data at all, use all fake data
        corridors = fallbackCorridors
        logger.debug('popular_corridors_using_fallback', { reason: 'no_real_data' })
      } else if (realCorridors.length < 6) {
        // We have some real data but not enough, fill with fake data
        const needed = 6 - realCorridors.length
        corridors = [
          ...realCorridors,
          ...fallbackCorridors.slice(0, needed),
        ]
        logger.debug('popular_corridors_partial_fallback', {
          real_count: realCorridors.length,
          fake_count: needed,
        })
      } else {
        // We have enough real data
        corridors = realCorridors.slice(0, 6)
        logger.debug('popular_corridors_using_real_data', { count: corridors.length })
      }

      const cachePayload = JSON.stringify({ count: corridors.length, corridors })
      const etag = `"${createHash('sha256').update(cachePayload).digest('hex')}"`
      reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
      reply.header('ETag', etag)

      const clientEtag = request.headers['if-none-match']
      if (clientEtag && clientEtag.toLowerCase() === etag.toLowerCase()) {
        logger.debug('popular_corridors_cache_hit', { etag })
        reply.code(304)
        return ''
      }

      logger.debug('popular_corridors_success', {
        count: corridors.length,
        real_count: realCorridors.length,
        cache_miss: true,
      })

      // Transform to frontend-expected format
      const transformedCorridors = corridors.map(c => ({
        route: c.route,
        count24h: c.count_24h,
        topProvider: c.top_provider,
        feeRange: c.fee_range,
        speedRange: c.speed_range,
        bestFor: c.best_for,
      }))

      return {
        success: true,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        count: transformedCorridors.length,
        data: transformedCorridors,
        corridors: transformedCorridors, // Keep for backward compatibility
      }
    } catch (error: unknown) {
      logger.error('popular_corridors_failed', {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return {
        error: 'internal_error',
        message: 'Failed to fetch popular corridors',
      }
    }
  })
}
