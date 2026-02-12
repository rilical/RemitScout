import { Counter, Gauge } from 'prom-client'

import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from './metrics-registry'

const BUSINESS_NAMESPACE = 'RemitScout/Business'

export const recordBusinessMetric = (
  name: string,
  value: number,
  dimensions?: Record<string, string>,
  options?: { unit?: Parameters<typeof recordCloudWatchMetric>[0]['unit']; highCardinality?: boolean },
): void => {
  recordCloudWatchMetric({
    namespace: BUSINESS_NAMESPACE,
    name,
    value,
    unit: options?.unit,
    dimensions,
    highCardinality: options?.highCardinality,
  })
}

const quotesRequestedTotal = new Counter({
  name: 'quotes_requested_total',
  help: 'Total quote requests',
  labelNames: ['corridor_id', 'amount_bucket'],
  registers: [metricsRegistry],
})

const searchesTotal = new Counter({
  name: 'searches_total',
  help: 'Total searches',
  labelNames: ['from_country', 'to_country'],
  registers: [metricsRegistry],
})

const activeUsersCount = new Gauge({
  name: 'active_users_count',
  help: 'Number of active users',
  labelNames: ['time_window'],
  registers: [metricsRegistry],
})

export const recordQuoteRequest = (corridorId: string, amountBucket: number): void => {
  quotesRequestedTotal.inc({
    corridor_id: corridorId || 'unknown',
    amount_bucket: String(amountBucket),
  })
  recordBusinessMetric(
    'quotes_requested_total',
    1,
    { corridor_id: corridorId || 'unknown', amount_bucket: String(amountBucket) },
    { unit: 'Count', highCardinality: true },
  )
}

export const recordSearch = (fromCountry: string, toCountry: string): void => {
  searchesTotal.inc({
    from_country: fromCountry || 'unknown',
    to_country: toCountry || 'unknown',
  })
  recordBusinessMetric(
    'searches_total',
    1,
    { from_country: fromCountry || 'unknown', to_country: toCountry || 'unknown' },
    { unit: 'Count', highCardinality: true },
  )
}

export const updateActiveUsers = (
  timeWindow: '1h' | '24h' | '7d',
  count: number,
): void => {
  activeUsersCount.set({ time_window: timeWindow }, count)
  recordBusinessMetric(
    'active_users_count',
    count,
    { time_window: timeWindow },
    { unit: 'Count' },
  )
}

export { getMetrics, metricsContentType }
