/**
 * LLM Code Map:
 * - export `quotesRoutes(app)`: registers quote endpoints (live + cached).
 * - Core concepts:
 *   - `corridor_id`, `amount_bucket`, `payin`, `payout` drive quote keys.
 *   - Tier-based freshness SLO via `getTierSloMinutes()` and corridor priority overrides.
 * - Caching:
 *   - `latestQuoteCache`: TTL cache for latest quote list responses.
 * - Invariants:
 *   - Enforce max quote age (tier-aware) and hard caps for b2c.
 *   - Normalize provider ids and payment methods before querying.
 */
import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { createHash } from 'crypto'
import { z } from 'zod'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AppError, ValidationError } from '../../../shared/errors'
import { computeBucketSelection, DEFAULT_AMOUNT_BUCKETS } from '../../../shared/amount-bucket'
import { getMaxAmount, getMinAmount } from '../../../shared/currency-limits'
import { parseCorridorId } from '../../../shared/corridor'
import { getCorridorTier, getTierSloMinutes } from '../../../shared/corridor-tiers'
import { getCountryByCode, isCurrencyAllowedForCountry } from '../../../shared/countries-currencies'
import { isWiseDestinationCurrency, isWiseSourceCurrency } from '../../../shared/provider-currencies'
import { createTtlCache } from '../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../shared/business-metrics'
import { normalizePayinMethod, normalizePayoutMethod } from '../../../shared/normalize/payment-methods'
import { normalizeProviderId } from '../../../shared/provider-utils'
import { DEFAULT_FALLBACK_TTL_SECONDS, MAX_B2C_QUOTE_AGE_SECONDS } from '../../../shared/constants'
import { VolatilityService } from '../services/volatility-service'
import { getProviderMetadata } from '../services/provider-metadata'
import type { PlaneAContainer } from '../container'

const logger = createLogger('plane-a.quotes')

const latestQuoteCache = createTtlCache<any[]>({ namespace: 'plane_a:latest_quote' })

const querySchema = z.object({
  corridor_id: z.string().min(1),
  amount_bucket: z.coerce.number().int().optional(),
  amount: z.coerce.number().optional(),
  payin: z.string().min(1),
  payout: z.string().min(1),
  live: z.coerce.boolean().optional(),
})

const refreshStatusSchema = z.object({
  request_ids: z.union([z.string(), z.array(z.string())]),
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sleepWithJitter = async (jitterMs: number) => {
  if (jitterMs <= 0) return
  const delay = Math.floor(Math.random() * jitterMs)
  if (delay > 0) {
    await sleep(delay)
  }
}

const DEFAULT_MAX_QUOTE_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)
const TIER_JITTER_MS: Record<string, number> = {
  tier_1: 0,
  tier_2: 200,
}

const getCorridorMaxAgeSeconds = async (
  corridorPriorityRepository: PlaneAContainer['repositories']['corridorPriority'],
  corridorId: string,
) => {
  try {
    const { priorityTier, freshnessSloMinutes } =
      await corridorPriorityRepository.getPriorityInfo(corridorId)
    const normalizedTier =
      priorityTier === 'tier_1' || priorityTier === 'tier_1_alpha'
        ? 'tier_1'
        : priorityTier === 'tier_2'
          ? 'tier_2'
          : null
    const tier = normalizedTier ?? getCorridorTier(corridorId)
    const tierDefaultMinutes = getTierSloMinutes(tier)
    if (Number.isFinite(freshnessSloMinutes) && Number(freshnessSloMinutes) > 0) {
      const effectiveMinutes = Math.min(Number(freshnessSloMinutes), tierDefaultMinutes)
      const seconds = Math.round(effectiveMinutes * 60)
      return Math.min(seconds, MAX_B2C_QUOTE_AGE_SECONDS)
    }
    return Math.min(tierDefaultMinutes * 60, MAX_B2C_QUOTE_AGE_SECONDS)
  } catch (error) {
    logger.warn('corridor_priority_lookup_failed', {
      corridor_id: corridorId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return Math.min(DEFAULT_MAX_QUOTE_AGE_SECONDS, MAX_B2C_QUOTE_AGE_SECONDS)
}


const getCorridorJitterMs = async (
  corridorPriorityRepository: PlaneAContainer['repositories']['corridorPriority'],
  corridorId: string,
) => {
  try {
    const tier = await corridorPriorityRepository.getPriorityTier(corridorId)
    if (tier && tier in TIER_JITTER_MS) {
      return TIER_JITTER_MS[tier]
    }
  } catch (error) {
    logger.warn('corridor_priority_jitter_failed', {
      corridor_id: corridorId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return config.planeA.b2c.jitterMs
}

const loadSupportedProviderIds = async (
  rightsMatrixRepository: PlaneAContainer['repositories']['rightsMatrix'],
  sourceCountry: string,
  destCountry: string,
): Promise<string[]> => {
  try {
    const rows = await rightsMatrixRepository.listActiveB2cProvidersByCountry(
      sourceCountry,
      destCountry,
    )
    return rows.map((row) => row.provider_id).filter(Boolean)
  } catch (error) {
    logger.warn('supported_provider_lookup_failed', {
      source_country: sourceCountry,
      dest_country: destCountry,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
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

const isCurrencyAllowedForRequest = (
  countryCode: string,
  currency: string,
  direction: 'source' | 'destination',
) => {
  if (isCurrencyAllowedForCountry(countryCode, currency)) return true
  return direction === 'source'
    ? isWiseSourceCurrency(currency)
    : isWiseDestinationCurrency(currency)
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
    return DEFAULT_FALLBACK_TTL_SECONDS
  }
}

const enqueueRefreshRequest = async (
  quoteRefreshRepository: PlaneAContainer['repositories']['quoteRefresh'],
  input: {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
},
) => {
  const requestId = await quoteRefreshRepository.enqueueRequest(input)
  return requestId ?? undefined
}

export const quotesRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container as PlaneAContainer
  const latestQuoteRepository = repositories.latestQuote
  const quoteRefreshRepository = repositories.quoteRefresh
  const rightsMatrixRepository = repositories.rightsMatrix
  const corridorPriorityRepository = repositories.corridorPriority
  const corridorCapabilityRepository = repositories.corridorCapability

  app.get('/quotes/current', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const { corridor_id } = parsed.data
    const payin = normalizePayinMethod(parsed.data.payin)
    const payout = normalizePayoutMethod(parsed.data.payout)
    if (!payin) {
      throw new ValidationError('Invalid payin method', {
        details: [{ message: 'invalid payin method', allowed: ['bank', 'card', 'cash', 'bank_transfer', 'debit_card', 'credit_card', 'apple_pay', 'google_pay'] }],
      })
    }
    if (!payout) {
      throw new ValidationError('Invalid payout method', {
        details: [{ message: 'invalid payout method', allowed: ['bank', 'cash', 'wallet', 'bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'] }],
      })
    }
    const amountBucketInput = parsed.data.amount_bucket
    const amountInput = parsed.data.amount
    const allowLive = parsed.data.live ?? amountInput !== undefined
    const bypassCache = parsed.data.live === true

    const corridorParts = parseCorridorId(corridor_id)
    if (!corridorParts) {
      throw new ValidationError('Invalid corridor_id', { details: [{ message: 'invalid corridor_id' }] })
    }
    const sourceCountry = corridorParts.sourceCountry.toUpperCase()
    const destCountry = corridorParts.destCountry.toUpperCase()
    const sourceCurrency = corridorParts.sourceCurrency.toUpperCase()
    const destCurrency = corridorParts.destCurrency.toUpperCase()
    const defaultDestCurrency = getCountryByCode(destCountry)?.currency?.toUpperCase() ?? null
    const isNonDefaultDestCurrency = Boolean(defaultDestCurrency && destCurrency !== defaultDestCurrency)
    if (!isCurrencyAllowedForRequest(sourceCountry, sourceCurrency, 'source')) {
      throw new ValidationError('Invalid source currency', { details: [{ message: 'invalid source currency' }] })
    }
    if (!isCurrencyAllowedForRequest(destCountry, destCurrency, 'destination')) {
      throw new ValidationError('Invalid destination currency', { details: [{ message: 'invalid destination currency' }] })
    }

    if (amountBucketInput === undefined && amountInput === undefined) {
      throw new ValidationError('amount or amount_bucket is required', { details: [{ message: 'amount or amount_bucket is required' }] })
    }

    if (amountInput !== undefined && !Number.isFinite(amountInput)) {
      throw new ValidationError('amount must be a number', { details: [{ message: 'amount must be a number' }] })
    }

    if (amountBucketInput !== undefined && !Number.isFinite(amountBucketInput)) {
      throw new ValidationError('amount_bucket must be a number', { details: [{ message: 'amount_bucket must be a number' }] })
    }

    const amountForCheck = amountInput ?? amountBucketInput ?? 0
    if (!Number.isFinite(amountForCheck) || amountForCheck <= 0) {
      throw new ValidationError('amount must be a positive number', { details: [{ message: 'amount must be a positive number' }] })
    }

    const minAmount = getMinAmount(sourceCurrency)
    const maxAmount = getMaxAmount(sourceCurrency)
    if (amountForCheck < minAmount) {
      throw new ValidationError(`amount must be >= ${minAmount} ${sourceCurrency}`, {
        details: [{ message: `amount must be >= ${minAmount} ${sourceCurrency}` }],
      })
    }
    if (amountForCheck > maxAmount) {
      throw new ValidationError(`amount must be <= ${maxAmount} ${sourceCurrency}`, {
        details: [{ message: `amount must be <= ${maxAmount} ${sourceCurrency}` }],
      })
    }

    let amount_bucket = amountBucketInput ?? 0

    try {
      const bucketSelection = amountInput !== undefined
        ? computeBucketSelection(amountInput)
        : {
          bucket_used: amountBucketInput ?? 0,
          fee_bucket_used: amountBucketInput ?? 0,
          approximate: false,
          delta_pct: null,
        }
      amount_bucket = bucketSelection.bucket_used

      if (amountBucketInput !== undefined && !DEFAULT_AMOUNT_BUCKETS.includes(amountBucketInput)) {
        throw new ValidationError('amount_bucket must be a supported bucket', {
          details: [{ message: 'amount_bucket must be a supported bucket', allowed_buckets: DEFAULT_AMOUNT_BUCKETS }],
        })
      }

      const maxBucketDeltaPct = Math.max(0, config.planeA.b2c.maxBucketDeltaPct ?? 0)
      if (amountInput !== undefined && maxBucketDeltaPct === 0 && bucketSelection.approximate) {
        throw new ValidationError('amount must match a supported bucket', {
          details: [{
            message: 'amount must match a supported bucket',
            allowed_buckets: DEFAULT_AMOUNT_BUCKETS,
          }],
        })
      }
      if (
        amountInput !== undefined
        && maxBucketDeltaPct > 0
        && bucketSelection.delta_pct !== null
        && bucketSelection.delta_pct > maxBucketDeltaPct
      ) {
        throw new ValidationError('amount too far from supported buckets', {
          details: [{
            message: 'amount too far from supported buckets',
            allowed_buckets: DEFAULT_AMOUNT_BUCKETS,
          }],
        })
      }

      // Get dynamic TTL once before fetching
      const dynamicCacheTtlSeconds = await getDynamicCacheTtl(planeAPool, corridor_id)
      const maxAgeSeconds = await getCorridorMaxAgeSeconds(corridorPriorityRepository, corridor_id)
      const freshnessSeconds = maxAgeSeconds > 0
        ? Math.min(dynamicCacheTtlSeconds, maxAgeSeconds)
        : Math.min(dynamicCacheTtlSeconds, MAX_B2C_QUOTE_AGE_SECONDS)

      const fetchLatest = async (ttlSeconds: number) => {
        if (bypassCache) {
          const rows = await latestQuoteRepository.listLatestByCorridor(
            corridor_id,
            amount_bucket,
            payin,
            payout,
            maxAgeSeconds || undefined,
          )
          if (!Array.isArray(rows)) {
            logger.error('quotes_invalid_response', {
              corridor_id,
              type: typeof rows,
            })
            throw new AppError('Invalid response from database', { statusCode: 500, code: 'database_error' })
          }
          return { rows, rowCount: rows.length, fromCache: false }
        }

        const cacheKey = `${corridor_id}:${amount_bucket}:${payin}:${payout}:${maxAgeSeconds}`
        const cached = await latestQuoteCache.get(cacheKey)
        if (cached !== null) {
          logger.debug('quotes_cache_hit', {
            corridor_id,
            amount_bucket,
            cache_key: cacheKey,
          })
          return { rows: cached, rowCount: cached.length, fromCache: true }
        }

        const rows = await latestQuoteRepository.listLatestByCorridor(
          corridor_id,
          amount_bucket,
          payin,
          payout,
          maxAgeSeconds || undefined,
        )

        if (!Array.isArray(rows)) {
          logger.error('quotes_invalid_response', {
            corridor_id,
            type: typeof rows,
          })
          throw new AppError('Invalid response from database', { statusCode: 500, code: 'database_error' })
        }

        const result = { rows, rowCount: rows.length, fromCache: false }
        if (rows.length > 0) {
          const ttlMs = ttlSeconds * 1000
          await latestQuoteCache.set(cacheKey, result.rows, ttlMs)
        } else {
          const emptyTtlSeconds = Math.min(config.planeA.b2c.latestQuoteCacheTtlSeconds, ttlSeconds)
          if (emptyTtlSeconds > 0) {
            await latestQuoteCache.set(cacheKey, result.rows, emptyTtlSeconds * 1000)
          }
        }
        logger.debug('quotes_cache_miss', {
          corridor_id,
          amount_bucket,
          count: rows.length,
        })
        return result
      }

      const result = await fetchLatest(freshnessSeconds)
      const newestCollectedAt = getNewestCollectedAt(result.rows)
      const cacheAgeSeconds = getCacheAgeSeconds(newestCollectedAt)

      const supportedProviderIds = allowLive
        ? await loadSupportedProviderIds(rightsMatrixRepository, sourceCountry, destCountry)
        : []
      const supportedProviderSet = new Set(
        supportedProviderIds.map(id => normalizeProviderId(id)).filter(Boolean),
      )
      let capabilityProviderIds: string[] = []

      if (allowLive || isNonDefaultDestCurrency) {
        try {
          const capabilityIds = await corridorCapabilityRepository.listSupportedProviderIds(
            corridor_id,
            payin,
            payout,
          )
          capabilityProviderIds = capabilityIds
            .map(id => normalizeProviderId(id))
            .filter(Boolean)
            .filter(id => supportedProviderSet.size === 0 || supportedProviderSet.has(id))
        } catch (error) {
          logger.warn('capability_provider_lookup_failed', {
            corridor_id,
            payin,
            payout,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      if (isNonDefaultDestCurrency && capabilityProviderIds.length === 0) {
        throw new AppError('No providers support this currency for the selected corridor.', {
          statusCode: 404,
          code: 'corridor_unsupported',
          details: { corridor: corridor_id },
        })
      }

      const allowedProviderSet = capabilityProviderIds.length
        ? new Set(capabilityProviderIds)
        : supportedProviderSet

      if (!allowedProviderSet.size) {
        throw new AppError('No providers currently support this corridor.', {
          statusCode: 404,
          code: 'corridor_unsupported',
          details: { corridor: corridor_id },
        })
      }

      result.rows = result.rows.filter((row) => {
        const providerId = row.provider_id ? normalizeProviderId(row.provider_id) : ''
        return providerId && allowedProviderSet.has(providerId)
      })
      result.rowCount = result.rows.length

      const expectedProviders = Array.from(allowedProviderSet)

      const providerCollectedAt = new Map<string, number>()
      for (const row of result.rows) {
        if (!row.provider_id || !row.collected_at) continue
        const providerId = normalizeProviderId(row.provider_id)
        if (!providerId) continue
        const ts = new Date(row.collected_at).getTime()
        if (!Number.isFinite(ts)) continue
        const existing = providerCollectedAt.get(providerId)
        if (!existing || ts > existing) {
          providerCollectedAt.set(providerId, ts)
        }
      }

      const now = Date.now()
      const isProviderFresh = (providerId: string) => {
        const collectedAt = providerCollectedAt.get(providerId)
        if (!collectedAt) return false
        const ageSeconds = Math.round((now - collectedAt) / 1000)
        return ageSeconds <= freshnessSeconds
      }

      const cacheFresh = expectedProviders.length
        ? expectedProviders.every(isProviderFresh)
        : cacheAgeSeconds !== null && cacheAgeSeconds <= freshnessSeconds
      const staleProviders = expectedProviders.filter((providerId) => !isProviderFresh(providerId))

      let refreshAttempted = false
      let refreshEnqueued = false
      let refreshRequestId: string | null = null
      const refreshRequestIds: string[] = []
      let refreshProviderIds: string[] = expectedProviders

      if (allowLive && !cacheFresh && expectedProviders.length > 0) {
        refreshAttempted = true
        const jitterMs = await getCorridorJitterMs(corridorPriorityRepository, corridor_id)
        await sleepWithJitter(jitterMs)
        const refreshTargets = staleProviders.length ? staleProviders : expectedProviders
        refreshProviderIds = refreshTargets
        const refreshRequests = refreshTargets.map((providerId) => ({
          providerId,
          payinMethod: payin,
          payoutMethod: payout,
        }))

        refreshProviderIds = Array.from(
          new Set(refreshRequests.map(request => request.providerId)),
        )
        // Enqueue refresh requests in parallel (non-blocking)
        // Don't await - these are fire-and-forget operations
        const enqueuePromises = refreshRequests.map(async (request) => {
          try {
            const requestId = await enqueueRefreshRequest(quoteRefreshRepository, {
              providerId: request.providerId,
              corridorId: corridor_id,
              amountBucket: amount_bucket,
              payinMethod: request.payinMethod,
              payoutMethod: request.payoutMethod,
            })
            return requestId
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.warn('refresh_enqueue_failed', {
              provider_id: request.providerId,
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
          if (result.status === 'rejected') {
            logger.warn('refresh_enqueue_rejected', {
              corridor_id,
              error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            })
            continue
          }
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
            request_count: refreshRequestIds.length,
            request_ids: refreshRequestIds,
          })
        }
      }

      const requestedAmount = amountInput ?? amountBucketInput ?? bucketSelection.bucket_used
      // Derive availableMethods from actual payout methods in quote rows, not provider IDs
      const methodSet = new Set<string>()
      for (const row of result.rows) {
        if (row.payout) methodSet.add(row.payout)
      }
      const availableMethods = Array.from(methodSet).sort()
      // H11: Do not expose is_admin in the public quotes response — it leaks
      // internal role information to unauthenticated callers.
      const quotesWithAffiliate = result.rows.map((row) => ({
        ...row,
        ...buildAffiliateInfo(row.provider_id),
      }))

      const responsePayload = {
        success: true,
        timestamp: new Date().toISOString(),
        count: result.rowCount,
        requested_amount: requestedAmount,
        bucket_used: bucketSelection.bucket_used,
        bucketUsed: bucketSelection.bucket_used,
        fee_bucket_used: bucketSelection.fee_bucket_used,
        approximate: bucketSelection.approximate,
        bucket_delta_pct: bucketSelection.delta_pct,
        bucketDeltaPct: bucketSelection.delta_pct,
        availableMethods,
        cache: {
          ttl_seconds: freshnessSeconds,
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
        recordSearch(sourceCountry, destCountry)
      } catch (error) {
        logger.debug('quote_metrics_record_failed', {
          corridor_id,
          source_country: sourceCountry,
          dest_country: destCountry,
          error: error instanceof Error ? error.message : String(error),
        })
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
      throw error
    }
  })

  app.get('/quotes/refresh-status', async (request, _reply) => {
    const parsed = refreshStatusSchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const raw = parsed.data.request_ids
    const rawIds = Array.isArray(raw)
      ? raw
      : raw.split(',').map((item) => item.trim())

    const ids = rawIds.filter(Boolean)
    if (!ids.length) {
      throw new ValidationError('request_ids is required', { details: [{ message: 'request_ids is required' }] })
    }

    const invalidIds = ids.filter((id) => !z.string().uuid().safeParse(id).success)
    if (invalidIds.length) {
      throw new ValidationError('invalid request_ids', { details: [{ message: 'invalid request_ids' }] })
    }

    const result = await quoteRefreshRepository.listStatusCounts(ids)

    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
    }

    let found = 0
    for (const row of result) {
      const status = row.status
      const count = row.count ?? 0
      if (status in counts) {
        counts[status as keyof typeof counts] += count
      }
      found += count
    }

    const pendingTotal = counts.pending + counts.processing
    const missing = Math.max(0, ids.length - found)

    return {
      total: ids.length,
      found,
      missing,
      ...counts,
      done: pendingTotal === 0 && missing === 0,
    }
  })
}
