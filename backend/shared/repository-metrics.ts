import { StandardUnit } from '@aws-sdk/client-cloudwatch'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.repository-metrics')

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
  recordCloudWatchMetric({
    namespace: 'RemitScout/Repositories',
    name: 'operation_duration',
    value: durationMs,
    unit: StandardUnit.Milliseconds,
    dimensions: {
      Repository: repository,
      Operation: operation,
    },
  })
  recordCloudWatchMetric({
    namespace: 'RemitScout/Repositories',
    name: success ? 'operation_success' : 'operation_failure',
    value: 1,
    unit: StandardUnit.Count,
    dimensions: {
      Repository: repository,
      Operation: operation,
      ...(errorType ? { ErrorType: errorType } : {}),
    },
  })
}

/**
 * Records queue depth metric.
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
    },
  })
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
    recordCloudWatchMetric({
      namespace: 'RemitScout/FX',
      name: 'rate_change_percent',
      value: changePercent,
      unit: StandardUnit.Percent,
      dimensions: {
        BaseCurrency: baseCurrency,
        QuoteCurrency: quoteCurrency,
      },
    })

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


