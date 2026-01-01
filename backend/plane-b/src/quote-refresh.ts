import type { Pool } from 'pg'

import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { runRemitlyCollector } from './providers/remitly/collector'
import { runWesternUnionCollector } from './providers/westernunion/collector'
import { runWorldRemitCollector } from './providers/worldremit/collector'
import { runXeCollector } from './providers/xe/collector'
import { runWiseCollector } from './providers/wise/collector'

type RefreshRequest = {
  request_id: string
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin_method: string
  payout_method: string
}

const logger = createLogger('plane-b.quote-refresh')

const claimPendingRequests = async (pool: Pool, limit: number) => {
  const result = await query<RefreshRequest>(
    `WITH next AS (
       SELECT request_id
         FROM silver.quote_refresh_request
        WHERE status = 'pending'
        ORDER BY last_requested_at DESC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
     )
     UPDATE silver.quote_refresh_request
        SET status = 'processing',
            locked_at = NOW()
      WHERE request_id IN (SELECT request_id FROM next)
      RETURNING request_id, provider_id, corridor_id, amount_bucket, payin_method, payout_method`,
    [limit],
    pool,
  )
  return result.rows
}

const markRequest = async (
  pool: Pool,
  requestId: string,
  status: string,
  errorMessage: string | null,
) => {
  await query(
    `UPDATE silver.quote_refresh_request
        SET status = $1,
            processed_at = NOW(),
            error_message = $2
      WHERE request_id = $3`,
    [status, errorMessage, requestId],
    pool,
  )
}

export const processQuoteRefreshQueue = async (options: { pool?: Pool; limit?: number } = {}) => {
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = !options.pool
  const limit = options.limit ?? config.planeB.b2cRefreshBatchLimit
  let processed = 0

  try {
    const requests = await claimPendingRequests(pool, limit)
    logger.info('queue_claimed', { requested_limit: limit, claimed_count: requests.length })
    for (const request of requests) {
      logger.debug('queue_item_start', {
        request_id: request.request_id,
        provider_id: request.provider_id,
        corridor_id: request.corridor_id,
        amount_bucket: request.amount_bucket,
        payin_method: request.payin_method,
        payout_method: request.payout_method,
      })
      try {
        let ok: boolean | null = null
        if (request.provider_id === 'remitly') {
          ok = await runRemitlyCollector({
            pool,
            collectorType: 'b2c_live',
            corridors: [request.corridor_id],
            amountBuckets: [request.amount_bucket],
            payinMethod: request.payin_method,
            payoutMethod: request.payout_method,
          })
        } else if (request.provider_id === 'westernunion') {
          ok = await runWesternUnionCollector({
            pool,
            collectorType: 'b2c_live',
            corridors: [request.corridor_id],
            amountBuckets: [request.amount_bucket],
            payinMethod: request.payin_method,
            payoutMethod: request.payout_method,
          })
        } else if (request.provider_id === 'worldremit') {
          ok = await runWorldRemitCollector({
            pool,
            collectorType: 'b2c_live',
            corridors: [request.corridor_id],
            amountBuckets: [request.amount_bucket],
            payinMethod: request.payin_method,
            payoutMethod: request.payout_method,
          })
        } else if (request.provider_id === 'xe') {
          ok = await runXeCollector({
            pool,
            collectorType: 'b2c_live',
            corridors: [request.corridor_id],
            amountBuckets: [request.amount_bucket],
            payinMethod: request.payin_method,
            payoutMethod: request.payout_method,
          })
        } else if (request.provider_id === 'wise') {
          ok = await runWiseCollector({
            pool,
            collectorType: 'b2c_live',
            corridors: [request.corridor_id],
            amountBuckets: [request.amount_bucket],
            payinMethod: request.payin_method,
            payoutMethod: request.payout_method,
          })
        }

        if (ok === null) {
          await markRequest(pool, request.request_id, 'failed', 'unsupported_provider')
          logger.warn('queue_item_failed', {
            request_id: request.request_id,
            reason: 'unsupported_provider',
            provider_id: request.provider_id,
          })
          processed += 1
          continue
        }

        await markRequest(pool, request.request_id, ok ? 'completed' : 'blocked', ok ? null : 'blocked')
        logger.info('queue_item_done', {
          request_id: request.request_id,
          status: ok ? 'completed' : 'blocked',
        })
      } catch (error) {
        await markRequest(pool, request.request_id, 'failed', (error as Error).message)
        logger.error('queue_item_error', { request_id: request.request_id, error })
      }

      processed += 1
    }
  } finally {
    if (shouldClose) {
      await pool.end()
    }
  }

  logger.info('queue_processed', { processed_count: processed })
  return processed
}
