import type { FastifyInstance } from 'fastify'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'

const planeAPool = createPool(config.db.planeAUrl)

export const popularCorridorsRoutes = async (app: FastifyInstance) => {
  app.get('/api/popular-corridors', async () => {
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

    return {
      success: true,
      timestamp: new Date().toISOString(),
      count: result.rowCount,
      corridors: result.rows,
    }
  })
}
