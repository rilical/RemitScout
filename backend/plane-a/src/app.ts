import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { randomUUID } from 'crypto'
import { config } from '../../shared/config'
import { createPool } from '../../shared/db'
import { authPlugin } from './plugins/auth-plugin'
import { billingRoutes } from './routes/billing'
import { meRoutes } from './routes/me'
import { quotesRoutes } from './routes/quotes'
import { pulseStatusRoutes } from './routes/pulse-status'
import { popularCorridorsRoutes } from './routes/popular-corridors'

export const buildApp = () => {
  const app = Fastify({
    logger: { level: config.env === 'production' ? 'info' : 'debug' },
    genReqId: (req) => {
      const headerId = req.headers['x-request-id']
      if (typeof headerId === 'string' && headerId.trim()) {
        return headerId
      }
      if (Array.isArray(headerId) && headerId[0]) {
        return headerId[0]
      }
      return randomUUID()
    },
  })

  const planeAPool = createPool(config.db.planeAUrl)

  app.register(authPlugin)
  app.register(rateLimit, {
    global: true,
    hook: 'preHandler',
    timeWindow: config.planeA.rateLimitWindowMs,
    max: (request) => (request.user ? config.planeA.rateLimitMax * 5 : config.planeA.rateLimitMax),
    keyGenerator: (request) => (request.user ? `user:${request.user.user_id}` : `ip:${request.ip}`),
  })

  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    if (request.url === '/api/billing/webhook') {
      done(null, body)
      return
    }
    const buffer = body as Buffer
    if (!buffer.length) {
      done(null, {})
      return
    }
    try {
      const parsed = JSON.parse(buffer.toString('utf8'))
      done(null, parsed)
    } catch (error) {
      done(error as Error, undefined)
    }
  })

  app.get('/healthz', async () => ({ status: 'ok' }))

  app.get('/readyz', async (_request, reply) => {
    try {
      await planeAPool.query('SELECT 1')
      return { status: 'ready' }
    } catch (error) {
      reply.code(503)
      return { status: 'not_ready' }
    }
  })

  app.register(quotesRoutes)
  app.register(popularCorridorsRoutes)
  app.register(meRoutes)
  app.register(billingRoutes)
  app.register(pulseStatusRoutes)

  return app
}
