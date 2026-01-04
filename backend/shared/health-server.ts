/**
 * Shared Health Server - Common health server implementation for batch jobs and workers.
 * 
 * This module provides a reusable health server that can be used by any batch job or worker.
 * Only the logger name and metrics function differ between implementations.
 * 
 * **Note**: This is for ECS deployments only. Lambda functions should not use health servers.
 */

import http from 'node:http'
import type { Pool } from 'pg'

import { createLogger } from './logger'
import { config } from './config'
import { getRedisClient } from './redis'
import { createPool } from './db'

export type HealthServer = {
  close: () => Promise<void>
}

export type HealthServerOptions = {
  port?: number
  pool?: Pool
  logger?: ReturnType<typeof createLogger>
  loggerName?: string
  getMetrics?: () => Promise<string>
  metricsContentType?: string
  enableDatabaseCheck?: boolean
  enableRedisCheck?: boolean
  healthEndpoint?: string
  readyEndpoint?: string
  metricsEndpoint?: string
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

/**
 * Starts a health server for batch jobs and workers.
 * 
 * @param options - Health server configuration
 * @returns Health server instance with close() method
 */
export const startHealthServer = async (
  options: HealthServerOptions = {},
): Promise<HealthServer> => {
  const loggerName = options.loggerName ?? 'shared.health-server'
  const logger = options.logger ?? createLogger(loggerName)
  const port = options.port ?? toNumber(process.env.HEALTH_PORT, 8080)
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  
  const healthEndpoint = options.healthEndpoint ?? '/healthz'
  const readyEndpoint = options.readyEndpoint ?? '/readyz'
  const metricsEndpoint = options.metricsEndpoint ?? '/metrics'
  const enableDatabaseCheck = options.enableDatabaseCheck ?? true
  const enableRedisCheck = options.enableRedisCheck ?? true

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end('method_not_allowed')
      return
    }

    const path = req.url?.split('?')[0] ?? ''

    // Health endpoint (liveness probe)
    if (path === healthEndpoint || path === '/health') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
      return
    }

    // Readiness endpoint (readiness probe)
    if (path === readyEndpoint || path === '/ready') {
      const checks: Record<string, string> = {}
      
      if (enableDatabaseCheck) {
        checks.database = (await checkDatabase(pool)) ? 'ok' : 'unreachable'
      }
      
      if (enableRedisCheck) {
        checks.redis = (await checkRedis()) ? 'ok' : 'unreachable'
      }

      const allOk = Object.values(checks).every(status => status === 'ok')
      const status = allOk ? 'ready' : 'not_ready'
      const statusCode = allOk ? 200 : 503

      sendJson(res, statusCode, {
        status,
        dependencies: checks,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // Metrics endpoint
    if (path === metricsEndpoint) {
      if (options.getMetrics) {
        try {
          const metrics = await options.getMetrics()
          res.statusCode = 200
          res.setHeader('content-type', options.metricsContentType ?? 'text/plain')
          res.end(metrics)
        } catch (error: unknown) {
          logger.error('metrics_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          res.statusCode = 500
          res.end('metrics_error')
        }
      } else {
        res.statusCode = 404
        res.end('metrics_not_configured')
      }
      return
    }

    res.statusCode = 404
    res.end('not_found')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve())
  })

  logger.info('health_server_listening', { port, logger_name: loggerName })

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


