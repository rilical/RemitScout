import type { Pool } from 'pg'

import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import {
  deleteMessages,
  getQueueDepth as getSqsQueueDepth,
  receiveJsonMessages,
  sendJsonMessage,
} from '../../shared/sqs'
import { getProvider } from './providers'
import { LatestQuoteRepository, QuoteRefreshRepository } from './repositories'
import type { QuoteRefreshRequestRecord } from './repositories/interfaces/quote-refresh-repository.interface'
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

export type QuoteRefreshMessage = {
  requestId: string
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
}

export type QuoteRefreshQueueOptions = {
  pool?: Pool
  limit?: number
  maxRetries?: number
  concurrency?: number
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
  queueUrl: string | null,
  onQueueDepth?: (depth: number) => void | Promise<void>,
) => {
  if (!onQueueDepth) return
  const depth = queueUrl ? await getSqsQueueDepth(queueUrl) : await repo.getQueueDepth()
  await Promise.resolve(onQueueDepth(depth))
}

const logQueueDepths = async (input: {
  repo: QuoteRefreshRepository
  queueUrl: string | null
  dlqUrl: string | null
  queueMode: string
  dbFallbackEnabled: boolean
}) => {
  const [dbDepth, sqsDepth, dlqDepth] = await Promise.all([
    input.repo.getQueueDepth(),
    input.queueUrl ? getSqsQueueDepth(input.queueUrl) : Promise.resolve(null),
    input.dlqUrl ? getSqsQueueDepth(input.dlqUrl) : Promise.resolve(null),
  ])

  logger.info('queue_depths', {
    queue_mode: input.queueMode,
    db_fallback_enabled: input.dbFallbackEnabled,
    db_depth: dbDepth,
    sqs_depth: sqsDepth,
    dlq_depth: dlqDepth,
  })
}

export const getQueueDepth = async (pool: Pool): Promise<number> => {
  if (config.queues.quoteRefreshUrl && config.queues.quoteRefreshMode !== 'off') {
    return getSqsQueueDepth(config.queues.quoteRefreshUrl)
  }
  const repo = new QuoteRefreshRepository(pool)
  return repo.getQueueDepth()
}

const shouldDeleteMessage = (
  status: QuoteRefreshStatusValue,
  retryCount: number,
  maxRetries: number,
): boolean => {
  if (status !== QuoteRefreshStatus.FAILED) {
    return true
  }
  return retryCount >= maxRetries
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const buildRequestFromMessage = (
  payload: QuoteRefreshMessage,
  retryCount: number,
): QuoteRefreshRequestRecord | null => {
  if (
    !payload.requestId ||
    !payload.providerId ||
    !payload.corridorId ||
    typeof payload.amountBucket !== 'number' ||
    !payload.payinMethod ||
    !payload.payoutMethod
  ) {
    return null
  }

  return {
    request_id: payload.requestId,
    provider_id: payload.providerId,
    corridor_id: payload.corridorId,
    amount_bucket: payload.amountBucket,
    payin_method: payload.payinMethod,
    payout_method: payload.payoutMethod,
    retry_count: retryCount,
  }
}

const processRequest = async (
  pool: Pool,
  repo: QuoteRefreshRepository,
  request: QuoteRefreshRequestRecord,
  maxRetries: number,
  writeDb: boolean,
): Promise<{ status: QuoteRefreshStatusValue; skipReason: string | null }> => {
  let status: QuoteRefreshStatusValue = QuoteRefreshStatus.FAILED
  let skipReason: string | null = null
  let freshnessAgeSeconds: number | null = null

  try {
    const freshness = await checkQuoteFreshness(
      pool,
      request.corridor_id,
      request.amount_bucket,
      request.payin_method,
      request.payout_method,
      request.provider_id,
    )
    freshnessAgeSeconds = freshness.ageSeconds

    if (freshness.exists && freshness.isFresh) {
      status = QuoteRefreshStatus.SKIPPED
      skipReason = 'quote_already_fresh'
      if (writeDb) {
        await repo.markRequestStatus(request.request_id, status, skipReason)
      }
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
        if (writeDb) {
          await repo.markRequestFailed(request.request_id, errorMessage, maxRetries)
        }
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
          rpmOverride: config.planeB.b2cLiveRpm > 0 ? config.planeB.b2cLiveRpm : undefined,
          perCorridorRpmOverride:
            config.planeB.b2cLivePerCorridorRpm > 0
              ? config.planeB.b2cLivePerCorridorRpm
              : undefined,
        })
        status = ok ? QuoteRefreshStatus.COMPLETED : QuoteRefreshStatus.BLOCKED
        if (writeDb) {
          await repo.markRequestStatus(request.request_id, status, ok ? null : 'blocked')
        }
        logger.info('queue_item_done', {
          request_id: request.request_id,
          status,
        })
      }
    }
  } catch (error) {
    status = QuoteRefreshStatus.FAILED
    if (writeDb) {
      await repo.markRequestFailed(
        request.request_id,
        error instanceof Error ? error.message : String(error),
      )
    }
    logger.error('queue_item_error', { request_id: request.request_id, error })
  }

  return { status, skipReason }
}

export const processQuoteRefreshQueue = async (options: QuoteRefreshQueueOptions = {}) => {
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = !options.pool
  const limit = options.limit ?? config.planeB.b2cRefreshBatchLimit
  const maxRetries = options.maxRetries ?? config.planeB.b2cRefreshMaxRetries
  const concurrency = Math.max(1, options.concurrency ?? config.planeB.b2cRefreshConcurrency)
  const queueMode = config.queues.quoteRefreshMode
  const queueUrl = config.queues.quoteRefreshUrl || null
  const dlqUrl = config.queues.quoteRefreshDlqUrl || null
  const useQueue = queueMode === 'queue' && Boolean(queueUrl)
  const activeQueueUrl = useQueue ? (queueUrl as string) : null
  const dbFallbackEnabled = config.queues.quoteRefreshDbFallback && queueMode === 'queue'
  // Always update DB statuses so refresh-status can track SQS-backed runs.
  const writeDb = true
  const repo = new QuoteRefreshRepository(pool)
  let processed = 0

  const runWithConcurrency = async <T>(
    items: T[],
    worker: (item: T) => Promise<void>,
  ) => {
    let index = 0
    const workerCount = Math.min(concurrency, items.length)
    const workers = Array.from({ length: workerCount }, async () => {
      while (index < items.length) {
        const current = items[index]
        index += 1
        await worker(current)
      }
    })
    await Promise.all(workers)
  }

  const processDbRequests = async (
    requests: QuoteRefreshRequestRecord[],
    source: 'db' | 'db_fallback',
    depthQueueUrl: string | null,
  ) => {
    logger.info('queue_claimed', {
      requested_limit: limit,
      claimed_count: requests.length,
      source,
    })
    await reportQueueDepth(repo, depthQueueUrl, options.onQueueDepth)

    await runWithConcurrency(requests, async (request) => {
      const requestStart = Date.now()

      logger.debug('queue_item_start', {
        request_id: request.request_id,
        provider_id: request.provider_id,
        corridor_id: request.corridor_id,
        amount_bucket: request.amount_bucket,
        payin_method: request.payin_method,
        payout_method: request.payout_method,
        retry_count: request.retry_count,
        source,
      })

      const { status, skipReason } = await processRequest(
        pool,
        repo,
        request,
        maxRetries,
        writeDb,
      )

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
      await reportQueueDepth(repo, depthQueueUrl, options.onQueueDepth)
    })
  }

  try {
    await logQueueDepths({
      repo,
      queueUrl,
      dlqUrl,
      queueMode,
      dbFallbackEnabled,
    })

    if (useQueue) {
      if (!activeQueueUrl) {
        throw new Error('quote_refresh_queue_missing')
      }
      const messages = await receiveJsonMessages<QuoteRefreshMessage>(activeQueueUrl, limit)
      logger.info('queue_claimed', {
        requested_limit: limit,
        claimed_count: messages.length,
        source: 'sqs',
      })
      await reportQueueDepth(repo, activeQueueUrl, options.onQueueDepth)

      const deleteHandles: string[] = []
      const workItems: Array<{
        requestId: string
        payload: QuoteRefreshMessage
        receiptHandle: string
        retryCount: number
      }> = []
      const preTasks: Array<Promise<void>> = []
      let sqsClaimed = 0

      for (const message of messages) {
        const retryCount = Math.max(
          0,
          toNumber(message.attributes.ApproximateReceiveCount, 1) - 1,
        )
        if (!message.payload) {
          logger.warn('queue_item_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const request = buildRequestFromMessage(message.payload, retryCount)
        if (!request) {
          logger.warn('queue_item_invalid', {
            message_id: message.messageId,
            payload: message.payload,
          })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        if (retryCount >= maxRetries) {
          preTasks.push((async () => {
            if (writeDb) {
              await repo.markRequestFailed(request.request_id, 'max_retries_exceeded', retryCount)
            }
            logger.warn('queue_item_max_retries', {
              request_id: request.request_id,
              retry_count: retryCount,
            })
            if (dlqUrl && message.payload) {
              try {
                await sendJsonMessage(dlqUrl, {
                  ...message.payload,
                  failedAt: new Date().toISOString(),
                  retryCount,
                  failureReason: 'max_retries_exceeded',
                })
                logger.info('queue_item_dlq_sent', {
                  request_id: request.request_id,
                  retry_count: retryCount,
                })
              } catch (error) {
                logger.warn('queue_item_dlq_failed', {
                  request_id: request.request_id,
                  retry_count: retryCount,
                  error: error instanceof Error ? error.message : String(error),
                })
              }
            }
          })())
          deleteHandles.push(message.receiptHandle)
          continue
        }

        workItems.push({
          requestId: request.request_id,
          payload: message.payload,
          receiptHandle: message.receiptHandle,
          retryCount,
        })
      }

      if (preTasks.length) {
        await Promise.all(preTasks)
      }

      await runWithConcurrency(workItems, async (item) => {
        const requestStart = Date.now()
        const retryCount = item.retryCount
        const request = await repo.claimRequestById(
          item.requestId,
          maxRetries,
          retryCount,
        )

        if (!request) {
          logger.info('queue_item_unclaimed', {
            request_id: item.requestId,
            retry_count: retryCount,
            source: 'sqs',
          })
          deleteHandles.push(item.receiptHandle)
          return
        }

        sqsClaimed += 1
        if (item.payload.providerId && item.payload.providerId !== request.provider_id) {
          logger.warn('queue_item_mismatch', {
            request_id: request.request_id,
            payload_provider: item.payload.providerId,
            db_provider: request.provider_id,
            source: 'sqs',
          })
        }

        logger.debug('queue_item_start', {
          request_id: request.request_id,
          provider_id: request.provider_id,
          corridor_id: request.corridor_id,
          amount_bucket: request.amount_bucket,
          payin_method: request.payin_method,
          payout_method: request.payout_method,
          retry_count: request.retry_count,
          source: 'sqs',
        })

        const { status, skipReason } = await processRequest(
          pool,
          repo,
          request,
          maxRetries,
          writeDb,
        )

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

        if (shouldDeleteMessage(status, retryCount, maxRetries)) {
          deleteHandles.push(item.receiptHandle)
        } else {
          logger.info('queue_item_retry_scheduled', {
            request_id: request.request_id,
            retry_count: retryCount,
          })
        }

        await reportQueueDepth(repo, activeQueueUrl, options.onQueueDepth)
      })

      logger.info('queue_sqs_processed', {
        message_count: messages.length,
        claimed_count: sqsClaimed,
        delete_count: deleteHandles.length,
      })

      await deleteMessages(activeQueueUrl, deleteHandles)

      if (dbFallbackEnabled) {
        const fallbackRequests = await repo.claimPendingRequests(limit, maxRetries)
        if (fallbackRequests.length > 0) {
          logger.info('queue_fallback_claimed', {
            requested_limit: limit,
            claimed_count: fallbackRequests.length,
            source: 'db_fallback',
            sqs_claimed_count: sqsClaimed,
            sqs_message_count: messages.length,
          })
        }
        await processDbRequests(fallbackRequests, 'db_fallback', activeQueueUrl)
      }
    } else {
      if (queueMode === 'queue' && !queueUrl) {
        logger.warn('queue_mode_without_url', { mode: queueMode })
      }
      const requests = await repo.claimPendingRequests(limit, maxRetries)
      const depthQueueUrl = queueMode === 'shadow' ? queueUrl : null
      await processDbRequests(requests, 'db', depthQueueUrl)
    }
  } finally {
    if (shouldClose) {
      await pool.end()
    }
  }

  logger.info('queue_processed', { processed_count: processed })
  return processed
}
