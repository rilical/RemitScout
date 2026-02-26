import { Counter, Gauge, Histogram } from 'prom-client'

import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { getMetrics, metricsContentType, metricsRegistry } from '../shared/metrics-registry'

const jobDurationSeconds = new Histogram({
  name: 'gold_indices_job_duration_seconds',
  help: 'Gold indices job execution duration in seconds.',
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
})

const rowsUpsertedTotal = new Counter({
  name: 'gold_indices_job_rows_upserted_total',
  help: 'Total rows upserted by gold indices job.',
  registers: [metricsRegistry],
})

const jobFailuresTotal = new Counter({
  name: 'gold_indices_job_failures_total',
  help: 'Total failures in gold indices job.',
  labelNames: ['error_type'],
  registers: [metricsRegistry],
})

const lastSuccessTimestamp = new Gauge({
  name: 'gold_indices_job_last_success_timestamp',
  help: 'Unix timestamp of last successful gold indices job execution.',
  registers: [metricsRegistry],
})

const lastDurationSeconds = new Gauge({
  name: 'gold_indices_job_last_duration_seconds',
  help: 'Duration in seconds of last gold indices job execution.',
  registers: [metricsRegistry],
})

let jobStartTime: number | null = null
const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

export const recordJobStart = (): void => {
  jobStartTime = Date.now()
}

export const recordJobComplete = (durationSeconds: number, upserted: number): void => {
  const resolvedDuration =
    jobStartTime !== null ? (Date.now() - jobStartTime) / 1000 : durationSeconds

  if (jobStartTime !== null) {
    jobDurationSeconds.observe(resolvedDuration)
    jobStartTime = null
  } else {
    jobDurationSeconds.observe(resolvedDuration)
  }

  rowsUpsertedTotal.inc(upserted)
  lastSuccessTimestamp.set(Math.floor(Date.now() / 1000))
  lastDurationSeconds.set(resolvedDuration)

  recordCloudWatchMetric({
    name: 'gold_indices_job_duration_seconds',
    value: resolvedDuration,
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_indices_job_rows_upserted_total',
    value: upserted,
    unit: 'Count',
  })
  recordCloudWatchMetric({
    name: 'gold_indices_job_last_success_timestamp',
    value: Math.floor(Date.now() / 1000),
    unit: 'Seconds',
  })
  recordCloudWatchMetric({
    name: 'gold_indices_job_last_duration_seconds',
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
    name: 'gold_indices_job_failures_total',
    value: 1,
    unit: 'Count',
    dimensions: { error_type: errorType },
  })
}

export const recordIndicesAggregateMetrics = (metrics: {
  teerRate: number | null
  rciRatio: number | null
  rviBps: number | null
}): void => {
  const dimensions = { environment: environmentDimension }
  if (metrics.teerRate !== null && Number.isFinite(metrics.teerRate)) {
    recordCloudWatchMetric({
      name: 'indices_teer_rate',
      value: metrics.teerRate,
      dimensions,
    })
  }
  if (metrics.rciRatio !== null && Number.isFinite(metrics.rciRatio)) {
    recordCloudWatchMetric({
      name: 'indices_rci_ratio',
      value: metrics.rciRatio,
      dimensions,
    })
  }
  if (metrics.rviBps !== null && Number.isFinite(metrics.rviBps)) {
    recordCloudWatchMetric({
      name: 'indices_rvi_bps',
      value: metrics.rviBps,
      dimensions,
    })
  }
}

export { getMetrics, metricsContentType }
