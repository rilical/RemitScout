import Fastify from 'fastify'
import { randomUUID } from 'crypto'
import { config } from '../../shared/config'

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

const start = async () => {
  try {
    await app.listen({ port: config.planeA.port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
