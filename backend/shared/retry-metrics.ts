import { Counter, Histogram } from 'prom-client'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { metricsRegistry } from './metrics-registry'

const retryAttempts = new Counter({
  name: 'retry_attempts_total',
  help: 'Total retry attempts.',
  labelNames: ['operation', 'success'],
  registers: [metricsRegistry],
})

const retryFailures = new Counter({
  name: 'retry_failures_total',
  help: 'Total retry failures (exhausted retries).',
  labelNames: ['operation'],
  registers: [metricsRegistry],
})

const retryTotalDelay = new Histogram({
  name: 'retry_total_delay_seconds',
  help: 'Total delay time for retries in seconds.',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [metricsRegistry],
})

export const trackRetryAttempt = (operation: string, success: boolean): void => {
  retryAttempts.inc({ operation, success: success ? 'true' : 'false' })
  recordCloudWatchMetric({
    name: 'retry_attempts',
    value: 1,
    unit: 'Count',
    dimensions: { operation, success: success ? 'true' : 'false' },
  })
}

export const trackRetryFailure = (operation: string): void => {
  retryFailures.inc({ operation })
  recordCloudWatchMetric({
    name: 'retry_failures',
    value: 1,
    unit: 'Count',
    dimensions: { operation },
  })
}

export const trackRetryDelay = (operation: string, delaySeconds: number): void => {
  retryTotalDelay.observe({ operation }, delaySeconds)
  recordCloudWatchMetric({
    name: 'retry_total_delay',
    value: delaySeconds,
    unit: 'Seconds',
    dimensions: { operation },
  })
}

