import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { COUNTRIES } from '../../../shared/countries-currencies'
import { createTtlCache } from '../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../shared/business-metrics'
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
import {
  FxRateRepository,
  LatestQuoteRepository,
} from '../repositories'
import { getProviderMetadata } from '../services/provider-metadata'
import type { LatestQuoteByCorridorRecord } from '../repositories/interfaces/latest-quote-repository.interface'

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
}

const providersCache = createTtlCache<ProvidersResponse>({ namespace: 'plane_a:providers' })

const querySchema = z.object({
  from: z.string().min(2).max(2).optional(),
  to: z.string().min(2).max(2).optional(),
  amount: z.coerce.number().optional(),
  method: z.enum(['bank', 'cash', 'wallet']).optional(),
  corridor_id: z.string().optional(),
  amount_bucket: z.coerce.number().int().optional(),
  payin: z.string().optional(),
  payout: z.string().optional(),
})

const MIN_SEND_AMOUNT = 50

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
    quote.delivery_time_min_minutes,
    quote.delivery_time_max_minutes,
  )

  const sendAmount = quote.send_amount || 0
  const feeAmount = quote.fee_amount || 0
  const receiveAmount = quote.receive_amount || 0
  const rate = quote.implied_fx_rate || 0

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
    const promoRate = quote.promotional_rate || rate
    const promoFee = quote.promotional_fee_amount || 0
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

export const providersRoutes = async (app: FastifyInstance) => {
  app.get('/providers', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { from, to, amount, method, corridor_id, amount_bucket, payin, payout } = parsed.data

    let corridorId = corridor_id
    let amountBucket = amount_bucket
    let payinMethod = payin
    let payoutMethod = payout

    if (from && to && amount) {
      const sourceCountry = COUNTRIES.find(c => c.code === from.toUpperCase())
      const destCountry = COUNTRIES.find(c => c.code === to.toUpperCase())
      
      if (!sourceCountry || !destCountry) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid country codes' }] }
      }

      corridorId = `${from.toUpperCase()}-${to.toUpperCase()}-${sourceCountry.currency}-${destCountry.currency}`

      const usdEquivalent = await getUsdEquivalent(amount, sourceCountry.currency)
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

    try {
      const cacheKey = `providers:${corridorId}:${amountBucket}:${normalizedPayin}:${normalizedPayout}`
      const cached = await providersCache.get(cacheKey)
      if (cached !== null) {
        logger.debug('providers_cache_hit', { cache_key: cacheKey })
        return cached
      }

      const quotes = await latestQuoteRepository.listLatestByCorridor(
        corridorId,
        amountBucket,
        normalizedPayin,
        normalizedPayout,
      )

      if (!Array.isArray(quotes)) {
        logger.error('providers_invalid_response', { type: typeof quotes })
        throw new Error('Invalid response from database')
      }

      const corridorParts = parseCorridorId(corridorId)
      let midMarketRate: number | null = null
      if (corridorParts) {
        const rate = await fxRateRepository.getRate(
          corridorParts.sourceCurrency,
          corridorParts.destCurrency,
        )
        midMarketRate = rate
      }

      const providerQuotes = groupQuotesByProvider(quotes)

      const flattenedQuotes = providerQuotes.flatMap((pq) => {
        return pq.quotes.map((quote) => {
          const feeTotal = quote.fee.total
          const receivedAmount = quote.receivedAmount
          const fxRate = quote.rate
          
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

          return {
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
          }
        })
      })

      const response = {
        data: flattenedQuotes,
        updatedAt: new Date().toISOString(),
        corridor: corridorId,
        amount: amount || amountBucket,
        method: method || 'bank',
      }

      // Tune cache TTL for production (longer) vs development (shorter)
      const ttlMs = config.env === 'production' ? 120 * 1000 : 30 * 1000
      await providersCache.set(cacheKey, response, ttlMs)

      try {
        if (corridorParts) {
          recordQuoteRequest(corridorId, amountBucket)
          recordSearch(corridorParts.sourceCountry, corridorParts.destCountry)
        }
      } catch {
        // Silently ignore metrics errors
      }

      logger.debug('providers_request_success', {
        corridor_id: corridorId,
        amount_bucket: amountBucket,
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
