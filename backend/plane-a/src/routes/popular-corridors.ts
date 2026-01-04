import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { getPool } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { recordSearch } from '../../../shared/business-metrics'
import { PopularCorridorRepository } from '../repositories'
import { getErrorMessage, getErrorStack } from '../types/errors'

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
      const corridors = await popularCorridorRepository.listPopularCorridors()

      if (!Array.isArray(corridors)) {
        logger.error('popular_corridors_invalid_response', {
          type: typeof corridors,
        })
        reply.code(500)
        return {
          error: 'internal_error',
          message: 'Invalid response from database',
        }
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
