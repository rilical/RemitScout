import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.repository-metrics')

let cloudWatchClient: CloudWatchClient | null = null

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

export type RepositoryOperation = 
  | 'query'
  | 'insert'
  | 'update'
  | 'delete'
  | 'aggregate'
  | 'get'
  | 'upsert'

/**
 * Records CloudWatch metrics for repository operations.
 */
export const recordRepositoryMetric = async (
  repository: string,
  operation: RepositoryOperation,
  durationMs: number,
  success: boolean,
  errorType?: string,
): Promise<void> => {
  try {
    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Repositories',
        MetricData: [
          {
            MetricName: 'operation_duration',
            Value: durationMs,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'Repository', Value: repository },
              { Name: 'Operation', Value: operation },
            ],
          },
          {
            MetricName: success ? 'operation_success' : 'operation_failure',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'Repository', Value: repository },
              { Name: 'Operation', Value: operation },
              ...(errorType ? [{ Name: 'ErrorType', Value: errorType }] : []),
            ],
          },
        ],
      }),
    )
  } catch (error: unknown) {
    // Silently fail metrics - don't break repository operations
    logger.debug('repository_metric_failed', {
      repository,
      operation,
      error: formatError(error).message,
    })
  }
}

/**
 * Records queue depth metric.
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
 * Records FX rate change metric and triggers SNS if significant.
 */
export const recordFxRateChange = async (
  baseCurrency: string,
  quoteCurrency: string,
  oldRate: number,
  newRate: number,
): Promise<void> => {
  try {
    const changePercent = Math.abs((newRate - oldRate) / oldRate) * 100
    const client = getCloudWatchClient()
    
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/FX',
        MetricData: [
          {
            MetricName: 'rate_change_percent',
            Value: changePercent,
            Unit: 'Percent',
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'BaseCurrency', Value: baseCurrency },
              { Name: 'QuoteCurrency', Value: quoteCurrency },
            ],
          },
        ],
      }),
    )

    // Trigger SNS notification if change > 5%
    if (changePercent > 5) {
      await notifyFxRateChange(baseCurrency, quoteCurrency, oldRate, newRate, changePercent)
    }
  } catch (error: unknown) {
    logger.debug('fx_rate_change_metric_failed', {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      error: formatError(error).message,
    })
  }
}

/**
 * Sends SNS notification for significant FX rate changes.
 */
const notifyFxRateChange = async (
  baseCurrency: string,
  quoteCurrency: string,
  oldRate: number,
  newRate: number,
  changePercent: number,
): Promise<void> => {
  try {
    const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns')
    const snsClient = new SNSClient({})
    const topicArn = process.env.FX_RATE_CHANGE_SNS_TOPIC_ARN

    if (!topicArn) {
      logger.debug('fx_rate_change_sns_disabled', {
        message: 'FX_RATE_CHANGE_SNS_TOPIC_ARN not configured',
      })
      return
    }

    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: `FX Rate Change Alert: ${baseCurrency}/${quoteCurrency}`,
        Message: JSON.stringify({
          baseCurrency,
          quoteCurrency,
          oldRate,
          newRate,
          changePercent: changePercent.toFixed(2),
          timestamp: new Date().toISOString(),
        }),
      }),
    )

    logger.info('fx_rate_change_notified', {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      change_percent: changePercent.toFixed(2),
    })
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('fx_rate_change_notification_failed', {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      error: message,
    })
  }
}


