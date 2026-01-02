import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IQuoteRefreshRepository,
  QuoteRefreshRequestRecord,
} from '../interfaces/quote-refresh-repository.interface'
import { QuoteRefreshStatus, type QuoteRefreshStatusValue } from '../types/quote-refresh-status'

export class QuoteRefreshRepository implements IQuoteRefreshRepository {
  constructor(private readonly pool: Pool) {}

  async claimPendingRequests(limit: number, maxRetries: number): Promise<QuoteRefreshRequestRecord[]> {
    const result = await query<QuoteRefreshRequestRecord>(
      `WITH next AS (
         SELECT request_id, status, retry_count, processed_at
           FROM silver.quote_refresh_request
          WHERE status = $1
             OR (
               status = $2
               AND retry_count < $3
               AND (
                 processed_at IS NULL
                 OR EXTRACT(EPOCH FROM (NOW() - processed_at)) >= POWER(2, retry_count)
               )
             )
          ORDER BY last_requested_at DESC
          LIMIT $4
          FOR UPDATE SKIP LOCKED
       )
       UPDATE silver.quote_refresh_request AS req
          SET status = $5,
              locked_at = NOW(),
              retry_count = CASE
                WHEN next.status = $2 THEN req.retry_count + 1
                ELSE req.retry_count
              END
        FROM next
        WHERE req.request_id = next.request_id
        RETURNING req.request_id, req.provider_id, req.corridor_id, req.amount_bucket, req.payin_method, req.payout_method, req.retry_count`,
      [
        QuoteRefreshStatus.PENDING,
        QuoteRefreshStatus.FAILED,
        maxRetries,
        limit,
        QuoteRefreshStatus.PROCESSING,
      ],
      this.pool,
    )
    return result.rows
  }

  async markRequestStatus(
    requestId: string,
    status: QuoteRefreshStatusValue,
    errorMessage: string | null,
  ): Promise<void> {
    await query(
      `UPDATE silver.quote_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = CASE
                WHEN $1 = $3 THEN retry_count
                ELSE 0
              END
        WHERE request_id = $4`,
      [status, errorMessage, QuoteRefreshStatus.FAILED, requestId],
      this.pool,
    )
  }

  async markRequestFailed(
    requestId: string,
    errorMessage: string | null,
    retryCountOverride?: number,
  ): Promise<void> {
    await query(
      `UPDATE silver.quote_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = COALESCE($3, retry_count)
        WHERE request_id = $4`,
      [QuoteRefreshStatus.FAILED, errorMessage, retryCountOverride ?? null, requestId],
      this.pool,
    )
  }

  async retryFailedRequests(minAgeSeconds: number): Promise<number> {
    const result = await query<{ request_id: string }>(
      `UPDATE silver.quote_refresh_request
          SET status = $1,
              error_message = NULL,
              processed_at = NULL,
              locked_at = NULL,
              retry_count = 0
        WHERE status = $2
          AND EXTRACT(EPOCH FROM (NOW() - processed_at)) > $3
        RETURNING request_id`,
      [QuoteRefreshStatus.PENDING, QuoteRefreshStatus.FAILED, minAgeSeconds],
      this.pool,
    )
    return result.rowCount ?? 0
  }

  async getQueueDepth(): Promise<number> {
    const result = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
         FROM silver.quote_refresh_request
        WHERE status = $1`,
      [QuoteRefreshStatus.PENDING],
      this.pool,
    )
    return result.rows[0]?.count ?? 0
  }
}
