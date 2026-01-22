import type { FastifyInstance } from 'fastify'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { getPool } from '../../../shared/db'

const logger = createLogger('plane-a.rds-proxy-monitor')

/**
 * Monitor and log RDS Proxy connection information
 * Helps verify RDS Proxy is being used correctly
 */
export const setupRdsProxyMonitor = (app: FastifyInstance): void => {
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )

  if (!isAwsRuntime) {
    return
  }

  // Log connection pool info on first request
  let poolInfoLogged = false

  app.addHook('onRequest', async () => {
    if (poolInfoLogged) return

    try {
      const pool = getPool(config.db.planeAUrl)
      const connectionString = config.db.planeAUrl || ''
      
      // Check if connection string contains RDS Proxy endpoint
      const isProxyEndpoint = connectionString.includes('.proxy-') || 
                             connectionString.includes('rds-proxy') ||
                             process.env.PLANE_A_DB_HOST?.includes('.proxy-')

      logger.info('database_connection_info', {
        has_connection_string: Boolean(connectionString),
        is_proxy_endpoint: isProxyEndpoint,
        host_env: process.env.PLANE_A_DB_HOST,
        secret_arn_env: process.env.PLANE_A_DB_SECRET_ARN,
        ssm_name_env: process.env.PLANE_A_DB_SSM_NAME,
        ssl_mode: process.env.PGSSLMODE,
        pool_total: pool.totalCount,
        pool_idle: pool.idleCount,
        pool_active: pool.totalCount - pool.idleCount,
        message: isProxyEndpoint 
          ? 'RDS Proxy endpoint detected - connection pooling optimized'
          : 'Direct RDS endpoint - consider using RDS Proxy for Lambda',
      })

      poolInfoLogged = true
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.warn('rds_proxy_monitor_failed', {
        error: errorMessage,
      })
    }
  })
}
