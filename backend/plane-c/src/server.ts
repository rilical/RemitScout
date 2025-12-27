import Fastify from 'fastify'
import { config } from '../../shared/config'

const app = Fastify({
  logger: { level: config.env === 'production' ? 'info' : 'debug' },
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
