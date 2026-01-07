import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from './metrics-registry'

const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds.',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
})

const dbConnectionPoolActive = new Gauge({
  name: 'db_connection_pool_active',
  help: 'Active database connections.',
  labelNames: ['pool_name'],
  registers: [metricsRegistry],
})

const dbConnectionPoolIdle = new Gauge({
  name: 'db_connection_pool_idle',
  help: 'Idle database connections.',
  labelNames: ['pool_name'],
  registers: [metricsRegistry],
})

const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total database queries.',
  labelNames: ['operation', 'table', 'status'],
  registers: [metricsRegistry],
})

const parseQuerySignature = (sql: string) => {
  const normalized = sql.trim().replace(/\s+/g, ' ')
  const operation = normalized.split(' ')[0]?.toUpperCase() || 'OTHER'
  let table = 'unknown'

  if (operation === 'SELECT' || operation === 'DELETE') {
    const match = normalized.match(/\bFROM\s+([^\s,]+)/i)
    table = match?.[1]?.replace(/["']/g, '') ?? table
  } else if (operation === 'INSERT') {
    const match = normalized.match(/\bINTO\s+([^\s(]+)/i)
    table = match?.[1]?.replace(/["']/g, '') ?? table
  } else if (operation === 'UPDATE') {
    const match = normalized.match(/\bUPDATE\s+([^\s]+)/i)
    table = match?.[1]?.replace(/["']/g, '') ?? table
  }

  return { operation, table }
}

export const recordQueryFromSql = (
  sql: string,
  durationSeconds: number,
  status: 'success' | 'error',
) => {
  const { operation, table } = parseQuerySignature(sql)
  dbQueryDurationSeconds.observe({ operation, table }, durationSeconds)
  dbQueriesTotal.inc({ operation, table, status })
  recordCloudWatchMetric({
    name: 'db_query_duration_seconds',
    value: durationSeconds,
    unit: 'Seconds',
    dimensions: { operation, table },
  })
  recordCloudWatchMetric({
    name: 'db_queries_total',
    value: 1,
    unit: 'Count',
    dimensions: { operation, table, status },
  })
}

export const updateConnectionPoolMetrics = (
  poolName: string,
  active: number,
  idle: number,
) => {
  dbConnectionPoolActive.set({ pool_name: poolName }, active)
  dbConnectionPoolIdle.set({ pool_name: poolName }, idle)
  recordCloudWatchMetric({
    name: 'db_connection_pool_active',
    value: active,
    unit: 'Count',
    dimensions: { pool_name: poolName },
  })
  recordCloudWatchMetric({
    name: 'db_connection_pool_idle',
    value: idle,
    unit: 'Count',
    dimensions: { pool_name: poolName },
  })
}

export { getMetrics, metricsContentType }


