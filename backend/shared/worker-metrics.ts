import { StandardUnit } from '@aws-sdk/client-cloudwatch'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { enqueueNewRelicMetric, isNewRelicMetricExportEnabled } from './newrelic-metric-exporter'
const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

const enqueueNewRelicMirror = (
  name: string,
  value: number,
  namespace: string,
  dimensions: Record<string, string>,
) => {
  if (!Number.isFinite(value) || !isNewRelicMetricExportEnabled()) return
  enqueueNewRelicMetric({
    name,
    type: 'gauge',
    value,
    attributes: {
      ...dimensions,
      namespace,
    },
  })
}

/**
 * Records CloudWatch metrics for worker operations.
 */
export const recordWorkerMetric = async (
  workerName: string,
  operation:
    | 'message_processed'
    | 'message_failed'
    | 'dlq_sent'
    | 'lock_failed'
    | 'stale_dropped'
    | 'envelope_parse_error',
  count: number = 1,
  additionalDimensions?: Record<string, string>,
): Promise<void> => {
  const dimensions: Record<string, string> = {
    WorkerName: workerName,
    environment: environmentDimension,
    ...Object.fromEntries(
      Object.entries(additionalDimensions || {})
        .filter(([key]) => key.toLowerCase() !== 'environment'),
    ),
  }

  enqueueNewRelicMirror(operation, count, 'RemitScout/Workers', dimensions)
  recordCloudWatchMetric({
    namespace: 'RemitScout/Workers',
    name: operation,
    value: count,
    unit: StandardUnit.Count,
    dimensions,
  })
}

/**
 * Records batch job metrics.
 */
export const recordBatchJobMetric = async (
  jobName: string,
  operation: 'job_start' | 'job_complete' | 'job_failure',
  durationSeconds?: number,
  additionalDimensions?: Record<string, string>,
): Promise<void> => {
  const dimensions: Record<string, string> = {
    JobName: jobName,
    environment: environmentDimension,
    ...Object.fromEntries(
      Object.entries(additionalDimensions || {})
        .filter(([key]) => key.toLowerCase() !== 'environment'),
    ),
  }

  enqueueNewRelicMirror(operation, 1, 'RemitScout/BatchJobs', dimensions)
  if (durationSeconds !== undefined) {
    enqueueNewRelicMirror('job_duration', durationSeconds, 'RemitScout/BatchJobs', dimensions)
  }
  recordCloudWatchMetric({
    namespace: 'RemitScout/BatchJobs',
    name: operation,
    value: 1,
    unit: StandardUnit.Count,
    dimensions,
  })
  if (durationSeconds !== undefined) {
    recordCloudWatchMetric({
      namespace: 'RemitScout/BatchJobs',
      name: 'job_duration',
      value: durationSeconds,
      unit: StandardUnit.Seconds,
      dimensions,
    })
  }
}

/**
 * Records SQS queue depth metric.
 */
export const recordQueueDepthMetric = async (
  queueName: string,
  depth: number,
): Promise<void> => {
  recordCloudWatchMetric({
    namespace: 'RemitScout/Queues',
    name: 'queue_depth',
    value: depth,
    unit: StandardUnit.Count,
    dimensions: {
      QueueName: queueName,
      environment: environmentDimension,
    },
  })
}

/**
 * Records DLQ message count metric.
 */
export const recordDLQMessageCount = async (
  queueName: string,
  dlqName: string,
  count: number,
): Promise<void> => {
  recordCloudWatchMetric({
    namespace: 'RemitScout/Queues',
    name: 'dlq_message_count',
    value: count,
    unit: StandardUnit.Count,
    dimensions: {
      QueueName: queueName,
      DLQName: dlqName,
      environment: environmentDimension,
    },
  })
}
