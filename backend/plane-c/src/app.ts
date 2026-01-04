import Fastify, { type FastifyInstance } from 'fastify'
import { config } from '../../shared/config'
import { getPool } from '../../shared/db'
import {
  recordRequest,
  getMetrics as getApiMetrics,
  metricsContentType as apiMetricsContentType,
} from '../../shared/api-metrics'
import { publisherRoutes } from './routes/publisher'

export type PlaneCApp = {
  app: FastifyInstance
  pool: ReturnType<typeof getPool>
}

export const buildApp = (): PlaneCApp => {
  const app = Fastify({
    logger: { level: config.env === 'production' ? 'info' : 'debug' },
  })

  const pool = getPool(config.db.planeCUrl)

  app.get('/healthz', async () => ({ status: 'ok' }))

  app.get('/readyz', async (_request, reply) => {
    try {
      await pool.query('SELECT 1')
      return { status: 'ready' }
    } catch (error) {
      reply.code(503)
      return { status: 'not_ready' }
    }
  })

  app.get('/metrics', async (_request, reply) => {
    try {
      const metrics = await getApiMetrics()
      reply.type(apiMetricsContentType)
      return metrics
    } catch (error) {
      reply.code(500)
      return { error: 'Failed to collect metrics' }
    }
  })

  app.addHook('onResponse', async (request, reply) => {
    try {
      const method = request.method
      const route = request.routeOptions?.url || request.url.split('?')[0]
      const statusCode = reply.statusCode
      const durationSeconds = reply.elapsedTime / 1000
      recordRequest(method, route, statusCode, durationSeconds)

      reply.header('X-Content-Type-Options', 'nosniff')
      reply.header('X-Frame-Options', 'DENY')
      reply.header('X-XSS-Protection', '1; mode=block')
      if (config.env === 'production') {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    } catch {
      // Silently ignore metrics recording errors
    }
  })

  app.register(publisherRoutes)

  return { app, pool }
}
