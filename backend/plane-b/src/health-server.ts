import http from 'node:http'
import type { Pool } from 'pg'

import { createLogger } from '../../shared/logger'
import { config } from '../../shared/config'
import { getRedisClient } from '../../shared/redis'
import { createPool } from '../../shared/db'
import {
  getMetrics as getDataHealthMetrics,
  metricsContentType as dataHealthMetricsContentType,
  startDataHealthMetricsRefresh,
  stopDataHealthMetricsRefresh,
} from '../../shared/data-health-metrics'
import {
  getMetrics as getCollectorMetrics,
} from './collectors/collector-metrics'

type HealthServer = {
  close: () => Promise<void>
}

type HealthServerOptions = {
  port?: number
  pool?: Pool
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

const checkDatabase = async (pool: Pool): Promise<boolean> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('database_check_timeout')), 2000)
    })
    await Promise.race([
      pool.query('SELECT 1'),
      timeoutPromise,
    ])
    return true
  } catch {
    return false
  }
}

const checkRedis = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient()
    if (!client) {
      return false
    }
    await client.ping()
    return true
  } catch {
    return false
  }
}

export const startHealthServer = async (
  options: HealthServerOptions = {},
): Promise<HealthServer> => {
  const logger = options.logger ?? createLogger('plane-b.health-server')
  const port = options.port ?? toNumber(process.env.HEALTH_PORT, 8080)
  const pool = options.pool ?? createPool(config.db.planeBUrl)

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end('method_not_allowed')
      return
    }

    const path = req.url?.split('?')[0] ?? ''

    if (path === '/healthz') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
      return
    }

    if (path === '/readyz') {
      const [dbOk, redisOk] = await Promise.all([
        checkDatabase(pool),
        checkRedis(),
      ])

      const dependencies = {
        database: dbOk ? 'ok' : 'unreachable',
        redis: redisOk ? 'ok' : 'unreachable',
      }

      const status = dbOk && redisOk ? 'ready' : 'not_ready'
      const statusCode = dbOk && redisOk ? 200 : 503

      sendJson(res, statusCode, {
        status,
        dependencies,
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (path === '/metrics') {
      Promise.all([
        getDataHealthMetrics().catch((error: unknown) => {
          logger.warn('data_health_metrics_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          return ''
        }),
        getCollectorMetrics().catch((error: unknown) => {
          logger.warn('collector_metrics_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          return ''
        }),
      ])
        .then(([dataHealthMetrics, collectorMetrics]) => {
          const combined = [dataHealthMetrics, collectorMetrics]
            .filter(Boolean)
            .join('\n')
          res.statusCode = 200
          res.setHeader('content-type', dataHealthMetricsContentType)
          res.end(combined)
        })
        .catch((error: unknown) => {
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

  startDataHealthMetricsRefresh(pool, 5)

  logger.info('health_server_listening', { port })

  return {
    close: () =>
      new Promise((resolve, reject) => {
        stopDataHealthMetricsRefresh()
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
