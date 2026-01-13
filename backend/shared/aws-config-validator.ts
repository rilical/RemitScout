import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs'
import { getRedisClient } from './redis'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('shared.aws-config-validator')

export type ValidationResult = {
  service: string
  valid: boolean
  error?: string
}

export type ValidationOptions = {
  skipS3?: boolean
  skipSQS?: boolean
  skipRedis?: boolean
  skipDatabase?: boolean
}

/**
 * Validates AWS service configuration and connectivity.
 * Can be called on startup to ensure all services are properly configured.
 */
export const validateAwsConfig = async (
  options: ValidationOptions = {},
): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = []

  // Validate S3 Bronze Storage
  if (!options.skipS3 && config.storage.bronze.bucket) {
    try {
      const s3Client = new S3Client({})
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: config.storage.bronze.bucket,
        }),
      )
      results.push({ service: 's3_bronze', valid: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('s3_validation_failed', {
        bucket: config.storage.bronze.bucket,
        error: errorMessage,
      })
      results.push({
        service: 's3_bronze',
        valid: false,
        error: errorMessage,
      })
    }
  } else if (!options.skipS3) {
    results.push({
      service: 's3_bronze',
      valid: false,
      error: 'BRONZE_S3_BUCKET not configured',
    })
  }

  // Validate S3 Exports Storage
  if (!options.skipS3 && config.storage.exports.bucket) {
    try {
      const s3Client = new S3Client({})
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: config.storage.exports.bucket,
        }),
      )
      results.push({ service: 's3_exports', valid: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('s3_validation_failed', {
        bucket: config.storage.exports.bucket,
        error: errorMessage,
      })
      results.push({
        service: 's3_exports',
        valid: false,
        error: errorMessage,
      })
    }
  } else if (!options.skipS3) {
    results.push({
      service: 's3_exports',
      valid: false,
      error: 'EXPORTS_S3_BUCKET not configured',
    })
  }

  // Validate SQS Queues
  if (!options.skipSQS) {
    const queues = [
      { name: 'quote_refresh', url: config.queues.quoteRefreshUrl },
      { name: 'quote_refresh_dlq', url: config.queues.quoteRefreshDlqUrl },
      { name: 'fx_rate_refresh', url: config.queues.fxRateRefreshUrl },
      { name: 'fx_rate_refresh_dlq', url: config.queues.fxRateRefreshDlqUrl },
      { name: 'exports', url: config.queues.exports.url },
      { name: 'alert_evaluation', url: config.alerts.evaluation.queueUrl },
      { name: 'ops_alerts', url: config.queues.opsAlerts.url },
      { name: 'ingest_fanout', url: config.queues.ingestFanout.url },
      { name: 'notifications', url: config.queues.notifications.url },
    ]

    const sqsClient = new SQSClient({})

    for (const queue of queues) {
      if (!queue.url) {
        results.push({
          service: `sqs_${queue.name}`,
          valid: false,
          error: 'Queue URL not configured',
        })
        continue
      }

      try {
        // Extract queue name from URL
        const queueName = queue.url.split('/').pop()
        if (!queueName) {
          throw new Error('Invalid queue URL format')
        }

        await sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: queue.url,
            AttributeNames: ['ApproximateNumberOfMessages'],
          }),
        )
        results.push({ service: `sqs_${queue.name}`, valid: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('sqs_validation_failed', {
          queue_name: queue.name,
          queue_url: queue.url.substring(0, 50), // Log first 50 chars only
          error: errorMessage,
        })
        results.push({
          service: `sqs_${queue.name}`,
          valid: false,
          error: errorMessage,
        })
      }
    }
  }

  // Validate Redis/ElastiCache
  if (!options.skipRedis) {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        results.push({
          service: 'redis',
          valid: false,
          error: 'REDIS_URL not configured',
        })
      } else {
        await redis.ping()
        results.push({ service: 'redis', valid: true })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('redis_validation_failed', { error: errorMessage })
      results.push({
        service: 'redis',
        valid: false,
        error: errorMessage,
      })
    }
  }

  return results
}

/**
 * Validates configuration and throws if any required services are invalid.
 */
export const assertAwsConfig = async (
  options: ValidationOptions = {},
): Promise<void> => {
  const results = await validateAwsConfig(options)
  const failures = results.filter((r) => !r.valid)

  if (failures.length > 0) {
    const errors = failures.map((f) => `${f.service}: ${f.error || 'unknown error'}`).join(', ')
    throw new Error(`AWS configuration validation failed: ${errors}`)
  }
}

