import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { IQuoteAttemptRepository, QuoteAttemptInput } from '../interfaces/quote-attempt-repository.interface'

export class QuoteAttemptRepository implements IQuoteAttemptRepository {
  constructor(private readonly pool: Pool) {}

  async insertAttempt(input: QuoteAttemptInput): Promise<void> {
    await query(
      `INSERT INTO silver.quote_attempt
       (provider_id, corridor_id, amount_bucket, payin_method, payout_method, success, error_type, http_status, error_message, bronze_object_key, request_fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        input.providerId,
        input.corridorId,
        input.amountBucket,
        input.payinMethod,
        input.payoutMethod,
        input.success,
        input.errorType,
        input.httpStatus,
        input.errorMessage,
        input.bronzeObjectKey,
        input.requestFingerprint,
      ],
      this.pool,
    )
  }
}
