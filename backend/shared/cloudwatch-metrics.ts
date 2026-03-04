import {
  CloudWatchClient,
  PutMetricDataCommand,
  type StandardUnit,
} from '@aws-sdk/client-cloudwatch'

import { config } from './config'
import { CircuitBreaker } from './circuit-breaker'
import { createLogger } from './logger'
import { registerCloudWatchClient } from './connection-manager'
import { enqueueNewRelicMetric, isNewRelicMetricExportEnabled } from './newrelic-metric-exporter'

export type CloudWatchMetricInput = {
  name: string
  value: number
  unit?: StandardUnit
  namespace?: string
  dimensions?: Record<string, string>
  highCardinality?: boolean
}

const logger = createLogger('shared.cloudwatch-metrics')

const MAX_BATCH_SIZE = 20
const MAX_QUEUE_SIZE = 1000 // Backpressure threshold
const MAX_DIMENSIONS = 30 // CloudWatch limit
const METRIC_NAME_REGEX = /^[a-zA-Z0-9_]+$/

// Namespaces whose metrics back CloudWatch Alarms and MUST stay in CloudWatch.
// All other namespaces are forwarded to New Relic only (cost optimization).
const CLOUDWATCH_ALARM_NAMESPACES = new Set([
  'RemitScout',
  'RemitScout/Agents',
  'RemitScout/Pipeline',
  'RemitScout/Probes',
  'RemitScout/BatchJobs',
  'RemitScout/Workers',
  'RemitScout/Tracing',
])

const isCloudWatchRequired = (namespace: string): boolean =>
  CLOUDWATCH_ALARM_NAMESPACES.has(namespace)

let client: CloudWatchClient | null = null
let flushTimer: NodeJS.Timeout | null = null
const metricQueue: CloudWatchMetricInput[] = []
let droppedMetricsCount = 0
const putMetricCircuit = new CircuitBreaker({
  name: 'cloudwatch_put_metric_data',
  openAfterFailures: 5,
  openForMs: 60_000,
})

const getClient = () => {
  if (!client) {
    client = new CloudWatchClient({})
    registerCloudWatchClient(client, 'default')
  }
  return client
}

const shouldRecordMetric = (metric: CloudWatchMetricInput): boolean => {
  if (!config.observability.cloudwatch.enabled) return false
  if (metric.highCardinality && !config.observability.cloudwatch.highCardinalityEnabled) {
    return false
  }
  // If CloudWatch is down, avoid unbounded queue growth. Still allow a small
  // amount of "ops bookkeeping" metrics to be enqueued for later flush.
  if (putMetricCircuit.isOpen()) {
    const isCircuitMetric = metric.name === 'circuit_breaker_state_change'
    const isOpsEventMetric = metric.name.startsWith('ops_event_')
    if (!isCircuitMetric && !isOpsEventMetric) {
      return false
    }
  }
  return true
}

/**
 * Validates metric name (alphanumeric + underscore only).
 */
const validateMetricName = (name: string): boolean => {
  return METRIC_NAME_REGEX.test(name) && name.length <= 255
}

/**
 * Validates dimensions (max 30, name/value length limits).
 */
const validateDimensions = (dimensions?: Record<string, string>): boolean => {
  if (!dimensions) return true
  if (Object.keys(dimensions).length > MAX_DIMENSIONS) {
    return false
  }
  for (const [name, value] of Object.entries(dimensions)) {
    if (name.length > 255 || value.length > 255) {
      return false
    }
  }
  return true
}

const toDimensions = (dimensions?: Record<string, string>) => {
  if (!dimensions) return undefined
  const entries = Object.entries(dimensions).filter(
    ([, value]) => value !== undefined && value !== null,
  )
  // Limit to MAX_DIMENSIONS
  return entries.slice(0, MAX_DIMENSIONS).map(([Name, Value]) => ({
    Name: String(Name),
    Value: String(Value),
  }))
}

/**
 * Retry with exponential backoff for PutMetricData.
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const delay = 100 * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        logger.debug('cloudwatch_metrics_retry', {
          attempt: attempt + 1,
          max_retries: maxRetries,
          delay_ms: delay,
        })
      }
    }
  }
  throw lastError
}

const flushMetrics = async (): Promise<void> => {
  if (!config.observability.cloudwatch.enabled) {
    metricQueue.length = 0
    return
  }
  if (metricQueue.length === 0) return
  if (!putMetricCircuit.canAttempt()) {
    // Skip flush attempts during open window.
    scheduleFlush()
    return
  }

  const batch = metricQueue.splice(0, MAX_BATCH_SIZE)

  const byNamespace = new Map<string, CloudWatchMetricInput[]>()
  for (const metric of batch) {
    const namespace = metric.namespace || config.observability.cloudwatch.namespace
    const existing = byNamespace.get(namespace)
    if (existing) {
      existing.push(metric)
    } else {
      byNamespace.set(namespace, [metric])
    }
  }

  for (const [namespace, metrics] of byNamespace.entries()) {
    try {
      const command = new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: metrics.map((metric) => ({
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit,
          Dimensions: toDimensions(metric.dimensions),
        })),
      })

      await withRetry(() => getClient().send(command), 3)
      putMetricCircuit.onSuccess()
    } catch (error) {
      putMetricCircuit.onFailure(error)
      logger.warn('cloudwatch_metrics_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
        batch_size: metrics.length,
        namespace,
      })
    }
  }

  if (metricQueue.length > 0) {
    scheduleFlush()
  }
}

const scheduleFlush = () => {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushMetrics().catch((error) => {
      logger.warn('cloudwatch_metrics_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, config.observability.cloudwatch.flushIntervalMs)
  flushTimer.unref?.()
}

export const recordCloudWatchMetric = (metric: CloudWatchMetricInput): void => {
  if (!Number.isFinite(metric.value)) return

  // Validate metric name
  if (!validateMetricName(metric.name)) {
    logger.warn('cloudwatch_metric_name_invalid', {
      metric_name: metric.name,
      reason: 'must be alphanumeric + underscore only, max 255 chars',
    })
    return
  }

  // Validate dimensions
  if (!validateDimensions(metric.dimensions)) {
    logger.warn('cloudwatch_metric_dimensions_invalid', {
      metric_name: metric.name,
      dimension_count: metric.dimensions ? Object.keys(metric.dimensions).length : 0,
      reason: 'max 30 dimensions, max 255 chars per name/value',
    })
    return
  }

  const resolvedNamespace = metric.namespace || config.observability.cloudwatch.namespace

  // Route non-alarm namespaces to New Relic directly (skip CloudWatch).
  if (!isCloudWatchRequired(resolvedNamespace) && isNewRelicMetricExportEnabled()) {
    enqueueNewRelicMetric({
      name: metric.name,
      type: 'gauge',
      value: metric.value,
      attributes: {
        ...Object.fromEntries(
          Object.entries(metric.dimensions || {}).map(([k, v]) => [k, String(v)]),
        ),
        namespace: resolvedNamespace,
      },
    })
    return
  }

  if (!shouldRecordMetric(metric)) return

  // Backpressure: drop metrics if queue is too large
  if (metricQueue.length >= MAX_QUEUE_SIZE) {
    droppedMetricsCount++
    if (droppedMetricsCount % 100 === 0) {
      logger.warn('cloudwatch_metrics_dropped', {
        dropped_count: droppedMetricsCount,
        queue_size: metricQueue.length,
        reason: 'queue_size_exceeded',
      })
    }
    return
  }

  metricQueue.push(metric)

  if (metricQueue.length >= MAX_BATCH_SIZE) {
    flushMetrics().catch((error) => {
      logger.warn('cloudwatch_metrics_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
    return
  }

  scheduleFlush()
}

export const flushCloudWatchMetrics = async (): Promise<void> => {
  await flushMetrics()
}
