import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.worker-metrics')

let cloudWatchClient: CloudWatchClient | null = null

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
  operation: 'message_processed' | 'message_failed' | 'dlq_sent' | 'lock_failed',
  count: number = 1,
  additionalDimensions?: Record<string, string>,
): Promise<void> => {
  try {
    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Workers',
        MetricData: [
          {
            MetricName: operation,
            Value: count,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'WorkerName', Value: workerName },
              ...Object.entries(additionalDimensions || {}).map(([key, value]) => ({
                Name: key,
                Value: value,
              })),
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    // Silently fail metrics - don't break worker operations
    logger.debug('worker_metric_failed', {
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
  try {
    const client = getCloudWatchClient()
    const metricData = [
      {
        MetricName: operation,
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'JobName', Value: jobName },
          ...Object.entries(additionalDimensions || {}).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
      },
    ]

    if (durationSeconds !== undefined) {
      metricData.push({
        MetricName: 'job_duration',
        Value: durationSeconds,
        Unit: 'Seconds',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'JobName', Value: jobName },
          ...Object.entries(additionalDimensions || {}).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
      })
    }

    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/BatchJobs',
        MetricData: metricData,
      }),
    )
  } catch (error: unknown) {
    logger.debug('batch_job_metric_failed', {
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
  try {
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
            Dimensions: [{ Name: 'QueueName', Value: queueName }],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    logger.debug('queue_depth_metric_failed', {
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
  try {
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
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    logger.debug('dlq_message_count_metric_failed', {
      queue_name: queueName,
      error: formatError(error).message,
    })
  }
}




