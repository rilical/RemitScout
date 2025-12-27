import Fastify from 'fastify'
import { randomUUID } from 'crypto'
import { config } from '../../shared/config'
import { createPool } from '../../shared/db'
import { quotesRoutes } from './routes/quotes'
import { popularCorridorsRoutes } from './routes/popular-corridors'

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

const start = async () => {
  try {
    await app.listen({ port: config.planeA.port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
