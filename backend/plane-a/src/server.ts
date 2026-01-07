import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { createShutdownHandler } from '../../shared/shutdown'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, shutdownTracing } from '../../shared/tracing'
import { buildApp } from './app'

if (config.env === 'production' || config.env === 'staging' || process.env.STRICT_CONFIG === '1') {
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

const start = async () => {
  let app: Awaited<ReturnType<typeof buildApp>> | null = null
  let isShutdownRequested = () => false

  try {
    app = await buildApp()
    const shutdown = createShutdownHandler({
      timeoutMs: 30000,
      logger,
      onShutdown: async () => {
        if (app) {
          await app.close()
        }
        await shutdownTracing()
      },
    })
    isShutdownRequested = shutdown.isShutdownRequested

    await app.listen({ port: config.planeA.port, host: '0.0.0.0' })
    logger.info('server_started', { port: config.planeA.port })
  } catch (error) {
    if (app?.log) {
      app.log.error(error)
    } else {
      logger.error('server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
    if (!isShutdownRequested()) {
      process.exit(1)
    }
  }
}

start()
