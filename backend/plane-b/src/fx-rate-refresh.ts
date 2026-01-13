import type { Pool } from 'pg'

import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import {
  deleteMessages,
  getQueueDepth as getSqsQueueDepth,
  receiveJsonMessages,
  sendJsonMessage,
} from '../../shared/sqs'
import { fxRateCache, fxRateHistoryCache } from '../../shared/repository-cache'
import { OandaRateFetcher } from '../../shared/oanda-rate-fetcher'
import { FxRateRefreshRepository } from './repositories'
import type { FxRateRefreshRequestRecord } from './repositories/interfaces/fx-rate-refresh-repository.interface'
import { FxRateRefreshStatus, type FxRateRefreshStatusValue } from './repositories/types/fx-rate-refresh-status'

const logger = createLogger('plane-b.fx-rate-refresh')

export type FxRateRefreshQueueEvent = {
  requestId: string
  baseCurrency: string
  quoteCurrency: string
  status: FxRateRefreshStatusValue
  durationSeconds: number
  retryCount: number
  skipReason?: string | null
}

export type FxRateRefreshMessage = {
  requestId: string
  baseCurrency: string
  quoteCurrency: string
}

export type FxRateRefreshQueueOptions = {
  pool?: Pool
  limit?: number
  maxRetries?: number
  concurrency?: number
  onRequestFinished?: (event: FxRateRefreshQueueEvent) => void | Promise<void>
  onQueueDepth?: (depth: number) => void | Promise<void>
}

const checkFxRateFreshness = async (
  pool: Pool,
  baseCurrency: string,
  quoteCurrency: string,
): Promise<{ exists: boolean; isFresh: boolean; ageSeconds: number | null }> => {
  if (baseCurrency === quoteCurrency) {
    return { exists: true, isFresh: true, ageSeconds: 0 }
  }

  const result = await query<{ last_updated: Date | null; updated_at: Date | null }>(
    `SELECT last_updated, updated_at
     FROM gold.fx_rates
     WHERE base_currency = $1 AND quote_currency = $2
     ORDER BY last_updated DESC NULLS LAST, updated_at DESC
     LIMIT 1`,
    [baseCurrency, quoteCurrency],
    pool,
  )

  const row = result.rows[0]
  if (!row) {
    return { exists: false, isFresh: false, ageSeconds: null }
  }

  const lastUpdated = row.last_updated ?? row.updated_at
  if (!lastUpdated) {
    return { exists: true, isFresh: false, ageSeconds: null }
  }

  const freshnessHours = config.fxRates?.dbFreshnessHours ?? 1
  const ageSeconds = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
  const isFresh = ageSeconds <= freshnessHours * 60 * 60

  return { exists: true, isFresh, ageSeconds }
}

const reportQueueDepth = async (
  repo: FxRateRefreshRepository,
  queueUrl: string | null,
  onQueueDepth?: (depth: number) => void | Promise<void>,
) => {
  if (!onQueueDepth) return
  const depth = queueUrl ? await getSqsQueueDepth(queueUrl) : await repo.getQueueDepth()
  await Promise.resolve(onQueueDepth(depth))
}

const logQueueDepths = async (input: {
  repo: FxRateRefreshRepository
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
  if (config.queues.fxRateRefreshUrl && config.queues.fxRateRefreshMode !== 'off') {
    return getSqsQueueDepth(config.queues.fxRateRefreshUrl)
  }
  const repo = new FxRateRefreshRepository(pool)
  return repo.getQueueDepth()
}

const shouldDeleteMessage = (
  status: FxRateRefreshStatusValue,
  retryCount: number,
  maxRetries: number,
): boolean => {
  if (status !== FxRateRefreshStatus.FAILED) {
    return true
  }
  return retryCount >= maxRetries
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const buildRequestFromMessage = (
  payload: FxRateRefreshMessage,
  retryCount: number,
): FxRateRefreshRequestRecord | null => {
  if (!payload.requestId || !payload.baseCurrency || !payload.quoteCurrency) {
    return null
  }

  return {
    request_id: payload.requestId,
    base_currency: payload.baseCurrency.toUpperCase(),
    quote_currency: payload.quoteCurrency.toUpperCase(),
    retry_count: retryCount,
  }
}

const processRequest = async (
  pool: Pool,
  repo: FxRateRefreshRepository,
  fetcher: OandaRateFetcher,
  request: FxRateRefreshRequestRecord,
  maxRetries: number,
  writeDb: boolean,
): Promise<{ status: FxRateRefreshStatusValue; skipReason: string | null }> => {
  let status: FxRateRefreshStatusValue = FxRateRefreshStatus.FAILED
  let skipReason: string | null = null

  try {
    const freshness = await checkFxRateFreshness(
      pool,
      request.base_currency,
      request.quote_currency,
    )

    if (freshness.exists && freshness.isFresh) {
      status = FxRateRefreshStatus.SKIPPED
      skipReason = 'rate_already_fresh'
      if (writeDb) {
        await repo.markRequestStatus(request.request_id, status, skipReason)
      }
      logger.info('queue_item_skipped', {
        request_id: request.request_id,
        reason: skipReason,
        age_seconds: freshness.ageSeconds,
      })
    } else {
      const result = await fetcher.fetchRate(
        request.base_currency,
        request.quote_currency,
        false,
      )
      if (!result.success || !result.data) {
        status = FxRateRefreshStatus.FAILED
        const errorMessage = result.error || 'oanda_fetch_failed'
        if (writeDb) {
          await repo.markRequestFailed(request.request_id, errorMessage, maxRetries)
        }
        logger.warn('queue_item_failed', {
          request_id: request.request_id,
          base_currency: request.base_currency,
          quote_currency: request.quote_currency,
          reason: errorMessage,
        })
      } else {
        status = FxRateRefreshStatus.COMPLETED
        if (writeDb) {
          await repo.markRequestStatus(request.request_id, status, null)
        }
        await fxRateCache.invalidate(`${request.base_currency}:${request.quote_currency}`)
        await fxRateHistoryCache.invalidatePattern(`latest:${request.base_currency}:${request.quote_currency}:*`)
        await fxRateHistoryCache.invalidatePattern(`${request.base_currency}:${request.quote_currency}:*`)
        logger.info('queue_item_done', {
          request_id: request.request_id,
          status,
        })
      }
    }
  } catch (error) {
    status = FxRateRefreshStatus.FAILED
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

export const processFxRateRefreshQueue = async (options: FxRateRefreshQueueOptions = {}) => {
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = !options.pool
  const limit = options.limit ?? 50
  const maxRetries = options.maxRetries ?? 3
  const concurrency = Math.max(1, options.concurrency ?? 5)
  const queueMode = config.queues.fxRateRefreshMode
  const queueUrl = config.queues.fxRateRefreshUrl || null
  const dlqUrl = config.queues.fxRateRefreshDlqUrl || null
  const useQueue = queueMode === 'queue' && Boolean(queueUrl)
  const dbFallbackEnabled = config.queues.fxRateRefreshDbFallback && queueMode === 'queue'
  const writeDb = true
  const repo = new FxRateRefreshRepository(pool)
  const fetcher = new OandaRateFetcher(pool)
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
    requests: FxRateRefreshRequestRecord[],
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
        base_currency: request.base_currency,
        quote_currency: request.quote_currency,
        retry_count: request.retry_count,
        source,
      })

      const { status, skipReason } = await processRequest(
        pool,
        repo,
        fetcher,
        request,
        maxRetries,
        writeDb,
      )

      processed += 1
      const durationSeconds = (Date.now() - requestStart) / 1000
      if (options.onRequestFinished) {
        await Promise.resolve(options.onRequestFinished({
          requestId: request.request_id,
          baseCurrency: request.base_currency,
          quoteCurrency: request.quote_currency,
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
      const messages = await receiveJsonMessages<FxRateRefreshMessage>(queueUrl, limit)
      logger.info('queue_claimed', {
        requested_limit: limit,
        claimed_count: messages.length,
        source: 'sqs',
      })
      await reportQueueDepth(repo, queueUrl, options.onQueueDepth)

      const deleteHandles: string[] = []
      const workItems: Array<{
        requestId: string
        payload: FxRateRefreshMessage
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
        logger.debug('queue_item_start', {
          request_id: request.request_id,
          base_currency: request.base_currency,
          quote_currency: request.quote_currency,
          retry_count: request.retry_count,
          source: 'sqs',
        })

        const { status, skipReason } = await processRequest(
          pool,
          repo,
          fetcher,
          request,
          maxRetries,
          writeDb,
        )

        processed += 1
        const durationSeconds = (Date.now() - requestStart) / 1000
        if (options.onRequestFinished) {
          await Promise.resolve(options.onRequestFinished({
            requestId: request.request_id,
            baseCurrency: request.base_currency,
            quoteCurrency: request.quote_currency,
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

        await reportQueueDepth(repo, queueUrl, options.onQueueDepth)
      })

      logger.info('queue_sqs_processed', {
        message_count: messages.length,
        claimed_count: sqsClaimed,
        delete_count: deleteHandles.length,
      })

      await deleteMessages(queueUrl, deleteHandles)

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
        await processDbRequests(fallbackRequests, 'db_fallback', queueUrl)
      }
    } else {
      if (queueMode === 'queue' && !queueUrl) {
        logger.warn('queue_mode_without_url', { mode: queueMode })
      }
      const requests = await repo.claimPendingRequests(limit, maxRetries)
      const depthQueueUrl = queueMode === 'shadow' ? queueUrl : null
      await processDbRequests(requests, 'db', depthQueueUrl)
    }
  } catch (error) {
    logger.error('queue_processing_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    if (shouldClose) {
      await pool.end()
    }
  }

  return processed
}
