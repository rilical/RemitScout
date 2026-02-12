import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { config } from './config'
import { recordQueryFromSql, updateConnectionPoolMetrics } from './db-metrics'
import { registerDatabasePool } from './connection-manager'
import { createLogger } from './logger'

const logger = createLogger('shared.db')
const activePools = new Set<Pool>()
let cleanupHandlersRegistered = false

const registerPoolForCleanup = (pool: Pool) => {
  activePools.add(pool)
  if (cleanupHandlersRegistered) {
    return
  }
  cleanupHandlersRegistered = true

  const cleanup = () => {
    for (const activePool of activePools) {
      activePool.end().catch(() => {
        // Silently fail on cleanup
      })
    }
    activePools.clear()
  }

  process.once('exit', cleanup)
  if (process.env.DB_DISABLE_POOL_SIGNAL_CLEANUP !== '1') {
    process.once('SIGTERM', cleanup)
    process.once('SIGINT', cleanup)
  }
}

/**
 * Gets pool size limits based on runtime environment.
 */
const getPoolSizeLimits = (): { max: number; min: number } => {
  const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
  const isECS = Boolean(
    process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4,
  )

  const defaultLimits = (() => {
    if (isLambda) {
      return { max: 20, min: 1 }
    }
    if (isECS) {
      return { max: 50, min: 2 }
    }
    return { max: 10, min: 1 }
  })()

  const resolveOverride = (value: string | undefined): number | null => {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return null
    return Math.max(0, Math.floor(parsed))
  }

  const envMax = resolveOverride(process.env.DB_POOL_MAX)
  const envMin = resolveOverride(process.env.DB_POOL_MIN)

  let max = envMax ?? defaultLimits.max
  let min = envMin ?? defaultLimits.min

  if (max <= 0) {
    max = defaultLimits.max
  }
  if (min < 0) {
    min = defaultLimits.min
  }
  if (min > max) {
    min = max
  }

  return { max, min }
}

export const normalizeConnectionStringForSslMode = (
  connectionString: string,
  sslMode: string | undefined,
): string => {
  if (!connectionString || (sslMode !== 'require' && sslMode !== 'disable')) {
    return connectionString
  }

  try {
    const parsed = new URL(connectionString)
    const sslParams = ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert']
    const hasSslParams = sslParams.some((param) => parsed.searchParams.has(param))
    if (!hasSslParams) {
      return connectionString
    }
    for (const param of sslParams) {
      parsed.searchParams.delete(param)
    }
    return parsed.toString()
  } catch {
    return connectionString
  }
}

export const createPool = (connectionString?: string) => {
  const sslMode = process.env.DB_SSL_MODE || process.env.PGSSLMODE
  const sslEnabled = sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'verify-ca'
  const queryTimeoutMs = Number(process.env.DB_QUERY_TIMEOUT_MS) || 30000 // 30 seconds default
  const connectionTimeoutMs = Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 10000 // 10 seconds
  const idleTimeoutMs = Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000
  const keepAliveEnabled = process.env.DB_KEEPALIVE !== '0'
  const keepAliveInitialDelayMs = Number(process.env.DB_KEEPALIVE_INITIAL_DELAY_MS) || 10000
  const maxUses = Number(process.env.DB_MAX_USES) || 0
  const isProduction = process.env.NODE_ENV === 'production'
  const poolLimits = getPoolSizeLimits()
  const resolvedConnectionString = connectionString || config.db.url
  const normalizedConnectionString = normalizeConnectionStringForSslMode(
    resolvedConnectionString,
    sslMode,
  )
  const disableStatementTimeout = (() => {
    if (process.env.DB_DISABLE_STATEMENT_TIMEOUT === '1') return true
    if (!normalizedConnectionString) return false
    try {
      const host = new URL(normalizedConnectionString).hostname
      return host.includes('.proxy-') || host.includes('proxy-')
    } catch {
      return normalizedConnectionString.includes('.proxy-')
        || normalizedConnectionString.includes('proxy-')
    }
  })()

  // SSL configuration: verify certificates in production
  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: isProduction && (sslMode === 'verify-full' || sslMode === 'verify-ca'),
      }
    : undefined

  const pool = new Pool({
    connectionString: normalizedConnectionString,
    ssl: sslConfig,
    ...(disableStatementTimeout ? {} : { statement_timeout: queryTimeoutMs }),
    query_timeout: queryTimeoutMs,
    connectionTimeoutMillis: connectionTimeoutMs,
    max: poolLimits.max,
    min: poolLimits.min,
    idleTimeoutMillis: idleTimeoutMs,
    keepAlive: keepAliveEnabled,
    keepAliveInitialDelayMillis: keepAliveInitialDelayMs,
    ...(maxUses > 0 ? { maxUses } : {}),
    allowExitOnIdle: true,
  })
  ;(pool as { __skipStatementTimeout?: boolean }).__skipStatementTimeout = disableStatementTimeout

  // Make pool.end idempotent to avoid double-close during shutdown handlers.
  let poolClosed = false
  const originalEnd = pool.end.bind(pool)
  pool.end = ((cb?: (err?: Error) => void) => {
    if (poolClosed) {
      if (cb) {
        cb()
      }
      return Promise.resolve()
    }
    poolClosed = true
    activePools.delete(pool)
    return originalEnd(cb as never)
  }) as typeof pool.end
  registerPoolForCleanup(pool)

  // Prevent unhandled pool errors from crashing long-running workers.
  pool.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error)
    const isTransient = message.includes('Connection terminated unexpectedly')
      || message.includes('terminating connection due to administrator command')
      || message.includes('Connection terminated by server')
    const payload = {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      transient: isTransient,
    }
    if (isTransient) {
      logger.warn('db_pool_error', payload)
    } else {
      logger.error('db_pool_error', payload)
    }
  })

  return pool
}

const poolCache = new Map<string, Pool>()

export const getPool = (connectionString?: string) => {
  const key = connectionString || config.db.url
  const existing = poolCache.get(key)
  if (existing) {
    return existing
  }
  const pool = createPool(key)
  poolCache.set(key, pool)

  const poolName =
    key === config.db.planeAUrl
      ? 'plane-a'
      : key === config.db.planeBUrl
        ? 'plane-b'
        : key === config.db.planeCUrl
          ? 'plane-c'
          : 'default'
  registerDatabasePool(pool, poolName)

  return pool
}

export const pool = getPool()

const startPoolMetricsUpdater = () => {
  const interval = setInterval(() => {
    try {
      for (const [name, p] of poolCache.entries()) {
        const poolName =
          name === config.db.planeAUrl
            ? 'plane-a'
            : name === config.db.planeBUrl
              ? 'plane-b'
              : name === config.db.planeCUrl
                ? 'plane-c'
                : 'default'
        const active = p.totalCount - p.idleCount
        updateConnectionPoolMetrics(poolName, active, p.idleCount)
      }
    } catch {
      // Silently ignore metrics errors
    }
  }, 10000)
  interval.unref?.()
}

startPoolMetricsUpdater()

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  poolInstance: Pool | PoolClient = pool,
  timeoutMs?: number,
) => {
  const startTime = Date.now()
  const queryTimeout = timeoutMs ?? (Number(process.env.DB_QUERY_TIMEOUT_MS) || 30000)

  try {
    // Set query timeout if pool client supports it
    const canConnect = typeof (poolInstance as Pool).connect === 'function'
    const isPoolClient = typeof (poolInstance as PoolClient).release === 'function'
    const isMockedQuery =
      typeof (poolInstance as Pool).query === 'function'
      && 'mock' in (poolInstance as Pool).query
    const shouldUseConnect = canConnect && !isMockedQuery && !isPoolClient
    const skipStatementTimeout =
      Boolean((poolInstance as { __skipStatementTimeout?: boolean }).__skipStatementTimeout)
      || process.env.DB_DISABLE_STATEMENT_TIMEOUT === '1'
    const queryConfig = { text, values: params, query_timeout: queryTimeout }
    if (shouldUseConnect) {
      const pool = poolInstance as Pool
      const client = await pool.connect()
      try {
        if (!skipStatementTimeout) {
          await client.query(`SET statement_timeout = ${queryTimeout}`)
        }
        const result = await client.query<T>(queryConfig)
        try {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordQueryFromSql(text, durationSeconds, 'success')
        } catch {
          // Silently ignore metrics errors
        }
        return result
      } finally {
        client.release()
      }
    } else {
      const result = isMockedQuery
        ? await poolInstance.query<T>(text, params)
        : await poolInstance.query<T>(queryConfig)
      try {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordQueryFromSql(text, durationSeconds, 'success')
      } catch {
        // Silently ignore metrics errors
      }
      return result
    }
  } catch (error) {
    try {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordQueryFromSql(text, durationSeconds, 'error')
    } catch {
      // Silently ignore metrics errors
    }
    throw error
  }
}
