import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { config } from './config'
import { recordQueryFromSql, updateConnectionPoolMetrics } from './db-metrics'
import { registerDatabasePool } from './connection-manager'
import { createLogger } from './logger'

const logger = createLogger('shared.db')
const activePools = new Set<Pool>()
let cleanupHandlersRegistered = false

const runtimeConfig = {
  isLambda: config.runtime?.isLambda ?? false,
  isEcs: config.runtime?.isEcs ?? false,
}

const dbPoolConfig = {
  applicationName: config.dbPool?.applicationName,
  connectionTimeoutMs: config.dbPool?.connectionTimeoutMs ?? 10_000,
  disablePoolSignalCleanup: config.dbPool?.disablePoolSignalCleanup ?? false,
  disableStatementTimeoutExplicit: config.dbPool?.disableStatementTimeoutExplicit ?? false,
  idleTimeoutMs: config.dbPool?.idleTimeoutMs ?? 30_000,
  keepAliveEnabled: config.dbPool?.keepAliveEnabled ?? true,
  keepAliveInitialDelayMs: config.dbPool?.keepAliveInitialDelayMs ?? 0,
  maxOverride: config.dbPool?.maxOverride,
  maxUses: config.dbPool?.maxUses ?? 0,
  minOverride: config.dbPool?.minOverride,
  proxyQueryTimeoutMs: config.dbPool?.proxyQueryTimeoutMs ?? 30_000,
  queryTimeoutEnabled: config.dbPool?.queryTimeoutEnabled ?? true,
  queryTimeoutMs: config.dbPool?.queryTimeoutMs ?? 30_000,
  sslMode: config.dbPool?.sslMode,
}

const appEnv = config.env ?? 'dev'

const isProxyConnectionString = (connectionString: string): boolean => {
  if (!connectionString) return false
  try {
    const host = new URL(connectionString).hostname
    return host.includes('.proxy-') || host.includes('proxy-')
  } catch (error) {
    logger.debug('db_proxy_connection_string_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return connectionString.includes('.proxy-') || connectionString.includes('proxy-')
  }
}

const isTransactionControlStatement = (sql: string): boolean =>
  /^\s*(begin|start\s+transaction|commit|rollback|savepoint|release|set\s+transaction)\b/i
    .test(sql)

export type ConnectionRoute = 'direct' | 'proxy'
export type StatementTimeoutPolicy =
  | 'server-statement-timeout'
  | 'proxy-guarded'
  | 'disabled'

type PoolPolicyMetadata = {
  connectionRoute: ConnectionRoute
  statementTimeoutPolicy: StatementTimeoutPolicy
}

type PoolWithPolicy = Pool & {
  __skipStatementTimeout?: boolean
  __validateConnectionOnCheckout?: boolean
  __connectionRoute?: ConnectionRoute
  __statementTimeoutPolicy?: StatementTimeoutPolicy
}

const registerPoolForCleanup = (pool: Pool) => {
  activePools.add(pool)
  if (cleanupHandlersRegistered) {
    return
  }
  cleanupHandlersRegistered = true

  const cleanup = () => {
    for (const activePool of activePools) {
      activePool.end().catch((error) => {
        logger.debug('pool_cleanup_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    activePools.clear()
  }

  // Signal-driven shutdown is owned by shared/shutdown.ts so workers can
  // finish in-flight work before connection teardown.
  process.once('beforeExit', () => {
    void cleanup()
  })
}

/**
 * Gets pool size limits based on runtime environment.
 */
const getPoolSizeLimits = (): { max: number; min: number } => {
  const isLambda = runtimeConfig.isLambda
  const isECS = runtimeConfig.isEcs

  const defaultLimits = (() => {
    if (isLambda) {
      return { max: 20, min: 1 }
    }
    if (isECS) {
      return appEnv === 'production' ? { max: 50, min: 2 } : { max: 8, min: 1 }
    }
    return { max: 10, min: 1 }
  })()

  const resolveOverride = (value: string | undefined): number | null => {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return null
    return Math.max(0, Math.floor(parsed))
  }

  const envMax = Number.isFinite(dbPoolConfig.maxOverride)
    ? resolveOverride(String(dbPoolConfig.maxOverride))
    : null
  const envMin = Number.isFinite(dbPoolConfig.minOverride)
    ? resolveOverride(String(dbPoolConfig.minOverride))
    : null

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
  } catch (error) {
    logger.debug('db_connection_string_normalize_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return connectionString
  }
}

export const createPool = (connectionString?: string) => {
  const sslMode = dbPoolConfig.sslMode
  const sslEnabled = sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'verify-ca'
  const queryTimeoutEnabled = dbPoolConfig.queryTimeoutEnabled
  const queryTimeoutMs = dbPoolConfig.queryTimeoutMs
  const connectionTimeoutMs = dbPoolConfig.connectionTimeoutMs
  const idleTimeoutMs = dbPoolConfig.idleTimeoutMs
  const keepAliveEnabled = dbPoolConfig.keepAliveEnabled
  const keepAliveInitialDelayMs = dbPoolConfig.keepAliveInitialDelayMs
  const maxUses = dbPoolConfig.maxUses
  const isProduction = appEnv === 'production'
  const poolLimits = getPoolSizeLimits()
  const resolvedConnectionString = connectionString || config.db.url
  const normalizedConnectionString = normalizeConnectionStringForSslMode(
    resolvedConnectionString,
    sslMode,
  )
  const applicationName = dbPoolConfig.applicationName?.trim()
  const connectionStringWithAppName = (() => {
    if (!normalizedConnectionString || !applicationName) return normalizedConnectionString
    if (normalizedConnectionString.includes('application_name=')) return normalizedConnectionString
    try {
      const parsed = new URL(normalizedConnectionString)
      parsed.searchParams.set('application_name', applicationName)
      return parsed.toString()
    } catch {
      const delimiter = normalizedConnectionString.includes('?') ? '&' : '?'
      return `${normalizedConnectionString}${delimiter}application_name=${encodeURIComponent(applicationName)}`
    }
  })()
  const connectionRoute: ConnectionRoute = isProxyConnectionString(connectionStringWithAppName)
    ? 'proxy'
    : 'direct'
  const disableStatementTimeout = (() => {
    if (dbPoolConfig.disableStatementTimeoutExplicit) return true
    return connectionRoute === 'proxy'
  })()
  const validateConnectionOnCheckout = connectionRoute === 'proxy'
  const statementTimeoutPolicy: StatementTimeoutPolicy = (() => {
    if (dbPoolConfig.disableStatementTimeoutExplicit) return 'disabled'
    if (connectionRoute === 'proxy') return 'proxy-guarded'
    return 'server-statement-timeout'
  })()

  // Safety: if someone disables statement_timeout explicitly in production, make it visible in logs.
  if (dbPoolConfig.disableStatementTimeoutExplicit && appEnv === 'production') {
    logger.warn('db_statement_timeout_disabled', {
      env: appEnv,
      reason: 'DB_DISABLE_STATEMENT_TIMEOUT=1',
    })
  }

  // SSL configuration: verify certificates in production
  const sslConfig = sslEnabled
    ? {
        rejectUnauthorized: isProduction && (sslMode === 'verify-full' || sslMode === 'verify-ca'),
      }
    : undefined

  const pool = new Pool({
    connectionString: connectionStringWithAppName,
    ssl: sslConfig,
    ...(disableStatementTimeout ? {} : { statement_timeout: queryTimeoutMs }),
    ...(queryTimeoutEnabled ? { query_timeout: queryTimeoutMs } : {}),
    connectionTimeoutMillis: connectionTimeoutMs,
    max: poolLimits.max,
    min: poolLimits.min,
    idleTimeoutMillis: idleTimeoutMs,
    keepAlive: keepAliveEnabled,
    keepAliveInitialDelayMillis: keepAliveInitialDelayMs,
    ...(maxUses > 0 ? { maxUses } : {}),
    allowExitOnIdle: true,
  })
  const poolWithPolicy = pool as PoolWithPolicy
  poolWithPolicy.__skipStatementTimeout = disableStatementTimeout
  poolWithPolicy.__validateConnectionOnCheckout =
    validateConnectionOnCheckout
  poolWithPolicy.__connectionRoute = connectionRoute
  poolWithPolicy.__statementTimeoutPolicy = statementTimeoutPolicy

  const poolPolicyMetadata: PoolPolicyMetadata = {
    connectionRoute,
    statementTimeoutPolicy,
  }
  logger.info('db_pool_policy_configured', {
    connectionRoute: poolPolicyMetadata.connectionRoute,
    statementTimeoutPolicy: poolPolicyMetadata.statementTimeoutPolicy,
    queryTimeoutEnabled,
    queryTimeoutMs,
    disableStatementTimeout,
  })

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
        const total = p.totalCount
        const idle = p.idleCount
        const waiting = p.waitingCount
        const active = total - idle
        updateConnectionPoolMetrics(poolName, total, active, idle, waiting)
      }
    } catch (error) {
      logger.debug('db_pool_metrics_update_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, 30000)
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

  try {
    // Set query timeout if pool client supports it
    const canConnect = typeof (poolInstance as Pool).connect === 'function'
    const isPoolClient = typeof (poolInstance as PoolClient).release === 'function'
    const isMockedQuery =
      typeof (poolInstance as Pool).query === 'function'
      && 'mock' in (poolInstance as Pool).query
    const shouldUseConnect = canConnect && !isMockedQuery && !isPoolClient
    const skipStatementTimeout =
      Boolean((poolInstance as PoolWithPolicy).__skipStatementTimeout)
      || dbPoolConfig.disableStatementTimeoutExplicit
    const connectionRoute = (poolInstance as PoolWithPolicy).__connectionRoute ?? 'direct'
    const statementTimeoutPolicy =
      (poolInstance as PoolWithPolicy).__statementTimeoutPolicy
      ?? (skipStatementTimeout ? 'disabled' : 'server-statement-timeout')
    const shouldSetSessionStatementTimeout =
      dbPoolConfig.queryTimeoutEnabled && statementTimeoutPolicy !== 'disabled'
    const queryTimeoutDefault = skipStatementTimeout
      ? dbPoolConfig.proxyQueryTimeoutMs
      : dbPoolConfig.queryTimeoutMs
    const queryTimeout = Math.max(
      1,
      Math.floor(timeoutMs ?? queryTimeoutDefault ?? dbPoolConfig.queryTimeoutMs),
    )
    const queryConfig: { text: string; values: unknown[]; query_timeout?: number } = {
      text,
      values: params,
    }
    if (dbPoolConfig.queryTimeoutEnabled) {
      queryConfig.query_timeout = queryTimeout
    }
    if (shouldUseConnect) {
      const pool = poolInstance as Pool
      const client = await pool.connect()
      try {
        if (Boolean((pool as { __validateConnectionOnCheckout?: boolean }).__validateConnectionOnCheckout)) {
          // RDS Proxy can hand out stale connections after rotation; validate before running workload.
          await client.query('SELECT 1')
        }
        const shouldApplyProxyTimeoutGuard =
          connectionRoute === 'proxy'
          && shouldSetSessionStatementTimeout
          && !isTransactionControlStatement(text)

        if (shouldSetSessionStatementTimeout) {
          await client.query(`SET statement_timeout = ${queryTimeout}`)
        }

        let result: QueryResult<T>
        if (shouldApplyProxyTimeoutGuard) {
          let transactionOpened = false
          try {
            await client.query('BEGIN')
            transactionOpened = true
            await client.query(`SET LOCAL statement_timeout = ${queryTimeout}`)
            result = await client.query<T>(queryConfig)
            await client.query('COMMIT')
          } catch (proxyError) {
            if (transactionOpened) {
              try {
                await client.query('ROLLBACK')
              } catch (rollbackError) {
                logger.warn('db_proxy_timeout_guard_rollback_failed', {
                  error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
                })
              }
            }
            const message = proxyError instanceof Error ? proxyError.message : String(proxyError)
            if (/statement timeout|query read timeout|query_timeout|canceling statement/i.test(message)) {
              logger.warn('db_proxy_query_timeout', {
                timeoutMs: queryTimeout,
                error: message,
              })
            }
            throw proxyError
          }
        } else {
          result = await client.query<T>(queryConfig)
        }

        try {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordQueryFromSql(text, durationSeconds, 'success')
        } catch (metricError) {
          logger.debug('db_query_metrics_record_failed', {
            status: 'success',
            error: metricError instanceof Error ? metricError.message : String(metricError),
          })
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
      } catch (metricError) {
        logger.debug('db_query_metrics_record_failed', {
          status: 'success',
          error: metricError instanceof Error ? metricError.message : String(metricError),
        })
      }
      return result
    }
  } catch (error) {
    try {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordQueryFromSql(text, durationSeconds, 'error')
    } catch (metricError) {
      logger.debug('db_query_metrics_record_failed', {
        status: 'error',
        error: metricError instanceof Error ? metricError.message : String(metricError),
      })
    }
    throw error
  }
}

export const queryWithTimeout = async <T extends QueryResultRow = QueryResultRow>(
  poolInstance: Pool,
  text: string,
  params: unknown[] = [],
  timeoutMs: number,
) => {
  const client = await poolInstance.connect()
  const safeTimeoutMs = Math.max(1, Math.floor(timeoutMs))
  try {
    await client.query('BEGIN')
    await client.query(`SET LOCAL statement_timeout = ${safeTimeoutMs}`)
    const result = await query<T>(text, params, client, safeTimeoutMs)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      logger.warn('query_with_timeout_rollback_failed', {
        error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
      })
    }
    throw error
  } finally {
    client.release()
  }
}
