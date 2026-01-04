/**
 * @deprecated Use backend/shared/health-server.ts instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 * 
 * **Note**: Health servers are for ECS deployments only. Lambda functions should not use health servers.
 */

import { createLogger } from '../shared/logger'
import { startHealthServer as startSharedHealthServer } from '../shared/health-server'
import { getMetrics, metricsContentType } from './gold-publisher-job-metrics'

export const startHealthServer = async (
  options: { port?: number; logger?: ReturnType<typeof createLogger> } = {},
) => {
  return startSharedHealthServer({
    ...options,
    loggerName: 'script.gold-publisher-health',
    getMetrics,
    metricsContentType,
    enableDatabaseCheck: false,
    enableRedisCheck: false,
    healthEndpoint: '/health',
  })
}

if (require.main === module) {
  const logger = createLogger('script.gold-publisher-health')
  let shutdownRequested = false

  startHealthServer({ logger })
    .then((healthServer) => {
      const shutdown = (signal: string) => {
        if (shutdownRequested) return
        shutdownRequested = true
        logger.info('shutdown_requested', { signal })
        healthServer
          .close()
          .then(() => process.exit(0))
          .catch((error) => {
            logger.error('shutdown_failed', {
              error: error instanceof Error ? error.message : String(error),
            })
            process.exit(1)
          })
      }

      process.on('SIGTERM', () => shutdown('SIGTERM'))
      process.on('SIGINT', () => shutdown('SIGINT'))
    })
    .catch((error) => {
      logger.error('health_server_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}


