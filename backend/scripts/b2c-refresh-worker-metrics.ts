import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from '../shared/metrics-registry'

const requestsTotal = new Counter({
  name: 'b2c_refresh_requests_total',
  help: 'Total B2C refresh requests processed.',
  labelNames: ['provider_id', 'status'],
  registers: [metricsRegistry],
})

const requestsCompleted = new Counter({
  name: 'b2c_refresh_requests_completed',
  help: 'Total B2C refresh requests completed successfully.',
  labelNames: ['provider_id'],
  registers: [metricsRegistry],
})

const requestsFailed = new Counter({
  name: 'b2c_refresh_requests_failed',
  help: 'Total B2C refresh requests failed.',
  labelNames: ['provider_id'],
  registers: [metricsRegistry],
})

const requestsBlocked = new Counter({
  name: 'b2c_refresh_requests_blocked',
  help: 'Total B2C refresh requests blocked by provider.',
  labelNames: ['provider_id'],
  registers: [metricsRegistry],
})

const requestsSkipped = new Counter({
  name: 'b2c_refresh_requests_skipped',
  help: 'Total B2C refresh requests skipped.',
  labelNames: ['provider_id', 'reason'],
  registers: [metricsRegistry],
})

const durationSeconds = new Histogram({
  name: 'b2c_refresh_duration_seconds',
  help: 'B2C refresh request processing duration in seconds.',
  labelNames: ['provider_id', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [metricsRegistry],
})

const queueDepth = new Gauge({
  name: 'b2c_refresh_queue_depth',
  help: 'Current pending queue depth.',
  labelNames: ['status'],
  registers: [metricsRegistry],
})

export type B2cRefreshRequestMetric = {
  providerId: string
  status: string
  durationSeconds: number
  skipReason?: string | null
}

export const recordRequest = (event: B2cRefreshRequestMetric) => {
  const providerId = event.providerId || 'unknown'
  requestsTotal.inc({ provider_id: providerId, status: event.status })
  durationSeconds.observe({ provider_id: providerId, status: event.status }, event.durationSeconds)
  recordCloudWatchMetric({
    name: 'b2c_refresh_requests_total',
    value: 1,
    unit: 'Count',
    dimensions: { status: event.status },
  })
  recordCloudWatchMetric({
    name: 'b2c_refresh_duration_seconds',
    value: event.durationSeconds,
    unit: 'Seconds',
    dimensions: { status: event.status },
  })

  switch (event.status) {
    case 'completed':
      requestsCompleted.inc({ provider_id: providerId })
      recordCloudWatchMetric({
        name: 'b2c_refresh_requests_completed',
        value: 1,
        unit: 'Count',
        dimensions: { status: 'completed' },
      })
      break
    case 'failed':
      requestsFailed.inc({ provider_id: providerId })
      recordCloudWatchMetric({
        name: 'b2c_refresh_requests_failed',
        value: 1,
        unit: 'Count',
        dimensions: { status: 'failed' },
      })
      break
    case 'blocked':
      requestsBlocked.inc({ provider_id: providerId })
      recordCloudWatchMetric({
        name: 'b2c_refresh_requests_blocked',
        value: 1,
        unit: 'Count',
        dimensions: { status: 'blocked' },
      })
      break
    case 'skipped':
      requestsSkipped.inc({
        provider_id: providerId,
        reason: event.skipReason ?? 'unknown',
      })
      recordCloudWatchMetric({
        name: 'b2c_refresh_requests_skipped',
        value: 1,
        unit: 'Count',
        dimensions: { status: 'skipped' },
      })
      break
    default:
      break
  }
}

export const updateQueueDepth = (depth: number) => {
  queueDepth.set({ status: 'pending' }, depth)
  recordCloudWatchMetric({
    name: 'b2c_refresh_queue_depth',
    value: depth,
    unit: 'Count',
    dimensions: { status: 'pending' },
  })
}

export { getMetrics, metricsContentType }
