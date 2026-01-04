import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { createShutdownHandler } from '../../shared/shutdown'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, shutdownTracing } from '../../shared/tracing'
import { buildApp } from './app'

if (config.env === 'production' || process.env.STRICT_CONFIG === '1') {
  assertRuntimeConfig({
    requirePlaneA: true,
    requireRedis: true,
    requireSupabase: true,
    requireStripe: true,
    requireJwtSecret: config.planeA.requireJwt,
  })
}

initErrorTracking('plane-a')
initTracing('plane-a')

const logger = createLogger('plane-a.server')
const app = buildApp()

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    await app.close()
    await shutdownTracing()
  },
})

const start = async () => {
  try {
    await app.listen({ port: config.planeA.port, host: '0.0.0.0' })
    logger.info('server_started', { port: config.planeA.port })
  } catch (error) {
    app.log.error(error)
    if (!isShutdownRequested()) {
      process.exit(1)
    }
  }
}

start()
