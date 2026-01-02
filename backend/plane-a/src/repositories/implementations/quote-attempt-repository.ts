import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IQuoteAttemptRepository,
  QuoteAttemptRecord,
} from '../interfaces/quote-attempt-repository.interface'

export class QuoteAttemptRepository implements IQuoteAttemptRepository {
  constructor(private readonly pool: Pool) {}

  async listLatestAttemptsByProvider(
    providerId: string,
    corridorIds: string[],
  ): Promise<QuoteAttemptRecord[]> {
    const result = await query<QuoteAttemptRecord>(
      `SELECT DISTINCT ON (corridor_id)
         corridor_id,
         attempted_at,
         success,
         error_type,
         http_status,
         error_message,
         request_fingerprint
       FROM silver.quote_attempt
       WHERE provider_id = $1
         AND corridor_id = ANY($2::text[])
       ORDER BY corridor_id, attempted_at DESC`,
      [providerId, corridorIds],
      this.pool,
    )

    return result.rows
  }
}
