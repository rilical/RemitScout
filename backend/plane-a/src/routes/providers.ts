import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection, DEFAULT_AMOUNT_BUCKETS } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { getCountryByCode, isCurrencyAllowedForCountry } from '../../../shared/countries-currencies'
import { isWiseDestinationCurrency, isWiseSourceCurrency } from '../../../shared/provider-currencies'
import { getMaxAmount, getMinAmount } from '../../../shared/currency-limits'
import { createTtlCache } from '../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../shared/business-metrics'
import {
  CorridorPriorityRepository,
  CorridorCapabilityRepository,
  FxRateRepository,
  LatestQuoteRepository,
  RightsMatrixRepository,
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

const normalizeProviderId = (value: string): string => value.trim().toLowerCase()

const METHOD_ORDER: Array<'bank' | 'cash' | 'wallet' | 'airtime'> = [
  'bank',
  'cash',
  'wallet',
  'airtime',
]

const toAvailableMethod = (value?: string | null): 'bank' | 'cash' | 'wallet' | 'airtime' | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (token === 'bank_deposit') return 'bank'
  if (token === 'cash_pickup') return 'cash'
  if (token === 'mobile_wallet') return 'wallet'
  if (token === 'airtime') return 'airtime'
  return null
}

const orderMethods = (methods: Iterable<'bank' | 'cash' | 'wallet' | 'airtime'>) => {
  const set = new Set(methods)
  return METHOD_ORDER.filter((method) => set.has(method))
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
const rightsMatrixRepository = new RightsMatrixRepository(planeAPool)
const corridorPriorityRepository = new CorridorPriorityRepository(planeAPool)
const corridorCapabilityRepository = new CorridorCapabilityRepository(planeAPool)

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
  methods: ('bank' | 'cash' | 'wallet' | 'airtime')[]
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
  availableMethods?: Array<'bank' | 'cash' | 'wallet' | 'airtime'>
  indices?: CorridorIndices
}

type CorridorIndices = {
  teer: number | null
  rvi: number | null
  rci: number | null
  providerCount: number
  amount: number
  midMarketRate: number | null
  weights: 'equal'
}

const providersCache = createTtlCache<ProvidersResponse>({ namespace: 'plane_a:providers' })

const querySchema = z.object({
  from: z.string().min(2).max(2).optional(),
  to: z.string().min(2).max(2).optional(),
  fromCurrency: z.string().min(3).max(3).optional(),
  toCurrency: z.string().min(3).max(3).optional(),
  amount: z.coerce.number().optional(),
  method: z.enum(['bank', 'cash', 'wallet', 'airtime']).optional(),
  corridor_id: z.string().optional(),
  amount_bucket: z.coerce.number().int().optional(),
  payin: z.string().optional(),
  payout: z.string().optional(),
  live: z.coerce.boolean().optional(),
})

const DEFAULT_MAX_QUOTE_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)
const TIER2_FRESHNESS_SECONDS = 120 * 60
const MAX_B2C_QUOTE_AGE_SECONDS = 4 * 60 * 60
const loadActiveB2cProviderIdsByCountry = async (
  sourceCountry: string,
  destCountry: string,
): Promise<string[]> => {
  try {
    const rows = await rightsMatrixRepository.listActiveB2cProvidersByCountry(
      sourceCountry,
      destCountry,
    )
    return rows.map(row => row.provider_id).filter(Boolean)
  } catch {
    return []
  }
}

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

const computeCorridorIndices = (
  quotes: Array<{
    fxRate: number
    fee: number
    hasPromo?: boolean
    promoInfo?: { fee: number; rate: number } | null
  }>,
  amount: number,
  midMarketRate: number | null,
): CorridorIndices => {
  const effectiveRates: number[] = []
  const costRatios: number[] = []

  for (const quote of quotes) {
    const promoRate = quote.hasPromo && quote.promoInfo && Number.isFinite(quote.promoInfo.rate)
      ? Number(quote.promoInfo.rate)
      : null
    const promoFee = quote.hasPromo && quote.promoInfo && Number.isFinite(quote.promoInfo.fee)
      ? Number(quote.promoInfo.fee)
      : null
    const rate = promoRate ?? Number(quote.fxRate)
    const fee = promoFee ?? Number(quote.fee)

    if (!Number.isFinite(amount) || amount <= 0) continue
    if (!Number.isFinite(rate) || rate <= 0) continue
    if (!Number.isFinite(fee) || fee < 0) continue

    const amountAfterFee = Math.max(amount - fee, 0)
    const effectiveRate = (amountAfterFee * rate) / amount
    if (Number.isFinite(effectiveRate)) {
      effectiveRates.push(effectiveRate)
    }

    if (midMarketRate && midMarketRate > 0) {
      const hiddenMarkup = (amountAfterFee * (midMarketRate - rate)) / midMarketRate
      const totalCost = fee + (Number.isFinite(hiddenMarkup) ? hiddenMarkup : 0)
      const ratio = totalCost / amount
      if (Number.isFinite(ratio)) {
        costRatios.push(ratio)
      }
    }
  }

  const providerCount = effectiveRates.length
  let rvi: number | null = null
  if (providerCount >= 2) {
    const mean = effectiveRates.reduce((sum, value) => sum + value, 0) / providerCount
    const variance = effectiveRates.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (providerCount - 1)
    rvi = Number.isFinite(variance) ? Math.sqrt(variance) : null
  }

  let rci: number | null = null
  let teer: number | null = null
  if (midMarketRate && midMarketRate > 0 && costRatios.length > 0) {
    rci = costRatios.reduce((sum, value) => sum + value, 0) / costRatios.length
    const rawTeer = midMarketRate * (1 - rci)
    teer = Number.isFinite(rawTeer) ? Math.max(0, rawTeer) : null
  }

  return {
    teer,
    rvi,
    rci,
    providerCount,
    amount,
    midMarketRate: midMarketRate ?? null,
    weights: 'equal',
  }
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


const getCorridorMaxAgeSeconds = async (corridorId: string) => {
  try {
    const minutes = await corridorPriorityRepository.getFreshnessSloMinutes(corridorId)
    if (Number.isFinite(minutes)) {
      const seconds = Math.round(Number(minutes) * 60)
      return Math.min(
        Math.max(seconds, TIER2_FRESHNESS_SECONDS),
        MAX_B2C_QUOTE_AGE_SECONDS,
      )
    }
  } catch (error) {
    logger.warn('corridor_priority_lookup_failed', {
      corridor_id: corridorId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return Math.min(
    Math.max(DEFAULT_MAX_QUOTE_AGE_SECONDS, TIER2_FRESHNESS_SECONDS),
    MAX_B2C_QUOTE_AGE_SECONDS,
  )
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
    'airtime': 'AIRTIME',
    'other': 'BANK',
  }
  return mapping[payout.toLowerCase()] || 'BANK'
}

const resolveRequestedMethod = (method?: string | null, payout?: string | null) => {
  if (method && METHOD_ORDER.includes(method as 'bank' | 'cash' | 'wallet' | 'airtime')) {
    return method as 'bank' | 'cash' | 'wallet' | 'airtime'
  }
  const fallback = toAvailableMethod(payout)
  return fallback ?? 'bank'
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

    const { from, to, fromCurrency, toCurrency, amount, method, corridor_id, amount_bucket, payout, live } = parsed.data
    const bypassCache = live === true

    let corridorId = corridor_id
    let amountBucket = amount_bucket
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

    if (from && to && amount !== undefined) {
      const sourceCountry = getCountryByCode(from.toUpperCase())
      const destCountry = getCountryByCode(to.toUpperCase())
      
      if (!sourceCountry || !destCountry) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid country codes' }] }
      }

      if (normalizedFromCurrency && !isCurrencyAllowedForRequest(sourceCountry.code, normalizedFromCurrency, 'source')) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] }
      }

      if (normalizedToCurrency && !isCurrencyAllowedForRequest(destCountry.code, normalizedToCurrency, 'destination')) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] }
      }

      const sourceCurrency = normalizedFromCurrency ?? sourceCountry.currency
      const destCurrency = normalizedToCurrency ?? destCountry.currency
      corridorId = `${from.toUpperCase()}-${to.toUpperCase()}-${sourceCurrency}-${destCurrency}`

      if (!Number.isFinite(amount) || amount <= 0) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'amount must be a positive number' }] }
      }

      const minAmount = getMinAmount(sourceCurrency)
      const maxAmount = getMaxAmount(sourceCurrency)
      if (amount < minAmount) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: `amount must be >= ${minAmount} ${sourceCurrency}` }] }
      }
      if (amount > maxAmount) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: `amount must be <= ${maxAmount} ${sourceCurrency}` }] }
      }

      const bucketSelection = computeBucketSelection(amount)
      amountBucket = bucketSelection.bucket_used
      approximate = bucketSelection.approximate
      requestedAmount = amount
    }

    if (!corridorId || amountBucket === undefined) {
      reply.code(400)
      return { error: 'bad_request', details: [{ message: 'missing required parameters' }] }
    }

    const amountKey = requestedAmount ?? amountBucket
    const requestedMethod = resolveRequestedMethod(method, payout)
    const availableMethods = new Set<'bank' | 'cash' | 'wallet' | 'airtime'>()
    const methodsByProvider = new Map<string, Set<'bank' | 'cash' | 'wallet' | 'airtime'>>()

    try {
      const maxAgeSeconds = await getCorridorMaxAgeSeconds(corridorId)
      const cacheKey = `providers:${corridorId}:${amountBucket}:${amountKey}:${requestedMethod}:${maxAgeSeconds}`
      if (!bypassCache) {
        const cached = await providersCache.get(cacheKey)
        if (cached !== null) {
          logger.debug('providers_cache_hit', { cache_key: cacheKey })
          return cached
        }
      }

      const corridorParts = parseCorridorId(corridorId)
      if (!corridorParts) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid corridor_id' }] }
      }
      const sourceCountry = corridorParts.sourceCountry.toUpperCase()
      const destCountry = corridorParts.destCountry.toUpperCase()
      const sourceCurrency = corridorParts.sourceCurrency.toUpperCase()
      const destCurrency = corridorParts.destCurrency.toUpperCase()
      if (!isCurrencyAllowedForRequest(sourceCountry, sourceCurrency, 'source')) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] }
      }
      if (!isCurrencyAllowedForRequest(destCountry, destCurrency, 'destination')) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] }
      }

      if (!Number.isFinite(amountKey) || amountKey <= 0) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: 'amount must be a positive number' }] }
      }
      const minAmount = getMinAmount(sourceCurrency)
      const maxAmount = getMaxAmount(sourceCurrency)
      if (amountKey < minAmount) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: `amount must be >= ${minAmount} ${sourceCurrency}` }] }
      }
      if (amountKey > maxAmount) {
        reply.code(400)
        return { error: 'bad_request', details: [{ message: `amount must be <= ${maxAmount} ${sourceCurrency}` }] }
      }

      const supportedProviderIds = await loadActiveB2cProviderIdsByCountry(
        sourceCountry,
        destCountry,
      )
      const supportedProviderSet = new Set(
        supportedProviderIds.map(id => normalizeProviderId(id)).filter(Boolean),
      )
      const capabilityMethods = new Set<'bank' | 'cash' | 'wallet' | 'airtime'>()

      try {
        const capabilityRows = await corridorCapabilityRepository.listByCorridor(corridorId)
        for (const row of capabilityRows) {
          if (!row?.is_supported) continue
          const providerId = row.provider_id ? normalizeProviderId(row.provider_id) : ''
          if (!providerId) continue
          if (supportedProviderSet.size && !supportedProviderSet.has(providerId)) continue
          const payoutMethods = Array.isArray(row.payout_methods) ? row.payout_methods : []
          for (const payoutMethod of payoutMethods) {
            const methodValue = toAvailableMethod(payoutMethod)
            if (!methodValue) continue
            capabilityMethods.add(methodValue)
          }
        }
      } catch (error) {
        logger.warn('capability_methods_lookup_failed', {
          corridor_id: corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      for (const methodValue of capabilityMethods) {
        availableMethods.add(methodValue)
      }

      let bucketUsed = amountBucket
      let quotes = await latestQuoteRepository.listLatestByCorridorAllMethods(
        corridorId,
        amountBucket,
        maxAgeSeconds || undefined,
      )

      if (!Array.isArray(quotes)) {
        logger.error('providers_invalid_response', { type: typeof quotes })
        throw new Error('Invalid response from database')
      }

      if (!quotes.length && requestedAmount) {
        const candidates = getBucketCandidates(requestedAmount, amountBucket)
        for (const candidate of candidates) {
          if (candidate === amountBucket) continue
          const fallbackQuotes = await latestQuoteRepository.listLatestByCorridorAllMethods(
            corridorId,
            candidate,
            maxAgeSeconds || undefined,
          )
          if (Array.isArray(fallbackQuotes) && fallbackQuotes.length) {
            quotes = fallbackQuotes
            bucketUsed = candidate
            approximate = true
            break
          }
        }
      }

      for (const quote of quotes) {
        const methodValue = toAvailableMethod(quote.payout)
        if (!methodValue) continue
        availableMethods.add(methodValue)
        const metadata = getProviderMetadata(quote.provider_id)
        if (!metadata) continue
        const key = metadata.slug
        if (!methodsByProvider.has(key)) {
          methodsByProvider.set(key, new Set())
        }
        methodsByProvider.get(key)!.add(methodValue)
      }

      const filteredQuotes = quotes.filter((quote) => {
        const methodValue = toAvailableMethod(quote.payout)
        return methodValue === requestedMethod
      })

      let midMarketRate: number | null = null
      let midMarketSource: string | null = null
      let midMarketUpdatedAt: string | null = null

      if (corridorParts) {
        const rateRecord = await fxRateRepository.getRateRecord(
          sourceCurrency,
          destCurrency,
        )
        const rate = toNumberOrNull(rateRecord?.rate)
        if (rate && rate > 0) {
          midMarketRate = rate
          midMarketSource = rateRecord?.source ?? null
          midMarketUpdatedAt = toIsoString(rateRecord?.last_updated ?? rateRecord?.updated_at)
        }
      }

      if (!filteredQuotes.length) {
        if (supportedProviderIds.length === 0) {
          reply.code(404)
          return {
            error: 'corridor_unsupported',
            message: 'No providers currently support this corridor.',
            corridor: corridorId,
            availableMethods: orderMethods(availableMethods),
          }
        }
      }

      const providerQuotes = groupQuotesByProvider(filteredQuotes)

      const allowProviderWeightedMidMarket = config.planeA.b2c.providerWeightedMidMarketEnabled
      if (!midMarketRate && allowProviderWeightedMidMarket && providerQuotes.length >= 2) {
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

        const providerMethods = methodsByProvider.get(pq.psp.slug)
        const methods = providerMethods && providerMethods.size
          ? orderMethods(providerMethods)
          : (() => {
              const fallback = toAvailableMethod(quote.originalQuote.payout)
              return fallback ? [fallback] : ['bank']
            })()

        const bestFor = quote.payout === 'CASH'
          ? 'Fast cash pickup'
          : quote.payout === 'WALLET'
          ? 'Mobile wallet delivery'
          : quote.payout === 'AIRTIME'
          ? 'Airtime top up'
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

      for (const quote of flattenedQuotes) {
        if (!Array.isArray(quote.methods)) continue
        for (const method of quote.methods) {
          availableMethods.add(method)
        }
      }

      let latestCollectedAt: string | null = null
      if (filteredQuotes.length) {
        let latestTs = 0
        for (const quote of filteredQuotes) {
          if (!quote.collected_at) continue
          const ts = new Date(quote.collected_at).getTime()
          if (Number.isFinite(ts) && ts > latestTs) {
            latestTs = ts
          }
        }
        if (latestTs > 0) {
          latestCollectedAt = new Date(latestTs).toISOString()
        }
      }

      const amountForIndices = requestedAmount || amountBucket
      const indices = computeCorridorIndices(flattenedQuotes, amountForIndices, midMarketRate ?? null)

      const response = {
        data: flattenedQuotes,
        updatedAt: latestCollectedAt ?? new Date().toISOString(),
        corridor: corridorId,
        amount: requestedAmount || amountBucket,
        method: requestedMethod,
        bucketUsed,
        approximate,
        midMarketRate: midMarketRate ?? null,
        midMarketSource: midMarketSource ?? null,
        midMarketUpdatedAt,
        availableMethods: orderMethods(availableMethods),
        indices,
      }

      if (!bypassCache) {
        // Tune cache TTL for production (longer) vs development (shorter)
        const ttlMs = config.env === 'production' ? 120 * 1000 : 30 * 1000
        await providersCache.set(cacheKey, response, ttlMs)
      }

      try {
        recordQuoteRequest(corridorId, bucketUsed)
        recordSearch(sourceCountry, destCountry)
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
