import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { wrapEnvelope } from '../../../../shared/queue-staleness'
import { sendJsonMessage } from '../../../../shared/sqs'
import type {
  IFxRateRefreshRepository,
  FxRateRefreshRequestInput,
  FxRateRefreshStatusCount,
} from '../interfaces/fx-rate-refresh-repository.interface'

export class FxRateRefreshRepository implements IFxRateRefreshRepository {
  private readonly logger = createLogger('plane-a.fx-rate-refresh')

  constructor(private readonly pool: Pool) {}

  async enqueueRequest(input: FxRateRefreshRequestInput): Promise<string | null> {
    const queueMode = config.queues.fxRateRefreshMode
    const queueUrl = config.queues.fxRateRefreshUrl
    const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)

    if (queueMode === 'queue' && !queueEnabled) {
      this.logger.warn('queue_mode_without_url', {
        mode: queueMode,
        queue_url_set: Boolean(queueUrl),
      })
    }

    const result = await query<{ request_id: string }>(
      `INSERT INTO silver.fx_rate_refresh_request
       (base_currency, quote_currency, status, requested_at, last_requested_at, request_count, retry_count)
       VALUES ($1, $2, 'pending', NOW(), NOW(), 1, 0)
       ON CONFLICT (base_currency, quote_currency)
       DO UPDATE SET
         status = 'pending',
         last_requested_at = NOW(),
         request_count = silver.fx_rate_refresh_request.request_count + 1,
         retry_count = 0
       RETURNING request_id`,
      [input.baseCurrency, input.quoteCurrency],
      this.pool,
    )

    const requestId = result.rows[0]?.request_id ?? null

    if (requestId && queueEnabled) {
      try {
        await sendJsonMessage(
          queueUrl,
          wrapEnvelope(
            'fx-rate-refresh',
            {
              requestId,
              baseCurrency: input.baseCurrency,
              quoteCurrency: input.quoteCurrency,
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
    }

    return requestId
  }

  async listStatusCounts(requestIds: string[]): Promise<FxRateRefreshStatusCount[]> {
    if (!requestIds.length) return []
    const result = await query<FxRateRefreshStatusCount>(
      `SELECT status, COUNT(*)::int AS count
         FROM silver.fx_rate_refresh_request
        WHERE request_id = ANY($1::uuid[])
        GROUP BY status`,
      [requestIds],
      this.pool,
    )
    return result.rows
  }
}
