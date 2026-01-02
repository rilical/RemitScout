import type { Pool } from 'pg'

import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { getProvider } from './providers'
import { LatestQuoteRepository, QuoteRefreshRepository } from './repositories'
import { QuoteRefreshStatus, type QuoteRefreshStatusValue } from './repositories/types/quote-refresh-status'
import { VolatilityService } from './services/volatility-service'

const logger = createLogger('plane-b.quote-refresh')

export type QuoteRefreshQueueEvent = {
  requestId: string
  providerId: string
  status: QuoteRefreshStatusValue
  durationSeconds: number
  retryCount: number
  skipReason?: string | null
}

export type QuoteRefreshQueueOptions = {
  pool?: Pool
  limit?: number
  maxRetries?: number
  onRequestFinished?: (event: QuoteRefreshQueueEvent) => void | Promise<void>
  onQueueDepth?: (depth: number) => void | Promise<void>
}

const checkQuoteFreshness = async (
  pool: Pool,
  corridorId: string,
  amountBucket: number,
  payinMethod: string,
  payoutMethod: string,
  providerId: string,
): Promise<{ exists: boolean; isFresh: boolean; ageSeconds: number | null }> => {
  const volatilityService = new VolatilityService(pool)
  const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)

  const latestRepo = new LatestQuoteRepository(pool)
  const collectedAt = await latestRepo.getLatestCollectedAt(
    corridorId,
    amountBucket,
    payinMethod,
    payoutMethod,
    providerId,
  )
  if (!collectedAt) {
    return { exists: false, isFresh: false, ageSeconds: null }
  }

  const ageSeconds = Math.floor((Date.now() - new Date(collectedAt).getTime()) / 1000)
  const isFresh = ageSeconds <= ttlResult.ttlSeconds

  return { exists: true, isFresh, ageSeconds }
}

const reportQueueDepth = async (
  repo: QuoteRefreshRepository,
  onQueueDepth?: (depth: number) => void | Promise<void>,
) => {
  if (!onQueueDepth) return
  const depth = await repo.getQueueDepth()
  await Promise.resolve(onQueueDepth(depth))
}

export const getQueueDepth = async (pool: Pool): Promise<number> => {
  const repo = new QuoteRefreshRepository(pool)
  return repo.getQueueDepth()
}

export const processQuoteRefreshQueue = async (options: QuoteRefreshQueueOptions = {}) => {
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = !options.pool
  const limit = options.limit ?? config.planeB.b2cRefreshBatchLimit
  const maxRetries = options.maxRetries ?? config.planeB.b2cRefreshMaxRetries
  const repo = new QuoteRefreshRepository(pool)
  let processed = 0

  try {
    const requests = await repo.claimPendingRequests(limit, maxRetries)
    logger.info('queue_claimed', { requested_limit: limit, claimed_count: requests.length })
    await reportQueueDepth(repo, options.onQueueDepth)

    for (const request of requests) {
      const requestStart = Date.now()
      let status: QuoteRefreshStatusValue = QuoteRefreshStatus.FAILED
      let skipReason: string | null = null

      logger.debug('queue_item_start', {
        request_id: request.request_id,
        provider_id: request.provider_id,
        corridor_id: request.corridor_id,
        amount_bucket: request.amount_bucket,
        payin_method: request.payin_method,
        payout_method: request.payout_method,
        retry_count: request.retry_count,
      })

      try {
        const freshness = await checkQuoteFreshness(
          pool,
          request.corridor_id,
          request.amount_bucket,
          request.payin_method,
          request.payout_method,
          request.provider_id,
        )

        if (freshness.exists && freshness.isFresh) {
          status = QuoteRefreshStatus.SKIPPED
          skipReason = 'quote_already_fresh'
          await repo.markRequestStatus(request.request_id, status, skipReason)
          logger.info('queue_item_skipped', {
            request_id: request.request_id,
            reason: skipReason,
            age_seconds: freshness.ageSeconds,
          })
        } else {
          const provider = getProvider(request.provider_id)
          if (!provider) {
            status = QuoteRefreshStatus.FAILED
            const errorMessage = 'unsupported_provider'
            await repo.markRequestFailed(request.request_id, errorMessage, maxRetries)
            logger.warn('queue_item_failed', {
              request_id: request.request_id,
              reason: errorMessage,
              provider_id: request.provider_id,
            })
          } else {
            const ok = await provider.run({
              pool,
              collectorType: 'b2c_live',
              corridors: [request.corridor_id],
              amountBuckets: [request.amount_bucket],
              payinMethod: request.payin_method,
              payoutMethod: request.payout_method,
            })

            status = ok ? QuoteRefreshStatus.COMPLETED : QuoteRefreshStatus.BLOCKED
            await repo.markRequestStatus(request.request_id, status, ok ? null : 'blocked')
            logger.info('queue_item_done', {
              request_id: request.request_id,
              status,
            })
          }
        }
      } catch (error) {
        status = QuoteRefreshStatus.FAILED
        await repo.markRequestFailed(
          request.request_id,
          error instanceof Error ? error.message : String(error),
        )
        logger.error('queue_item_error', { request_id: request.request_id, error })
      } finally {
        processed += 1
        const durationSeconds = (Date.now() - requestStart) / 1000
        if (options.onRequestFinished) {
          await Promise.resolve(options.onRequestFinished({
            requestId: request.request_id,
            providerId: request.provider_id,
            status,
            durationSeconds,
            retryCount: request.retry_count,
            skipReason,
          }))
        }
        await reportQueueDepth(repo, options.onQueueDepth)
      }
    }
  } finally {
    if (shouldClose) {
      await pool.end()
    }
  }

  logger.info('queue_processed', { processed_count: processed })
  return processed
}
