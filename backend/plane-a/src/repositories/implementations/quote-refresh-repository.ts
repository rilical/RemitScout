import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { wrapEnvelope } from '../../../../shared/queue-staleness'
import { sendJsonMessage } from '../../../../shared/sqs'
import type {
  IQuoteRefreshRepository,
  QuoteRefreshRequestInput,
  QuoteRefreshStatusCount,
} from '../interfaces/quote-refresh-repository.interface'

export class QuoteRefreshRepository implements IQuoteRefreshRepository {
  private readonly logger = createLogger('plane-a.quote-refresh')

  constructor(private readonly pool: Pool) {}

  async enqueueRequest(input: QuoteRefreshRequestInput): Promise<string | null> {
    const queueMode = config.queues.quoteRefreshMode
    const queueUrl = config.queues.quoteRefreshUrl
    const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)

    if (queueMode === 'queue' && !queueEnabled) {
      this.logger.warn('queue_mode_without_url', {
        mode: queueMode,
        queue_url_set: Boolean(queueUrl),
      })
    }

    // Atomic upsert: only reset to 'pending' if not currently 'processing'.
    // This avoids a TOCTOU race where a separate SELECT+INSERT/UPDATE could
    // overwrite a 'processing' status back to 'pending'.
    const result = await query<{ request_id: string; did_enqueue: boolean }>(
      `INSERT INTO silver.quote_refresh_request
       (provider_id, corridor_id, amount_bucket, payin_method, payout_method, status, requested_at, last_requested_at, request_count, retry_count)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW(), 1, 0)
       ON CONFLICT (provider_id, corridor_id, amount_bucket, payin_method, payout_method)
       DO UPDATE SET
         status = CASE
           WHEN silver.quote_refresh_request.status = 'processing' THEN silver.quote_refresh_request.status
           ELSE 'pending'
         END,
         last_requested_at = NOW(),
         request_count = silver.quote_refresh_request.request_count + 1,
         retry_count = CASE
           WHEN silver.quote_refresh_request.status = 'processing' THEN silver.quote_refresh_request.retry_count
           ELSE 0
         END
       RETURNING request_id,
         (silver.quote_refresh_request.status = 'pending') AS did_enqueue`,
      [
        input.providerId,
        input.corridorId,
        input.amountBucket,
        input.payinMethod,
        input.payoutMethod,
      ],
      this.pool,
    )

    const row = result.rows[0]
    const requestId = row?.request_id ?? null
    const shouldEnqueue = row?.did_enqueue ?? false

    if (requestId && queueEnabled && shouldEnqueue) {
      try {
        await sendJsonMessage(
          queueUrl,
          wrapEnvelope(
            'quote-refresh',
            {
              requestId,
              providerId: input.providerId,
              corridorId: input.corridorId,
              amountBucket: input.amountBucket,
              payinMethod: input.payinMethod,
              payoutMethod: input.payoutMethod,
            },
            { correlationId: requestId },
          ),
        )
      } catch (error) {
        this.logger.warn('queue_enqueue_failed', {
          request_id: requestId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else if (requestId && queueEnabled && !shouldEnqueue) {
      this.logger.debug('queue_enqueue_skipped', {
        request_id: requestId,
        status: 'processing',
      })
    }

    return requestId
  }

  async listStatusCounts(requestIds: string[]): Promise<QuoteRefreshStatusCount[]> {
    if (!requestIds.length) return []
    const result = await query<QuoteRefreshStatusCount>(
      `SELECT status, COUNT(*)::int AS count
         FROM silver.quote_refresh_request
        WHERE request_id = ANY($1::uuid[])
        GROUP BY status`,
      [requestIds],
      this.pool,
    )
    return result.rows
  }
}
