import { Counter, Gauge, Histogram } from 'prom-client'

import {
  metricsRegistry,
  getMetrics,
  metricsContentType,
} from '../../../shared/metrics-registry'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'

const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

const getOrCreateCounter = (
  name: string,
  help: string,
  labelNames: string[],
) => {
  const existing = metricsRegistry.getSingleMetric(name)
  if (existing) {
    return existing as Counter<string>
  }
  return new Counter({
    name,
    help,
    labelNames,
    registers: [metricsRegistry],
  })
}

const getOrCreateHistogram = (
  name: string,
  help: string,
  labelNames: string[],
  buckets: number[],
) => {
  const existing = metricsRegistry.getSingleMetric(name)
  if (existing) {
    return existing as Histogram<string>
  }
  return new Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [metricsRegistry],
  })
}

const getOrCreateGauge = (
  name: string,
  help: string,
  labelNames: string[],
) => {
  const existing = metricsRegistry.getSingleMetric(name)
  if (existing) {
    return existing as Gauge<string>
  }
  return new Gauge({
    name,
    help,
    labelNames,
    registers: [metricsRegistry],
  })
}

const providerCollectionSuccessTotal = getOrCreateCounter(
  'provider_collection_success_total',
  'Successful provider collections.',
  ['provider_id', 'corridor_id'],
)

const providerCollectionFailureTotal = getOrCreateCounter(
  'provider_collection_failure_total',
  'Failed provider collections.',
  ['provider_id', 'corridor_id', 'error_type'],
)

const providerCollectionDurationSeconds = getOrCreateHistogram(
  'provider_collection_duration_seconds',
  'Provider collection duration.',
  ['provider_id', 'corridor_id'],
  [0.5, 1, 2, 5, 10, 30, 60],
)

const circuitBreakerState = getOrCreateGauge(
  'circuit_breaker_state',
  'Circuit breaker state (0=closed, 1=open, 2=half_open).',
  ['provider_id', 'corridor_id'],
)

const normalizeCorridorId = (corridorId?: string | null) => corridorId ?? 'global'

export const recordCollection = (
  providerId: string,
  corridorId: string,
  success: boolean,
  durationSeconds?: number | null,
  errorType?: string,
) => {
  const provider = providerId || 'unknown'
  const corridor = normalizeCorridorId(corridorId)
  if (success) {
    providerCollectionSuccessTotal.inc({ provider_id: provider, corridor_id: corridor })
    recordCloudWatchMetric({
      name: 'provider_collection_success_total',
      value: 1,
      unit: 'Count',
      dimensions: { provider_id: provider, corridor_id: corridor },
      highCardinality: true,
    })
    recordCloudWatchMetric({
      name: 'provider_collection_success_by_provider_total',
      value: 1,
      unit: 'Count',
      dimensions: {
        provider_id: provider,
        environment: environmentDimension,
      },
      highCardinality: true,
    })
  } else {
    providerCollectionFailureTotal.inc({
      provider_id: provider,
      corridor_id: corridor,
      error_type: errorType || 'unknown',
    })
    recordCloudWatchMetric({
      name: 'provider_collection_failure_total',
      value: 1,
      unit: 'Count',
      dimensions: {
        provider_id: provider,
        corridor_id: corridor,
        error_type: errorType || 'unknown',
      },
      highCardinality: true,
    })
    recordCloudWatchMetric({
      name: 'provider_collection_failure_by_provider_total',
      value: 1,
      unit: 'Count',
      dimensions: {
        provider_id: provider,
        environment: environmentDimension,
      },
      highCardinality: true,
    })
  }

  if (typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds >= 0) {
    providerCollectionDurationSeconds.observe({ provider_id: provider, corridor_id: corridor }, durationSeconds)
    recordCloudWatchMetric({
      name: 'provider_collection_duration_seconds',
      value: durationSeconds,
      unit: 'Seconds',
      dimensions: { provider_id: provider, corridor_id: corridor },
      highCardinality: true,
    })
  }
}

export const updateCircuitBreakerState = (
  providerId: string,
  corridorId: string | null,
  state: 'closed' | 'open' | 'half_open',
) => {
  const provider = providerId || 'unknown'
  const corridor = normalizeCorridorId(corridorId)
  const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2
  circuitBreakerState.set({ provider_id: provider, corridor_id: corridor }, stateValue)
  recordCloudWatchMetric({
    name: 'circuit_breaker_state',
    value: stateValue,
    unit: 'Count',
    dimensions: { provider_id: provider, corridor_id: corridor },
    highCardinality: true,
  })
}

export { getMetrics, metricsContentType }
