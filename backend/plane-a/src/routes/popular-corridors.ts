import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { createPool } from '../../../shared/db'
import { config } from '../../../shared/config'

const planeAPool = createPool(config.db.planeAUrl)

export const popularCorridorsRoutes = async (app: FastifyInstance) => {
  app.get('/api/popular-corridors', async (request, reply) => {
    const result = await planeAPool.query(
      `SELECT route,
              count_24h,
              top_provider,
              fee_range,
              speed_range,
              best_for,
              updated_at
         FROM gold.popular_corridors
        ORDER BY count_24h DESC`,
    )

    const cachePayload = JSON.stringify({ count: result.rowCount, corridors: result.rows })
    const etag = `"${createHash('sha256').update(cachePayload).digest('hex')}"`
    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    reply.header('ETag', etag)
    if (request.headers['if-none-match'] === etag) {
      reply.code(304)
      return ''
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      count: result.rowCount,
      corridors: result.rows,
    }
  })
}
