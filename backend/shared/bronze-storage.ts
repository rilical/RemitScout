import { PutObjectCommand, S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { gzip } from 'zlib'
import { promisify } from 'util'
import { randomUUID } from 'crypto'

import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('shared.bronze-storage')
const gzipAsync = promisify(gzip)

let s3Client: S3Client | null = null
let bucketValidated = false

const getClient = () => {
  if (!s3Client) {
    s3Client = new S3Client({})
  }
  return s3Client
}

/**
 * Validates that bucket exists and is accessible.
 */
const validateBucket = async (bucket: string): Promise<boolean> => {
  if (bucketValidated) return true

  try {
    const client = getClient()
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    bucketValidated = true
    return true
  } catch (error) {
    logger.warn('bronze_s3_bucket_validation_failed', {
      bucket,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * Retry with exponential backoff.
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
        logger.debug('bronze_s3_retry', {
          attempt: attempt + 1,
          max_retries: maxRetries,
          delay_ms: delay,
        })
      }
    }
  }
  throw lastError
}

const normalizePrefix = (value: string) => value.replace(/^\/+|\/+$/g, '')

export type BronzeS3WriteInput = {
  providerId: string
  corridorId: string
  payload: unknown
}

export type BronzeS3WriteResult = {
  bucket: string
  key: string
  uri: string
  sizeBytes: number
}

export const writeBronzePayloadToS3 = async (
  input: BronzeS3WriteInput,
): Promise<BronzeS3WriteResult | null> => {
  const bucket = config.storage.bronze.bucket
  if (!bucket) {
    return null
  }

  // Validate bucket exists
  if (!(await validateBucket(bucket))) {
    return null
  }

  const prefix = normalizePrefix(config.storage.bronze.prefix || 'bronze')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const key = `${prefix}/${input.providerId}/${input.corridorId}/${timestamp}-${randomUUID()}.json.gz`

  try {
    let payload: string
    try {
      payload = JSON.stringify(input.payload ?? null)
    } catch (error) {
      logger.warn('bronze_s3_serialization_failed', {
        bucket,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }

    // Compress with gzip
    const uncompressedBody = Buffer.from(payload)
    const compressedBody = await gzipAsync(uncompressedBody)

    await withRetry(
      () =>
        getClient().send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: compressedBody,
            ContentType: 'application/json',
            ContentEncoding: 'gzip',
            Metadata: {
              provider_id: input.providerId,
              corridor_id: input.corridorId,
              uncompressed_size: String(uncompressedBody.length),
            },
          }),
        ),
      3,
    )

    return {
      bucket,
      key,
      uri: `s3://${bucket}/${key}`,
      sizeBytes: compressedBody.length,
    }
  } catch (error) {
    logger.warn('bronze_s3_write_failed', {
      bucket,
      key,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Batch upload multiple payloads to S3.
 */
export const writeBronzePayloadsToS3 = async (
  inputs: BronzeS3WriteInput[],
): Promise<Array<BronzeS3WriteResult | null>> => {
  const results = await Promise.allSettled(
    inputs.map((input) => writeBronzePayloadToS3(input)),
  )

  return results.map((result) => (result.status === 'fulfilled' ? result.value : null))
}
