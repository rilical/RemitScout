import { CloudWatchClient, PutMetricDataCommand, type MetricDatum, StandardUnit } from '@aws-sdk/client-cloudwatch'
import { config } from './config'
import { createLogger } from './logger'
import { enqueueNewRelicMetric, isNewRelicMetricExportEnabled } from './newrelic-metric-exporter'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.worker-metrics')

let cloudWatchClient: CloudWatchClient | null = null
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

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
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

  try {
    if (!config.observability.cloudwatch.enabled) return

    const client = getCloudWatchClient()
    const metricData: MetricDatum[] = [
      {
        MetricName: operation,
        Value: count,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
      },
    ]
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Workers',
        MetricData: metricData,
      }),
    )
  } catch (error: unknown) {
    logger.warn('worker_metric_failed', {
      worker_name: workerName,
      operation,
      error: formatError(error).message,
    })
  }
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

  try {
    if (!config.observability.cloudwatch.enabled) return

    const client = getCloudWatchClient()
    const metricData: MetricDatum[] = [
      {
        MetricName: operation,
        Value: 1,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
      },
    ]

    if (durationSeconds !== undefined) {
      metricData.push({
        MetricName: 'job_duration',
        Value: durationSeconds,
        Unit: StandardUnit.Seconds,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
      })
    }

    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/BatchJobs',
        MetricData: metricData,
      }),
    )
  } catch (error: unknown) {
    logger.warn('batch_job_metric_failed', {
      job_name: jobName,
      operation,
      error: formatError(error).message,
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
  enqueueNewRelicMirror(
    'queue_depth',
    depth,
    'RemitScout/Queues',
    { QueueName: queueName, environment: environmentDimension },
  )

  try {
    if (!config.observability.cloudwatch.enabled) return

    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Queues',
        MetricData: [
          {
            MetricName: 'queue_depth',
            Value: depth,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'QueueName', Value: queueName },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    logger.warn('queue_depth_metric_failed', {
      queue_name: queueName,
      error: formatError(error).message,
    })
  }
}

/**
 * Records DLQ message count metric.
 */
export const recordDLQMessageCount = async (
  queueName: string,
  dlqName: string,
  count: number,
): Promise<void> => {
  enqueueNewRelicMirror(
    'dlq_message_count',
    count,
    'RemitScout/Queues',
    { QueueName: queueName, DLQName: dlqName, environment: environmentDimension },
  )

  try {
    if (!config.observability.cloudwatch.enabled) return

    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Queues',
        MetricData: [
          {
            MetricName: 'dlq_message_count',
            Value: count,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'QueueName', Value: queueName },
              { Name: 'DLQName', Value: dlqName },
              { Name: 'environment', Value: environmentDimension },
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    logger.warn('dlq_message_count_metric_failed', {
      queue_name: queueName,
      error: formatError(error).message,
    })
  }
}
