import http from 'node:http'

import { createLogger } from '../shared/logger'
import { getMetrics, metricsContentType } from './gold-fx-rates-job-metrics'

type HealthServer = {
  close: () => Promise<void>
}

type HealthServerOptions = {
  port?: number
  logger?: ReturnType<typeof createLogger>
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const sendJson = (res: http.ServerResponse, statusCode: number, payload: Record<string, unknown>) => {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

export const startHealthServer = async (
  options: HealthServerOptions = {},
): Promise<HealthServer> => {
  const logger = options.logger ?? createLogger('script.gold-fx-rates-health')
  const port = options.port ?? toNumber(process.env.HEALTH_PORT, 8080)

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end('method_not_allowed')
      return
    }

    const path = req.url?.split('?')[0] ?? ''
    if (path === '/health') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
      return
    }

    if (path === '/metrics') {
      getMetrics()
        .then((metrics) => {
          res.statusCode = 200
          res.setHeader('content-type', metricsContentType)
          res.end(metrics)
        })
        .catch((error) => {
          logger.error('metrics_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          res.statusCode = 500
          res.end('metrics_error')
        })
      return
    }

    res.statusCode = 404
    res.end('not_found')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve())
  })

  logger.info('health_server_listening', { port })

  return {
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

if (require.main === module) {
  const logger = createLogger('script.gold-fx-rates-health')
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




