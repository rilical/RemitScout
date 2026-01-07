import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection, DEFAULT_AMOUNT_BUCKETS } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { COUNTRIES } from '../../../shared/countries-currencies'
import { createTtlCache } from '../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../shared/business-metrics'
import {
  FxRateRepository,
  LatestQuoteRepository,
} from '../repositories'
import { getProviderMetadata } from '../services/provider-metadata'
import type { LatestQuoteByCorridorRecord } from '../repositories/interfaces/latest-quote-repository.interface'
const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const canonicalPayinMethods: readonly string[] = [
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay',
  'cash',
  'other',
]

const canonicalPayoutMethods: readonly string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
  'other',
]

const toCanonicalPayinMethod = (value?: string | null): string => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  if (canonicalPayinMethods.includes(token)) {
    return token
  }
  return 'other'
}

const toCanonicalPayoutMethod = (value?: string | null): string => {
  if (!value) return 'other'
  const token = normalizeToken(value)
  if (canonicalPayoutMethods.includes(token)) {
    return token
  }
  return 'other'
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? Number(value) : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toNumberOrZero = (value: unknown): number => toNumberOrNull(value) ?? 0

const logger = createLogger('plane-a.providers')

const planeAPool = getPool(config.db.planeAUrl)
const fxRateRepository = new FxRateRepository(planeAPool)
const latestQuoteRepository = new LatestQuoteRepository(planeAPool)

type ProviderQuoteResponse = {
  psp: {
    slug: string
    name: string
    displayName: string
    type: string
    url: string
    affiliateUrl: string | null
    affiliate: boolean
    outboundUrl: string
    isQuoteRequestLink: boolean
    logo: {
      sm: string
      ico: string
    }
    languages: unknown[]
    score: {
      value: number
      categories: Array<{ name: string; value: number }>
    }
    payoutNetworks: unknown[]
  }
  quotes: Array<{
    payin: string
    payout: string
    transferTime: { min: number; max: number }
    receivedAmount: number
    rate: number
    fee: {
      transfer: number
      externalPayin: number
      externalPayout: number
      payin: number
      payout: number
      total: number
    }
    promos: Array<{
      id: string
      headline: string
      details: string[]
      conditions: string[]
      endDate: null
      newCustomersOnly: boolean
      coupon: null
      receivedAmount: number
      transferCredit: null
      rate: number
      fee: {
        transfer: number
        payin: number
        payout: number
        total: number
      }
    }>
    exposures: unknown[]
    valueProps: unknown[]
    messages: unknown[]
  }>
}

type FrontendProviderQuote = {
  id: string
  name: string
  logoUrl?: string
  fee: number
  marginPct: number
  fxRate: number
  recipientGets: number
  delivery: string
  reliability: number
  methods: ('bank' | 'cash' | 'wallet')[]
  bestFor: string
  whyThisRanking?: string
  limits?: string
  corridorPros?: string[]
  corridorCons?: string[]
  affiliateUrl?: string | null
  outboundUrl?: string | null
  isAffiliate?: boolean
}

type ProvidersResponse = {
  data: FrontendProviderQuote[]
  updatedAt: string
  corridor: string
  amount: number
  method: string
  bucketUsed?: number
  approximate?: boolean
  midMarketRate?: number | null
  midMarketSource?: string | null
  midMarketUpdatedAt?: string | null
}

const providersCache = createTtlCache<ProvidersResponse>({ namespace: 'plane_a:providers' })

const querySchema = z.object({
  from: z.string().min(2).max(2).optional(),
  to: z.string().min(2).max(2).optional(),
  fromCurrency: z.string().min(3).max(3).optional(),
  toCurrency: z.string().min(3).max(3).optional(),
  amount: z.coerce.number().optional(),
  method: z.enum(['bank', 'cash', 'wallet']).optional(),
  corridor_id: z.string().optional(),
  amount_bucket: z.coerce.number().int().optional(),
  payin: z.string().optional(),
  payout: z.string().optional(),
})

const MIN_SEND_AMOUNT = 50
const MAX_QUOTE_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)

const toIsoString = (value?: string | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const normalizeCurrencyCode = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : null
}

const getBucketCandidates = (amount: number, fallback: number) => {
  const sorted = [...DEFAULT_AMOUNT_BUCKETS]
    .filter(bucket => Number.isFinite(bucket))
    .sort((a, b) => Math.abs(amount - a) - Math.abs(amount - b))
  if (!sorted.includes(fallback)) {
    sorted.unshift(fallback)
  }
  return sorted
}

const getUsdEquivalent = async (amount: number, currency: string) => {
  if (!Number.isFinite(amount)) return null
  if (currency === 'USD') return amount

  const fxRateCache = createTtlCache<number>({ namespace: 'plane_a:fx_rate' })
  const cacheKey = `${currency}:USD`
  const cached = await fxRateCache.get(cacheKey)
  if (cached !== null) return amount * cached

  const rate = await fxRateRepository.getRate(currency, 'USD')
  if (rate && rate !== 0 && Number.isFinite(rate)) {
    const ttlMs = config.planeA.b2c.fxRateCacheTtlSeconds * 1000
    await fxRateCache.set(cacheKey, rate, ttlMs)
    return amount * rate
  }

  const inverse = await fxRateRepository.getRate('USD', currency)
  if (inverse && inverse !== 0 && Number.isFinite(inverse)) {
    const ttlMs = config.planeA.b2c.fxRateCacheTtlSeconds * 1000
    await fxRateCache.set(cacheKey, 1 / inverse, ttlMs)
    return amount / inverse
  }

  return null
}


const mapPayinMethod = (payin: string): string => {
  const mapping: Record<string, string> = {
    'bank_transfer': 'BANK',
    'debit_card': 'DEBITCARD',
    'credit_card': 'CREDITCARD',
    'apple_pay': 'DEBITCARD',
    'google_pay': 'DEBITCARD',
    'cash': 'CASH',
    'other': 'BANK',
  }
  return mapping[payin.toLowerCase()] || 'BANK'
}

const mapPayoutMethod = (payout: string): string => {
  const mapping: Record<string, string> = {
    'bank_deposit': 'BANK',
    'cash_pickup': 'CASH',
    'mobile_wallet': 'WALLET',
    'airtime': 'WALLET',
    'other': 'BANK',
  }
  return mapping[payout.toLowerCase()] || 'BANK'
}

const formatTransferTime = (minMinutes: number | null, maxMinutes: number | null) => {
  if (minMinutes === null && maxMinutes === null) {
    return { min: 0, max: 0, label: 'Unknown' }
  }
  if (minMinutes === null) minMinutes = maxMinutes || 0
  if (maxMinutes === null) maxMinutes = minMinutes

  const minHrs = Math.round(minMinutes / 60)
  const maxHrs = Math.round(maxMinutes / 60)

  let label = ''
  if (minHrs === 0 && maxHrs === 0) {
    label = 'Instant'
  } else if (minHrs === maxHrs) {
    label = `${minHrs} ${minHrs === 1 ? 'hour' : 'hours'}`
  } else {
    label = `${minHrs}-${maxHrs} ${maxHrs === 1 ? 'hour' : 'hours'}`
  }

  return { min: minHrs, max: maxHrs, label }
}

const transformQuote = (
  quote: LatestQuoteByCorridorRecord,
): TransformedQuote => {
  const payin = mapPayinMethod(quote.payin)
  const payout = mapPayoutMethod(quote.payout)
  const transferTime = formatTransferTime(
    toNumberOrNull(quote.delivery_time_min_minutes),
    toNumberOrNull(quote.delivery_time_max_minutes),
  )

  const sendAmount = toNumberOrZero(quote.send_amount)
  const feeAmount = toNumberOrZero(quote.fee_amount)
  const receiveAmount = toNumberOrZero(quote.receive_amount)
  const rate = toNumberOrZero(quote.implied_fx_rate)

  const fee = {
    transfer: feeAmount,
    externalPayin: 0,
    externalPayout: 0,
    payin: 0,
    payout: 0,
    total: feeAmount,
  }

  const promos: ProviderQuoteResponse['quotes'][0]['promos'] = []
  if (quote.promotional_rate || quote.promotional_fee_amount) {
    const promoRateRaw = toNumberOrNull(quote.promotional_rate)
    const promoRate = promoRateRaw && promoRateRaw > 0 ? promoRateRaw : rate
    const promoFee = toNumberOrZero(quote.promotional_fee_amount)
    const promoReceiveAmount = sendAmount * promoRate - promoFee

    promos.push({
      id: `${quote.provider_id}-promo`,
      headline: 'h-preferential-fees-rate-1st',
      details: ['d-only-1st-transfer'],
      conditions: ['c-new-customers'],
      endDate: null,
      newCustomersOnly: true,
      coupon: null,
      receivedAmount: promoReceiveAmount,
      transferCredit: null,
      rate: promoRate,
      fee: {
        transfer: promoFee,
        payin: 0,
        payout: 0,
        total: promoFee,
      },
    })
  }

  return {
    payin,
    payout,
    receivedAmount: receiveAmount,
    rate,
    fee,
    promos,
    exposures: [],
    valueProps: [],
    messages: [],
    deliveryLabel: transferTime.label,
    originalQuote: quote,
  } as TransformedQuote
}

type TransformedQuote = Omit<ProviderQuoteResponse['quotes'][0], 'transferTime'> & { 
  deliveryLabel: string
  originalQuote: LatestQuoteByCorridorRecord 
}

const groupQuotesByProvider = (
  quotes: LatestQuoteByCorridorRecord[],
): Array<{ psp: ProviderQuoteResponse['psp']; quotes: TransformedQuote[] }> => {
  const providerMap = new Map<string, { metadata: ProviderQuoteResponse['psp']; quotes: TransformedQuote[] }>()

  for (const quote of quotes) {
    const providerId = quote.provider_id.toLowerCase()
    const metadata = getProviderMetadata(providerId)

    if (!metadata) {
      logger.debug('provider_metadata_missing', { provider_id: providerId })
      continue
    }

    if (metadata.type === 'BANK') {
      continue
    }

    if (!providerMap.has(providerId)) {
      const scoreCategories = metadata.scoreBreakdown
        ? [
            { name: 'trust', value: metadata.scoreBreakdown.trustSafety * 10 },
            { name: 'service', value: metadata.scoreBreakdown.frictionSpeed * 10 },
            { name: 'pricing', value: metadata.scoreBreakdown.deliveredValue * 10 },
            { name: 'customer', value: metadata.scoreBreakdown.supportRefunds * 10 },
          ]
        : []

      providerMap.set(providerId, {
        metadata: {
          slug: metadata.slug,
          name: metadata.name,
          displayName: metadata.displayName,
          type: metadata.type,
          url: metadata.url,
          affiliateUrl: metadata.affiliateUrl,
          affiliate: Boolean(metadata.affiliateUrl) || metadata.isAffiliate,
          outboundUrl: metadata.affiliateUrl ?? metadata.url,
          isQuoteRequestLink: false,
          logo: {
            sm: metadata.logo.sm,
            ico: metadata.logo.ico,
          },
          languages: [],
          score: {
            value: metadata.remitScore,
            categories: scoreCategories,
          },
          payoutNetworks: [],
        },
        quotes: [],
      })
    }

    const provider = providerMap.get(providerId)!
    provider.quotes.push(transformQuote(quote))
  }

  return Array.from(providerMap.values()).map(({ metadata, quotes }) => ({
    psp: metadata,
    quotes,
  }))
}

const selectBestQuote = (quotes: TransformedQuote[]) => {
  if (quotes.length === 0) return null
  return quotes.reduce((best, current) => {
    return current.receivedAmount > best.receivedAmount ? current : best
  })
}

export const providersRoutes = async (app: FastifyInstance) => {
  app.get('/providers', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { from, to, fromCurrency, toCurrency, amount, method, corridor_id, amount_bucket, payin, payout } = parsed.data
    const payinExplicit = Boolean(payin)

    let corridorId = corridor_id
    let amountBucket = amount_bucket
    let payinMethod = payin
    let payoutMethod = payout
    let requestedAmount = amount
    let approximate = false

    const normalizedFromCurrency = normalizeCurrencyCode(fromCurrency)
    const normalizedToCurrency = normalizeCurrencyCode(toCurrency)

    if (fromCurrency && !normalizedFromCurrency) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] }
    }

    if (toCurrency && !normalizedToCurrency) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] }
    }

    if (from && to && amount) {
      const sourceCountry = COUNTRIES.find(c => c.code === from.toUpperCase())
      const destCountry = COUNTRIES.find(c => c.code === to.toUpperCase())
      
      if (!sourceCountry || !destCountry) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid country codes' }] }
      }

      const sourceCurrency = normalizedFromCurrency ?? sourceCountry.currency
      const destCurrency = normalizedToCurrency ?? destCountry.currency
      corridorId = `${from.toUpperCase()}-${to.toUpperCase()}-${sourceCurrency}-${destCurrency}`

      const usdEquivalent = await getUsdEquivalent(amount, sourceCurrency)
      if (usdEquivalent === null) {
        reply.code(503)
        return { error: 'fx_unavailable', details: [{ message: 'USD conversion unavailable' }] }
      }

      if (usdEquivalent < MIN_SEND_AMOUNT) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: `amount must be >= ${MIN_SEND_AMOUNT} USD equivalent` }] }
      }

      const bucketSelection = computeBucketSelection(amount)
      amountBucket = bucketSelection.bucket_used
      approximate = bucketSelection.approximate
      requestedAmount = amount

      if (method === 'bank') {
        payinMethod = 'bank_transfer'
        payoutMethod = 'bank_deposit'
      } else if (method === 'cash') {
        payinMethod = 'bank_transfer'
        payoutMethod = 'cash_pickup'
      } else if (method === 'wallet') {
        payinMethod = 'bank_transfer'
        payoutMethod = 'mobile_wallet'
      }
    }

    if (!corridorId || amountBucket === undefined || !payinMethod || !payoutMethod) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'missing required parameters' }] }
    }

    const normalizedPayin = toCanonicalPayinMethod(payinMethod)
    const normalizedPayout = toCanonicalPayoutMethod(payoutMethod)

    if (normalizedPayin === 'other' || normalizedPayout === 'other') {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'invalid payin or payout method' }] }
    }

    const payinCandidates = payinExplicit
      ? [normalizedPayin]
      : [normalizedPayin]
    const payinKey = payinCandidates.join('|')
    const amountKey = requestedAmount ?? amountBucket

    try {
      const cacheKey = `providers:${corridorId}:${amountBucket}:${amountKey}:${payinKey}:${normalizedPayout}`
      const cached = await providersCache.get(cacheKey)
      if (cached !== null) {
        logger.debug('providers_cache_hit', { cache_key: cacheKey })
        return cached
      }

      const corridorParts = parseCorridorId(corridorId)
      let bucketUsed = amountBucket
      let quotes = await latestQuoteRepository.listLatestByCorridorPayins(
        corridorId,
        amountBucket,
        payinCandidates,
        normalizedPayout,
        MAX_QUOTE_AGE_SECONDS || undefined,
      )

      if (!Array.isArray(quotes)) {
        logger.error('providers_invalid_response', { type: typeof quotes })
        throw new Error('Invalid response from database')
      }

      if (!quotes.length && requestedAmount) {
        const candidates = getBucketCandidates(requestedAmount, amountBucket)
        for (const candidate of candidates) {
          if (candidate === amountBucket) continue
          const fallbackQuotes = await latestQuoteRepository.listLatestByCorridorPayins(
            corridorId,
            candidate,
            payinCandidates,
            normalizedPayout,
            MAX_QUOTE_AGE_SECONDS || undefined,
          )
          if (Array.isArray(fallbackQuotes) && fallbackQuotes.length) {
            quotes = fallbackQuotes
            bucketUsed = candidate
            approximate = true
            break
          }
        }
      }

      let midMarketRate: number | null = null
      let midMarketSource: string | null = null
      let midMarketUpdatedAt: string | null = null

      if (corridorParts) {
        const rateRecord = await fxRateRepository.getRateRecord(
          corridorParts.sourceCurrency,
          corridorParts.destCurrency,
        )
        const rate = toNumberOrNull(rateRecord?.rate)
        if (rate && rate > 0) {
          midMarketRate = rate
          midMarketSource = rateRecord?.source ?? null
          midMarketUpdatedAt = toIsoString(rateRecord?.last_updated ?? rateRecord?.updated_at)
        }
      }

      if (!quotes.length) {
        const supportResult = await query<{
          payin_methods: string[] | null
          payout_methods: string[] | null
          is_supported: boolean
        }>(
          `SELECT payin_methods, payout_methods, is_supported
           FROM silver.provider_corridor_capability
           WHERE corridor_id = $1`,
          [corridorId],
          planeAPool,
        )

        if (supportResult.rows.length > 0) {
          const supportedRows = supportResult.rows.filter(row => row.is_supported)

          if (!supportedRows.length) {
            reply.code(404)
            return {
              error: 'corridor_unsupported',
              message: 'Providers explicitly mark this corridor as unsupported.',
              corridor: corridorId,
            }
          }

          const methodSupported = supportedRows.some((row) => {
            const payinMethods = row.payin_methods
            const payoutMethods = row.payout_methods
            const payinOk = !Array.isArray(payinMethods) || payinMethods.length === 0
              || payinMethods.includes(normalizedPayin)
            const payoutOk = !Array.isArray(payoutMethods) || payoutMethods.length === 0
              || payoutMethods.includes(normalizedPayout)
            return payinOk && payoutOk
          })

          if (!methodSupported) {
            reply.code(404)
            return {
              error: 'corridor_unavailable',
              message: 'No providers currently support this corridor.',
              corridor: corridorId,
            }
          }
        }
      }

      const providerQuotes = groupQuotesByProvider(quotes)

      if (!midMarketRate && providerQuotes.length >= 2) {
        const bestQuotes = providerQuotes
          .map(pq => selectBestQuote(pq.quotes))
          .filter((quote): quote is TransformedQuote => Boolean(quote))
          .filter((quote) => Number.isFinite(quote.rate) && quote.rate > 0)

        if (bestQuotes.length >= 2) {
          let weightedSum = 0
          let weightTotal = 0
          let latestCollectedAt = 0

          for (const quote of bestQuotes) {
            const sendAmount = Number(quote.originalQuote.send_amount ?? requestedAmount ?? amountBucket)
            if (!Number.isFinite(sendAmount) || sendAmount <= 0) continue
            weightedSum += quote.rate * sendAmount
            weightTotal += sendAmount
            const collectedAt = quote.originalQuote.collected_at
              ? new Date(quote.originalQuote.collected_at).getTime()
              : 0
            if (Number.isFinite(collectedAt) && collectedAt > latestCollectedAt) {
              latestCollectedAt = collectedAt
            }
          }

          if (weightTotal > 0) {
            midMarketRate = weightedSum / weightTotal
            midMarketSource = 'provider_weighted'
            midMarketUpdatedAt = latestCollectedAt
              ? new Date(latestCollectedAt).toISOString()
              : new Date().toISOString()
          }
        }
      }

      const flattenedQuotes = providerQuotes.flatMap((pq) => {
        const quote = selectBestQuote(pq.quotes)
        if (!quote) return []
        const feeTotal = quote.fee.total
        const fxRate = quote.rate
        
        // Recalculate recipientGets for the requested amount using the stored rate
        // If we have the original send_amount from the stored quote, use it to scale proportionally
        // Otherwise, calculate using the rate formula
        const storedSendAmount = Number(quote.originalQuote.send_amount ?? bucketUsed)
        let receivedAmount = quote.receivedAmount

        if (requestedAmount && Number.isFinite(requestedAmount) && Number.isFinite(fxRate) && fxRate > 0) {
          if (Number.isFinite(storedSendAmount) && storedSendAmount > 0 && Math.abs(storedSendAmount - requestedAmount) > 0.01) {
            const fixedFee = Number.isFinite(feeTotal) ? feeTotal : 0
            const proportionalFee = fixedFee > 0
              ? (fixedFee / storedSendAmount) * requestedAmount
              : 0
            const byRate = requestedAmount * fxRate
            const byFixedFee = Math.max(0, (requestedAmount - fixedFee)) * fxRate
            const byProportionalFee = Math.max(0, (requestedAmount - proportionalFee)) * fxRate
            receivedAmount = Math.max(0, Math.min(byRate, byFixedFee, byProportionalFee))
          }
        }
        
        const marginPct = midMarketRate && midMarketRate > 0 && fxRate > 0
          ? ((midMarketRate - fxRate) / midMarketRate) * 100
          : 0

        const deliveryLabel = quote.deliveryLabel

        const methods: ('bank' | 'cash' | 'wallet')[] = []
        if (quote.payout === 'BANK' || quote.payout === 'CARD') {
          methods.push('bank')
        } else if (quote.payout === 'CASH') {
          methods.push('cash')
        } else if (quote.payout === 'WALLET') {
          methods.push('wallet')
        }
        
        if (methods.length === 0) {
          methods.push('bank')
        }

        const bestFor = quote.payout === 'CASH'
          ? 'Fast cash pickup'
          : quote.payout === 'WALLET'
          ? 'Mobile wallet delivery'
          : 'Bank deposit'

        const whyThisRanking = quote.promos.length > 0
          ? 'Promotional rate available for new customers'
          : bestFor

        const hasPromo = quote.promos.length > 0
        const promoInfo = hasPromo && quote.promos[0] ? {
          fee: quote.promos[0].fee.total,
          rate: quote.promos[0].rate,
          headline: quote.promos[0].headline,
          details: quote.promos[0].details,
          newCustomersOnly: quote.promos[0].newCustomersOnly,
        } : null

        return [{
          id: pq.psp.slug,
          name: pq.psp.name,
          logoUrl: pq.psp.logo.sm,
          fee: feeTotal,
          marginPct: Math.abs(marginPct),
          fxRate,
          recipientGets: receivedAmount,
          delivery: deliveryLabel,
          reliability: Math.min(1, Math.max(0, pq.psp.score.value / 10)),
          methods,
          bestFor,
          whyThisRanking,
          affiliateUrl: pq.psp.affiliateUrl ?? null,
          outboundUrl: pq.psp.outboundUrl ?? pq.psp.url,
          isAffiliate: pq.psp.affiliate,
          hasPromo,
          promoInfo,
        }]
      })

      const response = {
        data: flattenedQuotes,
        updatedAt: new Date().toISOString(),
        corridor: corridorId,
        amount: requestedAmount || amountBucket,
        method: method || 'bank',
        bucketUsed,
        approximate,
        midMarketRate: midMarketRate ?? null,
        midMarketSource: midMarketSource ?? null,
        midMarketUpdatedAt,
      }

      // Tune cache TTL for production (longer) vs development (shorter)
      const ttlMs = config.env === 'production' ? 120 * 1000 : 30 * 1000
      await providersCache.set(cacheKey, response, ttlMs)

      try {
        if (corridorParts) {
          recordQuoteRequest(corridorId, bucketUsed)
          recordSearch(corridorParts.sourceCountry, corridorParts.destCountry)
        }
      } catch {
        // Silently ignore metrics errors
      }

      logger.debug('providers_request_success', {
        corridor_id: corridorId,
        amount_bucket: bucketUsed,
        count: providerQuotes.length,
      })

      return response
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      logger.error('providers_request_failed', {
        corridor_id: corridorId,
        amount_bucket: amountBucket,
        error: errorMessage,
        stack: errorStack,
      })
      reply.code(500)
      
      // Sanitize error messages in production
      const isProduction = config.env === 'production'
      return {
        error: 'internal_error',
        message: isProduction 
          ? 'Failed to fetch providers. Please try again later.'
          : `Failed to fetch providers: ${errorMessage}`,
      }
    }
  })
}
