import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs'
import { getPool } from './db'
import { getRedisClient } from './redis'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('shared.aws-config-validator')

export type ValidationResult = {
  service: string
  valid: boolean
  error?: string
}

type QueueResource = 'quote_refresh'
  | 'quote_refresh_dlq'
  | 'fx_rate_refresh'
  | 'fx_rate_refresh_dlq'
  | 'exports'
  | 'alert_evaluation'
  | 'ops_alerts'
  | 'ingest_fanout'
  | 'ingest_fanout_tier1'
  | 'ingest_fanout_tier2'
  | 'notifications'

type BucketResource = 'bronze_bucket' | 'exports_bucket'

export type ValidationOptions = {
  skipS3?: boolean
  skipSQS?: boolean
  skipRedis?: boolean
  skipDatabase?: boolean
  requiredQueues?: QueueResource[]
  requiredBuckets?: BucketResource[]
}

/**
 * Validates AWS service configuration and connectivity.
 * Can be called on startup to ensure all services are properly configured.
 */
export const validateAwsConfig = async (
  options: ValidationOptions = {},
): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = []

  // Validate Database connectivity (Aurora/RDS proxy).
  if (!options.skipDatabase) {
    const databases = [
      { name: 'plane_a', url: config.db.planeAUrl },
      { name: 'plane_b', url: config.db.planeBUrl },
      { name: 'plane_c', url: config.db.planeCUrl },
    ]

    for (const db of databases) {
      if (!db.url) {
        continue
      }
      try {
        const pool = getPool(db.url)
        await pool.query('SELECT 1')
        results.push({ service: `db_${db.name}`, valid: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('db_validation_failed', {
          database: db.name,
          error: errorMessage,
        })
        results.push({
          service: `db_${db.name}`,
          valid: false,
          error: errorMessage,
        })
      }
    }
  }

  const includeBronzeBucket = (() => {
    if (!options.skipS3) {
      if (options.requiredBuckets && options.requiredBuckets.length > 0) {
        return options.requiredBuckets.includes('bronze_bucket')
      }
      if (options.requiredBuckets && options.requiredBuckets.length === 0) {
        return false
      }
      return true
    }
    return false
  })()
  const includeExportsBucket = (() => {
    if (!options.skipS3) {
      if (options.requiredBuckets && options.requiredBuckets.length > 0) {
        return options.requiredBuckets.includes('exports_bucket')
      }
      if (options.requiredBuckets && options.requiredBuckets.length === 0) {
        return false
      }
      return true
    }
    return false
  })()

  // Validate S3 Bronze Storage
  if (includeBronzeBucket) {
    if (config.storage.bronze.bucket) {
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
    } else {
      results.push({
        service: 's3_bronze',
        valid: false,
        error: 'BRONZE_S3_BUCKET not configured',
      })
    }
  }

  // Validate S3 Exports Storage
  if (includeExportsBucket) {
    if (config.storage.exports.bucket) {
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
    } else {
      results.push({
        service: 's3_exports',
        valid: false,
        error: 'EXPORTS_S3_BUCKET not configured',
      })
    }
  }

  // Validate SQS Queues
  if (!options.skipSQS) {
    const shouldValidateQueue = (name: QueueResource): boolean => {
      if (options.requiredQueues === undefined) return true
      if (options.requiredQueues.length === 0) return false
      return options.requiredQueues.includes(name)
    }

    const queues = [
      shouldValidateQueue('quote_refresh') && {
        name: 'quote_refresh' as const,
        url: config.queues.quoteRefreshUrl,
      },
      shouldValidateQueue('quote_refresh_dlq') && {
        name: 'quote_refresh_dlq' as const,
        url: config.queues.quoteRefreshDlqUrl,
      },
      shouldValidateQueue('fx_rate_refresh') && {
        name: 'fx_rate_refresh' as const,
        url: config.queues.fxRateRefreshUrl,
      },
      shouldValidateQueue('fx_rate_refresh_dlq') && {
        name: 'fx_rate_refresh_dlq' as const,
        url: config.queues.fxRateRefreshDlqUrl,
      },
      shouldValidateQueue('exports') && { name: 'exports' as const, url: config.queues.exports.url },
      shouldValidateQueue('alert_evaluation') && {
        name: 'alert_evaluation' as const,
        url: config.alerts.evaluation.queueUrl,
      },
      shouldValidateQueue('ops_alerts') && {
        name: 'ops_alerts' as const,
        url: config.queues.opsAlerts.url,
      },
      shouldValidateQueue('ingest_fanout') && {
        name: 'ingest_fanout' as const,
        url: config.queues.ingestFanout.url,
      },
      shouldValidateQueue('ingest_fanout_tier1') && {
        name: 'ingest_fanout_tier1' as const,
        url: config.queues.ingestFanout.tier1Url,
      },
      shouldValidateQueue('ingest_fanout_tier2') && {
        name: 'ingest_fanout_tier2' as const,
        url: config.queues.ingestFanout.tier2Url,
      },
      shouldValidateQueue('notifications') && {
        name: 'notifications' as const,
        url: config.queues.notifications.url,
      },
    ].filter(Boolean) as Array<{ name: QueueResource; url: string | undefined }>

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
