import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { writeBronzePayloadToS3 } from '../../../../shared/bronze-storage'
import { createLogger } from '../../../../shared/logger'
import { formatError } from '../../../../shared/utils/error-handling'
import type { BronzeWriteInput, IBronzeRepository } from '../interfaces/bronze-repository.interface'

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
}
