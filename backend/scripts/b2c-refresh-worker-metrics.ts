import { Counter, Gauge, Histogram, Registry } from 'prom-client'

const register = new Registry()

const requestsTotal = new Counter({
  name: 'b2c_refresh_requests_total',
  help: 'Total B2C refresh requests processed.',
  labelNames: ['provider_id', 'status'],
  registers: [register],
})

const requestsCompleted = new Counter({
  name: 'b2c_refresh_requests_completed',
  help: 'Total B2C refresh requests completed successfully.',
  labelNames: ['provider_id'],
  registers: [register],
})

const requestsFailed = new Counter({
  name: 'b2c_refresh_requests_failed',
  help: 'Total B2C refresh requests failed.',
  labelNames: ['provider_id'],
  registers: [register],
})

const requestsBlocked = new Counter({
  name: 'b2c_refresh_requests_blocked',
  help: 'Total B2C refresh requests blocked by provider.',
  labelNames: ['provider_id'],
  registers: [register],
})

const requestsSkipped = new Counter({
  name: 'b2c_refresh_requests_skipped',
  help: 'Total B2C refresh requests skipped.',
  labelNames: ['provider_id', 'reason'],
  registers: [register],
})

const durationSeconds = new Histogram({
  name: 'b2c_refresh_duration_seconds',
  help: 'B2C refresh request processing duration in seconds.',
  labelNames: ['provider_id', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
})

const queueDepth = new Gauge({
  name: 'b2c_refresh_queue_depth',
  help: 'Current pending queue depth.',
  labelNames: ['status'],
  registers: [register],
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

  switch (event.status) {
    case 'completed':
      requestsCompleted.inc({ provider_id: providerId })
      break
    case 'failed':
      requestsFailed.inc({ provider_id: providerId })
      break
    case 'blocked':
      requestsBlocked.inc({ provider_id: providerId })
      break
    case 'skipped':
      requestsSkipped.inc({
        provider_id: providerId,
        reason: event.skipReason ?? 'unknown',
      })
      break
    default:
      break
  }
}

export const updateQueueDepth = (depth: number) => {
  queueDepth.set({ status: 'pending' }, depth)
}

export const getMetrics = async () => register.metrics()
export const metricsContentType = register.contentType
