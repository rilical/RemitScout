import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from '../shared/metrics-registry'

const jobDurationSeconds = new Histogram({
  name: 'gold_pulse_cache_job_duration_seconds',
  help: 'Gold pulse cache job execution duration in seconds.',
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
})

const entriesProcessedTotal = new Counter({
  name: 'gold_pulse_cache_job_entries_processed_total',
  help: 'Total entries processed by gold pulse cache job.',
  labelNames: ['status'],
  registers: [metricsRegistry],
})

const entriesUpsertedTotal = new Counter({
  name: 'gold_pulse_cache_job_entries_upserted_total',
  help: 'Total entries upserted by gold pulse cache job.',
  registers: [metricsRegistry],
})

const jobFailuresTotal = new Counter({
  name: 'gold_pulse_cache_job_failures_total',
  help: 'Total failures in gold pulse cache job.',
  labelNames: ['error_type'],
  registers: [metricsRegistry],
})

const lastSuccessTimestamp = new Gauge({
  name: 'gold_pulse_cache_job_last_success_timestamp',
  help: 'Unix timestamp of last successful gold pulse cache job execution.',
  registers: [metricsRegistry],
})

const lastDurationSeconds = new Gauge({
  name: 'gold_pulse_cache_job_last_duration_seconds',
  help: 'Duration in seconds of last gold pulse cache job execution.',
  registers: [metricsRegistry],
})

let jobStartTime: number | null = null

export const recordJobStart = (): void => {
  jobStartTime = Date.now()
}

export const recordJobComplete = (
  durationSeconds: number,
  entriesProcessed: number,
  entriesUpserted: number,
): void => {
  const resolvedDuration =
    jobStartTime !== null ? (Date.now() - jobStartTime) / 1000 : durationSeconds

  if (jobStartTime !== null) {
    jobDurationSeconds.observe(resolvedDuration)
    jobStartTime = null
  } else {
    jobDurationSeconds.observe(resolvedDuration)
  }

  entriesProcessedTotal.inc({ status: 'success' }, entriesProcessed)
  entriesUpsertedTotal.inc(entriesUpserted)
  lastSuccessTimestamp.set(Math.floor(Date.now() / 1000))
  lastDurationSeconds.set(resolvedDuration)

  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_duration_seconds',
    value: resolvedDuration,
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_entries_processed_total',
    value: entriesProcessed,
    unit: 'Count',
    dimensions: { status: 'success' },
  })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_entries_upserted_total',
    value: entriesUpserted,
    unit: 'Count',
  })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_last_success_timestamp',
    value: Math.floor(Date.now() / 1000),
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_last_duration_seconds',
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
  entriesProcessedTotal.inc({ status: 'failed' })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_failures_total',
    value: 1,
    unit: 'Count',
    dimensions: { error_type: errorType },
  })
  recordCloudWatchMetric({
    name: 'gold_pulse_cache_job_entries_processed_total',
    value: 1,
    unit: 'Count',
    dimensions: { status: 'failed' },
  })
}

export { getMetrics, metricsContentType }

