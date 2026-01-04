import { Counter } from 'prom-client'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { metricsRegistry } from './metrics-registry'

const redisConnectionAttempts = new Counter({
  name: 'redis_connection_attempts_total',
  help: 'Total Redis connection attempts.',
  labelNames: ['status'],
  registers: [metricsRegistry],
})

const redisConnectionFailures = new Counter({
  name: 'redis_connection_failures_total',
  help: 'Total Redis connection failures.',
  registers: [metricsRegistry],
})

const redisReconnections = new Counter({
  name: 'redis_reconnections_total',
  help: 'Total Redis reconnections.',
  registers: [metricsRegistry],
})

export const trackConnectionAttempt = (success: boolean): void => {
  redisConnectionAttempts.inc({ status: success ? 'success' : 'failure' })
  recordCloudWatchMetric({
    name: 'redis_connection_attempts',
    value: 1,
    unit: 'Count',
    dimensions: { status: success ? 'success' : 'failure' },
  })
}

export const trackConnectionFailure = (): void => {
  redisConnectionFailures.inc()
  recordCloudWatchMetric({
    name: 'redis_connection_failures',
    value: 1,
    unit: 'Count',
  })
}

export const trackReconnection = (): void => {
  redisReconnections.inc()
  recordCloudWatchMetric({
    name: 'redis_reconnections',
    value: 1,
    unit: 'Count',
  })
}

