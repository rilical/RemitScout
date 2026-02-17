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
import { GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs'

import { createLogger } from './logger'
import { config } from './config'
import { getRedisClient } from './redis'
import { createPool } from './db'
import { withAbortTimeout, withTimeout } from './utils/timeout'

const moduleLogger = createLogger('shared.health-server')

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
  enableSqsCheck?: boolean
  sqsQueueUrl?: string | string[]
  healthEndpoint?: string
  deepEndpoint?: string
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
    await withTimeout(pool.query('SELECT 1'), 2000, 'database_check')
    return true
  } catch (error) {
    moduleLogger.debug('health_database_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const checkRedis = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient()
    if (!client) {
      return false
    }
    await withTimeout(client.ping(), 2000, 'redis_check_ping')
    return true
  } catch (error) {
    moduleLogger.debug('health_redis_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const checkSqs = async (queueUrls: string[]): Promise<boolean> => {
  if (queueUrls.length === 0) return false
  const sqs = new SQSClient({})
  try {
    for (const queueUrl of queueUrls) {
      await withAbortTimeout(
        (signal) => sqs.send(
          new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['QueueArn'],
          }),
          { abortSignal: signal },
        ),
        2000,
        'health_sqs_check',
      )
    }
    return true
  } catch (error) {
    moduleLogger.debug('health_sqs_check_failed', {
      queue_count: queueUrls.length,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  } finally {
    sqs.destroy()
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
  
  const healthEndpoint = options.healthEndpoint ?? '/healthz'
  const deepEndpoint = options.deepEndpoint ?? '/healthz/deep'
  const readyEndpoint = options.readyEndpoint ?? '/readyz'
  const metricsEndpoint = options.metricsEndpoint ?? '/metrics'
  const enableDatabaseCheck = options.enableDatabaseCheck ?? true
  const enableRedisCheck = options.enableRedisCheck ?? true
  const enableSqsCheck = options.enableSqsCheck ?? false
  const queueUrls = (() => {
    const raw = options.sqsQueueUrl
    if (!raw) return []
    const values = Array.isArray(raw) ? raw : [raw]
    return values.map((value) => value.trim()).filter(Boolean)
  })()
  const ownsPool = enableDatabaseCheck && !options.pool
  const pool = enableDatabaseCheck ? (options.pool ?? createPool(config.db.planeBUrl)) : null
  const buildVersion = config.build.version || 'unknown'

  const buildBasePayload = () => ({
    version: buildVersion,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })

  const getDependencyChecks = async () => {
    const checks: Record<string, string> = {}
    if (enableDatabaseCheck && pool) {
      checks.database = (await checkDatabase(pool)) ? 'ok' : 'unreachable'
    }
    if (enableRedisCheck) {
      checks.redis = (await checkRedis()) ? 'ok' : 'unreachable'
    }
    if (enableSqsCheck) {
      checks.sqs = (await checkSqs(queueUrls)) ? 'ok' : 'unreachable'
    }
    return checks
  }

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end('method_not_allowed')
      return
    }

    const path = req.url?.split('?')[0] ?? ''

    // Health endpoint (liveness probe)
    if (path === healthEndpoint || path === '/health') {
      sendJson(res, 200, {
        status: 'ok',
        ...buildBasePayload(),
      })
      return
    }

    // Deep health endpoint (startup probe): verifies external dependencies.
    if (path === deepEndpoint) {
      const checks = await getDependencyChecks()
      const allOk = Object.values(checks).every(status => status === 'ok')
      const status = allOk ? 'ok' : 'not_ok'
      const statusCode = allOk ? 200 : 503

      sendJson(res, statusCode, {
        status,
        dependencies: checks,
        ...buildBasePayload(),
      })
      return
    }

    // Readiness endpoint (readiness probe)
    if (path === readyEndpoint || path === '/ready') {
      const checks = await getDependencyChecks()
      const allOk = Object.values(checks).every(status => status === 'ok')
      const status = allOk ? 'ready' : 'not_ready'
      const statusCode = allOk ? 200 : 503

      sendJson(res, statusCode, {
        status,
        dependencies: checks,
        ...buildBasePayload(),
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
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
      if (ownsPool && pool) {
        await pool.end().catch(() => {
          // Ignore close errors for health-only pools.
        })
      }
    },
  }
}

