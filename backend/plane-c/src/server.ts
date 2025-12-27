import Fastify from 'fastify'
import { config } from '../../shared/config'
import { createPool } from '../../shared/db'

const app = Fastify({
  logger: { level: config.env === 'production' ? 'info' : 'debug' },
})

const planeCPool = createPool(config.db.planeCUrl)

app.get('/healthz', async () => ({ status: 'ok' }))

app.get('/readyz', async (_request, reply) => {
  try {
    await planeCPool.query('SELECT 1')
    return { status: 'ready' }
  } catch (error) {
    reply.code(503)
    return { status: 'not_ready' }
  }
})

const start = async () => {
  try {
    await app.listen({ port: config.planeC.port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
