import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { PopularCorridorRepository } from '../repositories'

const planeAPool = getPool(config.db.planeAUrl)
const popularCorridorRepository = new PopularCorridorRepository(planeAPool)
const logger = createLogger('plane-a.popular-corridors')

export const popularCorridorsRoutes = async (app: FastifyInstance) => {
  app.get('/api/popular-corridors', async (request, reply) => {
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

      return {
        success: true,
        timestamp: new Date().toISOString(),
        count: corridors.length,
        corridors,
      }
    } catch (error: any) {
      logger.error('popular_corridors_failed', {
        error: error.message,
        stack: error.stack,
      })
      reply.code(500)
      return {
        error: 'internal_error',
        message: 'Failed to fetch popular corridors',
      }
    }
  })
}
