import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from '../shared/metrics-registry'

const jobDurationSeconds = new Histogram({
  name: 'gold_publisher_job_duration_seconds',
  help: 'Gold publisher job execution duration in seconds.',
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
})

const corridorsPublishedTotal = new Counter({
  name: 'gold_publisher_job_corridors_published_total',
  help: 'Total corridors published by gold publisher job.',
  registers: [metricsRegistry],
})

const corridorsWithheldTotal = new Counter({
  name: 'gold_publisher_job_corridors_withheld_total',
  help: 'Total corridors withheld by gold publisher job.',
  registers: [metricsRegistry],
})

const jobFailuresTotal = new Counter({
  name: 'gold_publisher_job_failures_total',
  help: 'Total failures in gold publisher job.',
  labelNames: ['error_type'],
  registers: [metricsRegistry],
})

const lastSuccessTimestamp = new Gauge({
  name: 'gold_publisher_job_last_success_timestamp',
  help: 'Unix timestamp of last successful gold publisher job execution.',
  registers: [metricsRegistry],
})

const lastDurationSeconds = new Gauge({
  name: 'gold_publisher_job_last_duration_seconds',
  help: 'Duration in seconds of last gold publisher job execution.',
  registers: [metricsRegistry],
})

let jobStartTime: number | null = null

export const recordJobStart = (): void => {
  jobStartTime = Date.now()
}

export const recordJobComplete = (
  durationSeconds: number,
  published: number,
  withheld: number,
): void => {
  const resolvedDuration =
    jobStartTime !== null ? (Date.now() - jobStartTime) / 1000 : durationSeconds

  if (jobStartTime !== null) {
    jobDurationSeconds.observe(resolvedDuration)
    jobStartTime = null
  } else {
    jobDurationSeconds.observe(resolvedDuration)
  }

  corridorsPublishedTotal.inc(published)
  corridorsWithheldTotal.inc(withheld)
  lastSuccessTimestamp.set(Math.floor(Date.now() / 1000))
  lastDurationSeconds.set(resolvedDuration)
  recordCloudWatchMetric({
    name: 'gold_publisher_job_duration_seconds',
    value: resolvedDuration,
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_publisher_job_corridors_published_total',
    value: published,
    unit: 'Count',
  })
  recordCloudWatchMetric({
    name: 'gold_publisher_job_corridors_withheld_total',
    value: withheld,
    unit: 'Count',
  })
  recordCloudWatchMetric({
    name: 'gold_publisher_job_last_success_timestamp',
    value: Math.floor(Date.now() / 1000),
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_publisher_job_last_duration_seconds',
    value: resolvedDuration,
    unit: 'Seconds',
  })
}

export const recordJobFailure = (errorType: string): void => {
  if (jobStartTime !== null) {
    const actualDuration = (Date.now() - jobStartTime) / 1000
    jobDurationSeconds.observe(actualDuration)
    jobStartTime = null
  }

  jobFailuresTotal.inc({ error_type: errorType })
  recordCloudWatchMetric({
    name: 'gold_publisher_job_failures_total',
    value: 1,
    unit: 'Count',
    dimensions: { error_type: errorType },
  })
}

export { getMetrics, metricsContentType }

