import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from '../shared/metrics-registry'

const jobDurationSeconds = new Histogram({
  name: 'gold_fx_rates_job_duration_seconds',
  help: 'Gold FX rates job execution duration in seconds.',
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
})

const ratesProcessedTotal = new Counter({
  name: 'gold_fx_rates_job_rates_processed_total',
  help: 'Total rates processed by gold FX rates job.',
  labelNames: ['status'],
  registers: [metricsRegistry],
})

const ratesUpsertedTotal = new Counter({
  name: 'gold_fx_rates_job_rates_upserted_total',
  help: 'Total rates upserted by gold FX rates job.',
  registers: [metricsRegistry],
})

const jobFailuresTotal = new Counter({
  name: 'gold_fx_rates_job_failures_total',
  help: 'Total failures in gold FX rates job.',
  labelNames: ['error_type'],
  registers: [metricsRegistry],
})

const lastSuccessTimestamp = new Gauge({
  name: 'gold_fx_rates_job_last_success_timestamp',
  help: 'Unix timestamp of last successful gold FX rates job execution.',
  registers: [metricsRegistry],
})

const lastDurationSeconds = new Gauge({
  name: 'gold_fx_rates_job_last_duration_seconds',
  help: 'Duration in seconds of last gold FX rates job execution.',
  registers: [metricsRegistry],
})

let jobStartTime: number | null = null

export const recordJobStart = (): void => {
  jobStartTime = Date.now()
}

export const recordJobComplete = (
  durationSeconds: number,
  ratesProcessed: number,
  ratesUpserted: number,
): void => {
  const resolvedDuration =
    jobStartTime !== null ? (Date.now() - jobStartTime) / 1000 : durationSeconds

  if (jobStartTime !== null) {
    jobDurationSeconds.observe(resolvedDuration)
    jobStartTime = null
  } else {
    jobDurationSeconds.observe(resolvedDuration)
  }

  ratesProcessedTotal.inc({ status: 'success' }, ratesProcessed)
  ratesUpsertedTotal.inc(ratesUpserted)
  lastSuccessTimestamp.set(Math.floor(Date.now() / 1000))
  lastDurationSeconds.set(resolvedDuration)

  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_duration_seconds',
    value: resolvedDuration,
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_rates_processed_total',
    value: ratesProcessed,
    unit: 'Count',
    dimensions: { status: 'success' },
  })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_rates_upserted_total',
    value: ratesUpserted,
    unit: 'Count',
  })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_last_success_timestamp',
    value: Math.floor(Date.now() / 1000),
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_last_duration_seconds',
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
  ratesProcessedTotal.inc({ status: 'failed' })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_failures_total',
    value: 1,
    unit: 'Count',
    dimensions: { error_type: errorType },
  })
  recordCloudWatchMetric({
    name: 'gold_fx_rates_job_rates_processed_total',
    value: 1,
    unit: 'Count',
    dimensions: { status: 'failed' },
  })
}

export { getMetrics, metricsContentType }



