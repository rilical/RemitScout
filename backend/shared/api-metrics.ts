import { Counter, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from './metrics-registry'

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
})

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
})

export const recordRequest = (
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number,
) => {
  const status = String(statusCode)
  httpRequestsTotal.inc({ method, route, status_code: status })
  httpRequestDurationSeconds.observe({ method, route, status_code: status }, durationSeconds)
  recordCloudWatchMetric({
    name: 'http_requests_total',
    value: 1,
    unit: 'Count',
    dimensions: { method, route, status_code: status },
  })
  recordCloudWatchMetric({
    name: 'http_request_duration_seconds',
    value: durationSeconds,
    unit: 'Seconds',
    dimensions: { method, route, status_code: status },
  })
}

export { getMetrics, metricsContentType }

