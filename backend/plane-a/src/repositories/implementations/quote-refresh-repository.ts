import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IQuoteRefreshRepository,
  QuoteRefreshRequestInput,
} from '../interfaces/quote-refresh-repository.interface'

export class QuoteRefreshRepository implements IQuoteRefreshRepository {
  constructor(private readonly pool: Pool) {}

  async enqueueRequest(input: QuoteRefreshRequestInput): Promise<string | null> {
    const result = await query<{ request_id: string }>(
      `INSERT INTO silver.quote_refresh_request
       (provider_id, corridor_id, amount_bucket, payin_method, payout_method, status, requested_at, last_requested_at, request_count, retry_count)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW(), 1, 0)
       ON CONFLICT (provider_id, corridor_id, amount_bucket, payin_method, payout_method)
       DO UPDATE SET
         status = 'pending',
         last_requested_at = NOW(),
         request_count = silver.quote_refresh_request.request_count + 1,
         retry_count = 0
       RETURNING request_id`,
      [
        input.providerId,
        input.corridorId,
        input.amountBucket,
        input.payinMethod,
        input.payoutMethod,
      ],
      this.pool,
    )

    return result.rows[0]?.request_id ?? null
  }
}
