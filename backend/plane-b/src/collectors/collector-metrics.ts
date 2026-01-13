import { Counter, Gauge, Histogram } from 'prom-client'

import {
  metricsRegistry,
  getMetrics,
  metricsContentType,
} from '../../../shared/metrics-registry'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'

const providerCollectionSuccessTotal = new Counter({
  name: 'provider_collection_success_total',
  help: 'Successful provider collections.',
  labelNames: ['provider_id', 'corridor_id'],
  registers: [metricsRegistry],
})

const providerCollectionFailureTotal = new Counter({
  name: 'provider_collection_failure_total',
  help: 'Failed provider collections.',
  labelNames: ['provider_id', 'corridor_id', 'error_type'],
  registers: [metricsRegistry],
})

const providerCollectionDurationSeconds = new Histogram({
  name: 'provider_collection_duration_seconds',
  help: 'Provider collection duration.',
  labelNames: ['provider_id', 'corridor_id'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry],
})

const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half_open).',
  labelNames: ['provider_id', 'corridor_id'],
  registers: [metricsRegistry],
})

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



