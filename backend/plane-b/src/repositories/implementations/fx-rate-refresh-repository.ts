import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { createLogger } from '../../../../shared/logger'
import { formatError, isError } from '../../../../shared/utils/error-handling'
import { queueDepthCache } from '../../../../shared/repository-cache'
import { recordRepositoryMetric, recordQueueDepthMetric } from '../../../../shared/repository-metrics'
import { withRetry, withCircuitBreaker } from '../../../../shared/repository-retry'
import { triggerQueueDepthCacheRefresh } from '../../../../shared/eventbridge-cache-refresh'
import type {
  IFxRateRefreshRepository,
  FxRateRefreshRequestRecord,
} from '../interfaces/fx-rate-refresh-repository.interface'
import { FxRateRefreshStatus, type FxRateRefreshStatusValue } from '../types/fx-rate-refresh-status'

const logger = createLogger('plane-b.fx-rate-refresh-repository')

export class FxRateRefreshRepository implements IFxRateRefreshRepository {
  constructor(private readonly pool: Pool) {}

  async claimPendingRequests(limit: number, maxRetries: number): Promise<FxRateRefreshRequestRecord[]> {
    const result = await query<FxRateRefreshRequestRecord>(
      `WITH next AS (
         SELECT request_id, status, retry_count, processed_at
           FROM silver.fx_rate_refresh_request
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
       UPDATE silver.fx_rate_refresh_request AS req
          SET status = $5,
              locked_at = NOW(),
              retry_count = CASE
                WHEN next.status = $2 THEN req.retry_count + 1
                ELSE req.retry_count
              END
        FROM next
        WHERE req.request_id = next.request_id
        RETURNING req.request_id, req.base_currency, req.quote_currency, req.retry_count`,
      [
        FxRateRefreshStatus.PENDING,
        FxRateRefreshStatus.FAILED,
        maxRetries,
        limit,
        FxRateRefreshStatus.PROCESSING,
      ],
      this.pool,
    )
    return result.rows
  }

  async claimRequestById(
    requestId: string,
    maxRetries: number,
    retryCount?: number,
  ): Promise<FxRateRefreshRequestRecord | null> {
    const result = await query<FxRateRefreshRequestRecord>(
      `WITH next AS (
         SELECT request_id
           FROM silver.fx_rate_refresh_request
          WHERE request_id = $1
            AND (
              status = $2
              OR (status = $3 AND retry_count < $4)
            )
          FOR UPDATE
       )
       UPDATE silver.fx_rate_refresh_request AS req
          SET status = $5,
              locked_at = NOW(),
              retry_count = CASE
                WHEN $6 IS NULL THEN req.retry_count
                ELSE GREATEST(req.retry_count, $6)
              END
        FROM next
        WHERE req.request_id = next.request_id
        RETURNING req.request_id,
                  req.base_currency,
                  req.quote_currency,
                  req.retry_count`,
      [
        requestId,
        FxRateRefreshStatus.PENDING,
        FxRateRefreshStatus.FAILED,
        maxRetries,
        FxRateRefreshStatus.PROCESSING,
        retryCount ?? null,
      ],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async markRequestStatus(
    requestId: string,
    status: FxRateRefreshStatusValue,
    errorMessage: string | null,
  ): Promise<void> {
    await query(
      `UPDATE silver.fx_rate_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = CASE
                WHEN $1 = $3 THEN retry_count
                ELSE 0
              END
        WHERE request_id = $4`,
      [status, errorMessage, FxRateRefreshStatus.FAILED, requestId],
      this.pool,
    )
  }

  async markRequestFailed(
    requestId: string,
    errorMessage: string | null,
    retryCountOverride?: number,
  ): Promise<void> {
    await query(
      `UPDATE silver.fx_rate_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = COALESCE($3, retry_count)
        WHERE request_id = $4`,
      [FxRateRefreshStatus.FAILED, errorMessage, retryCountOverride ?? null, requestId],
      this.pool,
    )
  }

  async retryFailedRequests(minAgeSeconds: number): Promise<number> {
    const result = await query<{ request_id: string }>(
      `UPDATE silver.fx_rate_refresh_request
          SET status = $1,
              error_message = NULL,
              processed_at = NULL,
              locked_at = NULL,
              retry_count = 0
        WHERE status = $2
          AND EXTRACT(EPOCH FROM (NOW() - processed_at)) > $3
        RETURNING request_id`,
      [FxRateRefreshStatus.PENDING, FxRateRefreshStatus.FAILED, minAgeSeconds],
      this.pool,
    )
    return result.rowCount ?? 0
  }

  async getQueueDepth(): Promise<number> {
    const startTime = Date.now()
    const cacheKey = 'fx_rate_refresh_queue_depth'
    let success = false
    let errorType: string | undefined

    try {
      const cached = await queueDepthCache.get<number>(cacheKey)
      if (cached !== null) {
        return cached
      }

      const result = await withCircuitBreaker('fx-rate-refresh', async () => {
        return await withRetry(async () => {
          return await query<{ count: number }>(
            `SELECT COUNT(*)::int AS count
             FROM silver.fx_rate_refresh_request
             WHERE status = $1`,
            [FxRateRefreshStatus.PENDING],
            this.pool,
          )
        })
      })

      const depth = result.rows[0]?.count ?? 0

      await queueDepthCache.set(cacheKey, depth)
      await recordQueueDepthMetric('fx-rate-refresh', depth)
      await triggerQueueDepthCacheRefresh()

      success = true
      return depth
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('queue_depth_get_failed', { error: message })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate-refresh', 'get', durationMs, success, errorType)
    }
  }

  async cleanupRequests(
    statuses: FxRateRefreshStatusValue[],
    olderThanHours: number,
  ): Promise<number> {
    if (statuses.length === 0 || olderThanHours <= 0) return 0

    const result = await query<{ request_id: string }>(
      `DELETE FROM silver.fx_rate_refresh_request
        WHERE status = ANY($1)
          AND processed_at IS NOT NULL
          AND processed_at < NOW() - ($2 * INTERVAL '1 hour')
        RETURNING request_id`,
      [statuses, olderThanHours],
      this.pool,
    )
    return result.rowCount ?? 0
  }
}
