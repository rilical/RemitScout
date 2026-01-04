import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { createShutdownHandler } from '../../shared/shutdown'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, shutdownTracing } from '../../shared/tracing'
import { buildApp } from './app'

if (config.env === 'production' || process.env.STRICT_CONFIG === '1') {
  assertRuntimeConfig({
    requirePlaneC: true,
  })
}

initErrorTracking('plane-c')
initTracing('plane-c')

const logger = createLogger('plane-c.server')
const { app, pool } = buildApp()

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    await app.close()
    await pool.end()
    await shutdownTracing()
  },
})

const start = async () => {
  try {
    await app.listen({ port: config.planeC.port, host: '0.0.0.0' })
    logger.info('server_started', { port: config.planeC.port })
  } catch (error) {
    app.log.error(error)
    if (!isShutdownRequested()) {
      process.exit(1)
    }
  }
}

start()
