import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { createHash } from 'crypto'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { createTtlCache } from '../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../shared/business-metrics'
import { VolatilityService } from '../services/volatility-service'
import { getProviderMetadata } from '../services/provider-metadata'
import {
  FxRateRepository,
  LatestQuoteRepository,
  QuoteRefreshRepository,
  RightsMatrixRepository,
} from '../repositories'

const logger = createLogger('plane-a.quotes')

const planeAPool = getPool(config.db.planeAUrl)
const fxRateRepository = new FxRateRepository(planeAPool)
const latestQuoteRepository = new LatestQuoteRepository(planeAPool)
const quoteRefreshRepository = new QuoteRefreshRepository(planeAPool)
const rightsMatrixRepository = new RightsMatrixRepository(planeAPool)

const fxRateCache = createTtlCache<number>({ namespace: 'plane_a:fx_rate' })
const latestQuoteCache = createTtlCache<any[]>({ namespace: 'plane_a:latest_quote' })

const querySchema = z.object({
  corridor_id: z.string().min(1),
  amount_bucket: z.coerce.number().int().optional(),
  amount: z.coerce.number().optional(),
  payin: z.string().min(1),
  payout: z.string().min(1),
  live: z.coerce.boolean().optional(),
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sleepWithJitter = async (jitterMs: number) => {
  if (jitterMs <= 0) return
  const delay = Math.floor(Math.random() * jitterMs)
  if (delay > 0) {
    await sleep(delay)
  }
}

const MIN_SEND_AMOUNT = 50
const MAX_QUOTE_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)

const getFxRate = async (baseCurrency: string, quoteCurrency: string) => {
  const cacheKey = `${baseCurrency}:${quoteCurrency}`
  const cached = await fxRateCache.get(cacheKey)
  if (cached !== null) return cached

  const rate = await fxRateRepository.getRate(baseCurrency, quoteCurrency)
  if (rate && Number.isFinite(rate)) {
    const ttlMs = config.planeA.b2c.fxRateCacheTtlSeconds * 1000
    await fxRateCache.set(cacheKey, rate, ttlMs)
    return rate
  }
  return null
}

const getUsdEquivalent = async (amount: number, currency: string) => {
  if (!Number.isFinite(amount)) return null
  if (currency === 'USD') return amount

  const direct = await getFxRate(currency, 'USD')
  if (direct && direct !== 0 && Number.isFinite(direct)) {
    return amount * direct
  }

  const inverse = await getFxRate('USD', currency)
  if (inverse && inverse !== 0 && Number.isFinite(inverse)) {
    return amount / inverse
  }

  return null
}

const getNewestCollectedAt = (rows: Array<{ collected_at: string | Date | null }>) => {
  let newest = 0
  for (const row of rows) {
    if (!row.collected_at) continue
    const ts = new Date(row.collected_at).getTime()
    if (Number.isFinite(ts) && ts > newest) {
      newest = ts
    }
  }
  return newest
}

const getCacheAgeSeconds = (newestCollectedAt: number) => {
  if (!newestCollectedAt) return null
  return Math.max(0, Math.round((Date.now() - newestCollectedAt) / 1000))
}

const buildAffiliateInfo = (providerId: string) => {
  const metadata = getProviderMetadata(providerId)
  if (!metadata) {
    return {
      provider_url: null,
      affiliate_url: null,
      is_affiliate: false,
      outbound_url: null,
    }
  }

  const affiliateUrl = metadata.affiliateUrl ?? null
  const isAffiliate = Boolean(affiliateUrl) || metadata.isAffiliate
  return {
    provider_url: metadata.url,
    affiliate_url: affiliateUrl,
    is_affiliate: isAffiliate,
    outbound_url: affiliateUrl ?? metadata.url,
  }
}

const getDynamicCacheTtl = async (pool: Pool, corridorId: string): Promise<number> => {
  try {
    const volatilityService = new VolatilityService(pool)
    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)
    return ttlResult.ttlSeconds
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.warn('volatility_service_failed', {
      corridor_id: corridorId,
      error: errorMessage,
    })
    // Fallback to default TTL (1 hour = 3600 seconds)
    return 3600
  }
}

const enqueueRefreshRequest = async (input: {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
}) => {
  const requestId = await quoteRefreshRepository.enqueueRequest(input)
  return requestId ?? undefined
}

const DEFAULT_B2C_PROVIDERS = ['remitly', 'westernunion', 'worldremit', 'xe', 'wise']

const loadB2cProviders = async () => {
  try {
    const rows = await rightsMatrixRepository.listActiveB2cProviders()
    return rows.map(row => row.provider_id).filter(Boolean)
  } catch {
    return []
  }
}

export const quotesRoutes = async (app: FastifyInstance) => {
  app.get('/quotes/current', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { corridor_id, payin, payout } = parsed.data
    const amountBucketInput = parsed.data.amount_bucket
    const amountInput = parsed.data.amount
    const allowLive = parsed.data.live ?? amountInput !== undefined

    const corridorParts = parseCorridorId(corridor_id)
    if (!corridorParts) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'invalid corridor_id' }] }
    }

    if (amountBucketInput === undefined && amountInput === undefined) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'amount or amount_bucket is required' }] }
    }

    if (amountInput !== undefined && !Number.isFinite(amountInput)) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'amount must be a number' }] }
    }

    if (amountBucketInput !== undefined && !Number.isFinite(amountBucketInput)) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'amount_bucket must be a number' }] }
    }

    const amountForCheck = amountInput ?? amountBucketInput ?? 0
    const usdEquivalent = await getUsdEquivalent(amountForCheck, corridorParts.sourceCurrency)
    if (usdEquivalent === null) {
      reply.code(503)
      return { error: 'fx_unavailable', details: [{ message: 'USD conversion unavailable' }] }
    }

    if (usdEquivalent < MIN_SEND_AMOUNT) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: `amount must be >= ${MIN_SEND_AMOUNT} USD equivalent` }] }
    }

    let amount_bucket = amountBucketInput ?? 0

    try {
      const bucketSelection = amountInput !== undefined
        ? computeBucketSelection(amountInput)
        : {
          bucket_used: amountBucketInput ?? 0,
          fee_bucket_used: amountBucketInput ?? 0,
          approximate: false,
        }
      amount_bucket = bucketSelection.bucket_used

      // Get dynamic TTL once before fetching
      const dynamicCacheTtlSeconds = await getDynamicCacheTtl(planeAPool, corridor_id)

      const fetchLatest = async (ttlSeconds: number) => {
        const cacheKey = `${corridor_id}:${amount_bucket}:${payin}:${payout}`
        const cached = await latestQuoteCache.get(cacheKey)
        if (cached !== null) {
          logger.debug('quotes_cache_hit', {
            corridor_id,
            amount_bucket,
            cache_key: cacheKey,
          })
          return { rows: cached, rowCount: cached.length }
        }

        const rows = await latestQuoteRepository.listLatestByCorridor(
          corridor_id,
          amount_bucket,
          payin,
          payout,
          MAX_QUOTE_AGE_SECONDS || undefined,
        )

        if (!Array.isArray(rows)) {
          logger.error('quotes_invalid_response', {
            corridor_id,
            type: typeof rows,
          })
          throw new Error('Invalid response from database')
        }

        const result = { rows, rowCount: rows.length }
        const ttlMs = ttlSeconds * 1000
        await latestQuoteCache.set(cacheKey, result.rows, ttlMs)
        logger.debug('quotes_cache_miss', {
          corridor_id,
          amount_bucket,
          count: rows.length,
        })
        return result
      }

      let result = await fetchLatest(dynamicCacheTtlSeconds)
      let newestCollectedAt = getNewestCollectedAt(result.rows)
      let cacheAgeSeconds = getCacheAgeSeconds(newestCollectedAt)
      let cacheFresh = cacheAgeSeconds !== null && cacheAgeSeconds <= dynamicCacheTtlSeconds

    let refreshAttempted = false
    let refreshEnqueued = false
    let refreshRequestId: string | null = null
    let refreshRequestIds: string[] = []
    let refreshProviderIds: string[] = []

    if (allowLive && !cacheFresh) {
      refreshAttempted = true
      await sleepWithJitter(config.planeA.b2c.jitterMs)
      const providerIds = new Set(
        result.rows.map(row => row.provider_id).filter(Boolean),
      )
      if (providerIds.size === 0) {
        const fallbackProviders = await loadB2cProviders()
        if (!fallbackProviders.length) {
          fallbackProviders.push(...DEFAULT_B2C_PROVIDERS)
        }
        for (const providerId of fallbackProviders) {
          providerIds.add(providerId)
        }
      }
      refreshProviderIds = Array.from(providerIds)
      // Enqueue refresh requests in parallel (non-blocking)
      // Don't await - these are fire-and-forget operations
      const enqueuePromises = refreshProviderIds.map(async (providerId) => {
        try {
          const requestId = await enqueueRefreshRequest({
            providerId,
            corridorId: corridor_id,
            amountBucket: amount_bucket,
            payinMethod: payin,
            payoutMethod: payout,
          })
          return requestId
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.warn('refresh_enqueue_failed', {
            provider_id: providerId,
            corridor_id,
            error: errorMessage,
          })
          return null
        }
      })
      
      // Wait for all enqueue operations to complete (but don't block response)
      // Use Promise.allSettled to handle partial failures gracefully
      const enqueueResults = await Promise.allSettled(enqueuePromises)
      for (const result of enqueueResults) {
        if (result.status === 'fulfilled' && result.value) {
          refreshRequestIds.push(result.value)
        }
      }
      refreshRequestId = refreshRequestIds[0] ?? null
      refreshEnqueued = refreshRequestIds.length > 0

      if (refreshEnqueued) {
        logger.info('quotes_refresh_enqueued', {
          corridor_id,
          amount_bucket,
          provider_count: refreshProviderIds.length,
          request_ids: refreshRequestIds,
        })
      }
    }

    const requestedAmount = amountInput ?? amountBucketInput ?? bucketSelection.bucket_used
    const isAdmin =
      request.user?.role === 'admin' ||
      request.user?.role === 'super_admin' ||
      (request.user?.email &&
        config.planeA.adminEmails.includes(request.user.email.toLowerCase()))
    const quotesWithAffiliate = result.rows.map((row) => ({
      ...row,
      ...buildAffiliateInfo(row.provider_id),
      is_admin: Boolean(isAdmin),
    }))

    const responsePayload = {
      success: true,
      timestamp: new Date().toISOString(),
      count: result.rowCount,
      requested_amount: requestedAmount,
      bucket_used: bucketSelection.bucket_used,
      fee_bucket_used: bucketSelection.fee_bucket_used,
      approximate: bucketSelection.approximate,
      cache: {
        ttl_seconds: dynamicCacheTtlSeconds,
        age_seconds: cacheAgeSeconds,
        fresh: cacheFresh,
      },
      refresh: {
        attempted: refreshAttempted,
        enqueued: refreshEnqueued,
        request_id: refreshRequestId,
        request_ids: refreshRequestIds,
        providers: refreshProviderIds,
      },
      quotes: quotesWithAffiliate,
    }

    const cachePayload = JSON.stringify(responsePayload)
    const etag = `"${createHash('sha256').update(cachePayload).digest('hex')}"`
    reply.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    reply.header('ETag', etag)

    const clientEtag = request.headers['if-none-match']
    if (clientEtag && clientEtag.toLowerCase() === etag.toLowerCase()) {
      logger.debug('quotes_cache_hit', { etag })
      reply.code(304)
      return ''
    }

    try {
      recordQuoteRequest(corridor_id, amount_bucket)
      recordSearch(corridorParts.sourceCountry, corridorParts.destCountry)
    } catch {
      // Silently ignore metrics errors
    }

    logger.debug('quotes_request_success', {
      corridor_id,
      amount_bucket,
      count: result.rowCount,
      cache_fresh: cacheFresh,
      refresh_enqueued: refreshEnqueued,
    })

    return responsePayload
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      logger.error('quotes_request_failed', {
        corridor_id,
        amount_bucket,
        error: errorMessage,
        stack: errorStack,
      })
      reply.code(500)
      return {
        error: 'internal_error',
        message: 'Failed to fetch quotes',
      }
    }
  })
}
