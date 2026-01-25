import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { writeBronzePayloadToS3 } from '../../../../shared/bronze-storage'
import { createLogger } from '../../../../shared/logger'
import { formatError } from '../../../../shared/utils/error-handling'
import type { BronzeWriteInput, FailedAttemptInput, IBronzeRepository } from '../interfaces/bronze-repository.interface'

const logger = createLogger('plane-b.bronze-repository')

export class BronzeRepository implements IBronzeRepository {
  constructor(private readonly pool: Pool) {}

  async insertPayload(input: BronzeWriteInput): Promise<number | null> {
    let s3ObjectKey: string | null = input.s3ObjectKey ?? null

    // Upload to S3 if not already provided
    if (!s3ObjectKey && input.payload) {
      try {
        const s3Result = await writeBronzePayloadToS3({
          providerId: input.providerId,
          corridorId: input.corridorId,
          payload: input.payload,
        })
        s3ObjectKey = s3Result?.uri ?? null
      } catch (error: unknown) {
        const { message } = formatError(error)
        logger.warn('bronze_s3_upload_failed', {
          provider_id: input.providerId,
          corridor_id: input.corridorId,
          error: message,
          message: 'Continuing with database insert without S3 key',
        })
        // Continue with database insert even if S3 upload fails
      }
    }

    try {
      const payloadJson = JSON.stringify(input.payload ?? null)
      const result = await query<{ id: number }>(
        `INSERT INTO bronze.provider_raw (provider_id, corridor, payload, s3_object_key)
         VALUES ($1, $2, $3::jsonb, $4)
         RETURNING id`,
        [input.providerId, input.corridorId, payloadJson, s3ObjectKey],
        this.pool,
      )
      return result.rows[0]?.id ?? null
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      logger.error('bronze_insert_failed', {
        provider_id: input.providerId,
        corridor_id: input.corridorId,
        error: message,
        stack,
      })
      throw error
    }
  }

  async recordFailedAttempt(input: FailedAttemptInput): Promise<void> {
    try {
      await query(
        `INSERT INTO silver.quote_attempt
         (provider_id, corridor_id, amount_bucket, payin_method, payout_method, attempted_at, success, error_type, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, false, 'bronze_write_failed', $7)`,
        [
          input.providerId,
          input.corridorId,
          input.amountBucket,
          input.payinMethod,
          input.payoutMethod,
          input.attemptedAt,
          input.reason,
        ],
        this.pool,
      )
      logger.debug('bronze_failed_attempt_recorded', {
        provider_id: input.providerId,
        corridor_id: input.corridorId,
        reason: input.reason,
      })
    } catch (error: unknown) {
      const { message } = formatError(error)
      logger.warn('bronze_failed_attempt_record_error', {
        provider_id: input.providerId,
        corridor_id: input.corridorId,
        error: message,
      })
    }
  }
}
