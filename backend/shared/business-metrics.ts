import { Counter, Gauge } from 'prom-client'

import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from './metrics-registry'

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
  recordCloudWatchMetric({
    name: 'quotes_requested_total',
    value: 1,
    unit: 'Count',
    dimensions: {
      corridor_id: corridorId || 'unknown',
      amount_bucket: String(amountBucket),
    },
    highCardinality: true,
  })
}

export const recordSearch = (fromCountry: string, toCountry: string): void => {
  searchesTotal.inc({
    from_country: fromCountry || 'unknown',
    to_country: toCountry || 'unknown',
  })
  recordCloudWatchMetric({
    name: 'searches_total',
    value: 1,
    unit: 'Count',
    dimensions: {
      from_country: fromCountry || 'unknown',
      to_country: toCountry || 'unknown',
    },
    highCardinality: true,
  })
}

export const updateActiveUsers = (
  timeWindow: '1h' | '24h' | '7d',
  count: number,
): void => {
  activeUsersCount.set({ time_window: timeWindow }, count)
  recordCloudWatchMetric({
    name: 'active_users_count',
    value: count,
    unit: 'Count',
    dimensions: { time_window: timeWindow },
  })
}

export { getMetrics, metricsContentType }
