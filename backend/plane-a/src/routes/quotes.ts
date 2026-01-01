import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { createTtlCache } from '../../../shared/cache'

const planeAPool = getPool(config.db.planeAUrl)

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

const getFxRate = async (baseCurrency: string, quoteCurrency: string) => {
  const cacheKey = `${baseCurrency}:${quoteCurrency}`
  const cached = await fxRateCache.get(cacheKey)
  if (cached !== null) return cached

  const result = await planeAPool.query<{ rate: number }>(
    `SELECT rate FROM gold.fx_rates WHERE base_currency = $1 AND quote_currency = $2`,
    [baseCurrency, quoteCurrency],
  )
  const rate = result.rows[0]?.rate ? Number(result.rows[0].rate) : null
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
  if (direct) {
    return amount * direct
  }

  const inverse = await getFxRate('USD', currency)
  if (inverse) {
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

const enqueueRefreshRequest = async (input: {
  providerId: string
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
}) => {
  const result = await planeAPool.query(
    `INSERT INTO silver.quote_refresh_request
     (provider_id, corridor_id, amount_bucket, payin_method, payout_method, status, requested_at, last_requested_at, request_count)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW(), 1)
     ON CONFLICT (provider_id, corridor_id, amount_bucket, payin_method, payout_method)
     DO UPDATE SET
       status = 'pending',
       last_requested_at = NOW(),
       request_count = silver.quote_refresh_request.request_count + 1
     RETURNING request_id`,
    [input.providerId, input.corridorId, input.amountBucket, input.payinMethod, input.payoutMethod],
  )
  return result.rows?.[0]?.request_id as string | undefined
}

const DEFAULT_B2C_PROVIDERS = ['remitly', 'westernunion', 'worldremit', 'xe', 'wise']

const loadB2cProviders = async () => {
  try {
    const result = await planeAPool.query<{ provider_id: string }>(
      `SELECT provider_id
         FROM silver.rights_matrix
        WHERE allowed_b2c = true
          AND allowed_collect = true
          AND stoplist_status = 'active'`,
    )
    return result.rows.map(row => row.provider_id).filter(Boolean)
  } catch {
    return []
  }
}

export const quotesRoutes = async (app: FastifyInstance) => {
  app.get('/api/quotes/current', async (request, reply) => {
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

    const bucketSelection = amountInput !== undefined
      ? computeBucketSelection(amountInput)
      : {
        bucket_used: amountBucketInput ?? 0,
        fee_bucket_used: amountBucketInput ?? 0,
        approximate: false,
      }
    const amount_bucket = bucketSelection.bucket_used

    const fetchLatest = async () => {
      const cacheKey = `${corridor_id}:${amount_bucket}:${payin}:${payout}`
      const cached = await latestQuoteCache.get(cacheKey)
      if (cached !== null) {
        return { rows: cached, rowCount: cached.length }
      }

      const result = await planeAPool.query(
      `SELECT provider_id,
              corridor_id,
              amount_bucket,
              payin,
              payout,
              payin AS payin_method,
              payout AS payout_method,
              delivery_time_min_minutes,
              delivery_time_max_minutes,
              collected_at,
              send_amount,
              fee_amount,
              promotional_fee_amount,
              receive_amount,
              implied_fx_rate,
              promotional_rate,
              base_rate,
              promotional_cap_amount,
              quality_flags,
              updated_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = $1
          AND amount_bucket = $2
          AND payin = $3
          AND payout = $4
        ORDER BY receive_amount DESC, fee_amount ASC`,
      [corridor_id, amount_bucket, payin, payout],
    )
      const ttlMs = config.planeA.b2c.latestQuoteCacheTtlSeconds * 1000
      await latestQuoteCache.set(cacheKey, result.rows, ttlMs)
      return result
    }

    let result = await fetchLatest()
    const cacheTtlSeconds = config.planeA.b2c.cacheTtlSeconds
    let newestCollectedAt = getNewestCollectedAt(result.rows)
    let cacheAgeSeconds = getCacheAgeSeconds(newestCollectedAt)
    let cacheFresh = cacheAgeSeconds !== null && cacheAgeSeconds <= cacheTtlSeconds

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
      for (const providerId of refreshProviderIds) {
        const requestId = await enqueueRefreshRequest({
          providerId,
          corridorId: corridor_id,
          amountBucket: amount_bucket,
          payinMethod: payin,
          payoutMethod: payout,
        })
        if (requestId) {
          refreshRequestIds.push(requestId)
        }
      }
      refreshRequestId = refreshRequestIds[0] ?? null
      refreshEnqueued = refreshRequestIds.length > 0
    }

    const requestedAmount = amountInput ?? amountBucketInput ?? bucketSelection.bucket_used
    const responsePayload = {
      success: true,
      timestamp: new Date().toISOString(),
      count: result.rowCount,
      requested_amount: requestedAmount,
      bucket_used: bucketSelection.bucket_used,
      fee_bucket_used: bucketSelection.fee_bucket_used,
      approximate: bucketSelection.approximate,
      cache: {
        ttl_seconds: cacheTtlSeconds,
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
      quotes: result.rows,
    }

    const cachePayload = JSON.stringify(responsePayload)
    const etag = `"${createHash('sha256').update(cachePayload).digest('hex')}"`
    reply.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    reply.header('ETag', etag)
    if (request.headers['if-none-match'] === etag) {
      reply.code(304)
      return ''
    }

    return responsePayload
  })
}
