import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { computeBucketSelection, DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { parseCorridorId } from '../../../../shared/corridor'
import { getCountryByCode, isCurrencyAllowedForCountry } from '../../../../shared/countries-currencies'
import { isWiseDestinationCurrency, isWiseSourceCurrency } from '../../../../shared/provider-currencies'
import { getMaxAmount, getMinAmount } from '../../../../shared/currency-limits'
import { createTtlCache } from '../../../../shared/cache'
import { recordQuoteRequest, recordSearch } from '../../../../shared/business-metrics'
import { getCorridorTier, getTierSloMinutes } from '../../../../shared/corridor-tiers'
import { normalizeProviderId } from '../../../../shared/provider-utils'
import {
  DEFAULT_FALLBACK_TTL_SECONDS,
  MAX_B2C_QUOTE_AGE_SECONDS,
  WEIGHT_SNAPSHOT_TTL_MS,
} from '../../../../shared/constants'
import { getProviderMetadata } from '../../services/provider-metadata'
import { VolatilityService } from '../../services/volatility-service'
import { DEFAULT_WEIGHT_MODEL, GLOBAL_WEIGHT_CORRIDOR_ID } from '../../../../shared/weighting-model'
import type { LatestQuoteByCorridorRecord } from '../../repositories/interfaces/latest-quote-repository.interface'
import type { PlaneAContainer } from '../../container'
import { ValidationError, NotFoundError } from '../../../../shared/errors'
const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '')

const resolvePublicBaseUrl = () => {
  const candidates = [
    config.newsletter.baseUrl,
    config.billing.stripe.frontendBaseUrl,
  ]

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return normalizeBaseUrl(candidate)
    }
  }

  return ''
}

const LOGO_BASE_URL = resolvePublicBaseUrl()

const toAbsoluteUrl = (value: string, baseUrl: string) => {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  if (!baseUrl) return value
  return `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

const METHOD_ORDER: Array<'bank' | 'cash' | 'wallet' | 'airtime'> = [
  'bank',
  'cash',
  'wallet',
  'airtime',
]

const toAvailableMethod = (value?: string | null): 'bank' | 'cash' | 'wallet' | 'airtime' | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) {
    return 'airtime'
  }
  if (
    token === 'mobile_wallet'
    || token === 'mobile_money'
    || token === 'wallet'
    || token.includes('wallet')
    || token.includes('mobile_money')
  ) {
    return 'wallet'
  }
  if (token === 'cash_pickup' || token === 'cash' || token.includes('cash')) {
    return 'cash'
  }
  if (
    token === 'bank_deposit'
    || token === 'bank_transfer'
    || token === 'bank_account'
    || token === 'bank'
    || token === 'account'
    || token === 'card'
    || token === 'card_deposit'
    || token === 'debit_card'
    || token === 'credit_card'
    || token.includes('bank')
    || token.includes('account')
    || token.includes('card')
  ) {
    return 'bank'
  }
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
let planeAPool: PlaneAContainer['pool']
let fxRateRepository: PlaneAContainer['repositories']['fxRate']
let latestQuoteRepository: PlaneAContainer['repositories']['latestQuote']
let rightsMatrixRepository: PlaneAContainer['repositories']['rightsMatrix']
let corridorPriorityRepository: PlaneAContainer['repositories']['corridorPriority']
let corridorCapabilityRepository: PlaneAContainer['repositories']['corridorCapability']
let goldIndicesRepository: PlaneAContainer['repositories']['goldIndices']

const INDICES_AMOUNT_BUCKET = config.indices.amountBucket

type ProviderWeightSnapshot = {
  weights: Map<string, number>
  globalWeights: Map<string, number>
  modelVersion: string
  weightConfidence: number | null
  weightWindowDays: number | null
}

type IndexPermissionFlags = {
  teer: boolean
  rci: boolean
  rvi: boolean
}

const providerWeightCache = createTtlCache<ProviderWeightSnapshot>({
  namespace: 'plane_a:provider_weights',
})

const normalizeProviderKey = (value?: string | null) => {
  if (!value) return ''
  return value.trim().toLowerCase()
}

const _loadIndexPermissions = async (
  providerIds: string[],
): Promise<Map<string, IndexPermissionFlags>> => {
  const normalized = Array.from(new Set(providerIds.map(normalizeProviderKey).filter(Boolean)))
  if (!normalized.length) return new Map()

  const rows = await rightsMatrixRepository.listIndexPermissionsByProviders(normalized)
  const permissions = new Map<string, IndexPermissionFlags>()
  for (const row of rows) {
    const providerId = normalizeProviderKey(row.provider_id)
    if (!providerId) continue
    const active =
      row.allowed_collect === true &&
      row.allowed_b2c === true &&
      row.stoplist_status === 'active'
    permissions.set(providerId, {
      teer: active && row.allowed_in_teer === true,
      rci: active && row.allowed_in_rci === true,
      rvi: active && row.allowed_in_rvi === true,
    })
  }
  return permissions
}

const _loadProviderWeights = async (
  corridorId: string,
  modelVersion: string,
): Promise<ProviderWeightSnapshot> => {
  const cacheKey = `${corridorId}:${modelVersion}`
  const cached = await providerWeightCache.get(cacheKey)
  if (cached) return cached

  const corridorResult = await query<{
    provider_id: string
    weight: number
    window_days: number | null
    weight_confidence: number | null
  }>(
    `SELECT provider_id, weight, window_days, weight_confidence
     FROM gold.provider_weight_snapshot
     WHERE corridor_id = $1 AND model_version = $2`,
    [corridorId, modelVersion],
    planeAPool,
  )

  const globalResult = await query<{
    provider_id: string
    weight: number
  }>(
    `SELECT provider_id, weight
     FROM gold.provider_weight_snapshot
     WHERE corridor_id = $1 AND model_version = $2`,
    [GLOBAL_WEIGHT_CORRIDOR_ID, modelVersion],
    planeAPool,
  )

  const weights = new Map<string, number>()
  const globalWeights = new Map<string, number>()
  for (const row of corridorResult.rows) {
    if (!row.provider_id || !Number.isFinite(row.weight)) continue
    weights.set(row.provider_id, Number(row.weight))
  }
  for (const row of globalResult.rows) {
    if (!row.provider_id || !Number.isFinite(row.weight)) continue
    globalWeights.set(row.provider_id, Number(row.weight))
  }

  const meta = corridorResult.rows[0]
  const snapshot: ProviderWeightSnapshot = {
    weights,
    globalWeights,
    modelVersion,
    weightConfidence: meta?.weight_confidence ?? null,
    weightWindowDays: meta?.window_days ?? null,
  }

  await providerWeightCache.set(cacheKey, snapshot, WEIGHT_SNAPSHOT_TTL_MS)
  return snapshot
}

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
  providerId?: string
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

type ProvidersResponseBase = {
  data: FrontendProviderQuote[]
  updatedAt: string | null
  corridor: string
  amount: number
  method: string
  bucketUsed?: number
  approximate?: boolean
  bucketDeltaPct?: number | null
  midMarketRate?: number | null
  midMarketSource?: string | null
  midMarketUpdatedAt?: string | null
  cache?: {
    ttl_seconds: number
    age_seconds: number | null
    fresh: boolean
  }
  availableMethods?: Array<'bank' | 'cash' | 'wallet' | 'airtime'>
  indices?: CorridorIndices
  indicesReason?: string | null
  providerQuotes?: ProviderQuoteResponse[]
}

type ProvidersResponse = ProvidersResponseBase & {
  comparisonId: string
  start: string
}

type CorridorIndices = {
  teer: number | null
  rvi_bps: number | null
  rci: number | null
  providerCount: number
  amount: number
  midMarketRate: number | null
  weights: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  source?: 'gold'
  updatedAt?: string | null
  indicesBucket?: number
  methodProfile?: string
  suppressionFlag?: boolean
  suppressionReason?: string | null
}

const providersCache = createTtlCache<ProvidersResponseBase>({ namespace: 'plane_a:providers' })
const _PROVIDER_WEIGHT_MODEL = config.indices.providerWeightModel || DEFAULT_WEIGHT_MODEL

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
  include_provider_quotes: z.coerce.boolean().optional(),
})

const DEFAULT_MAX_QUOTE_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)
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
  } catch (error) {
    logger.warn('provider_ids_by_country_load_failed', {
      source_country: sourceCountry,
      dest_country: destCountry,
      error: error instanceof Error ? error.message : String(error),
    })
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

const _computeCorridorIndices = (
  quotes: Array<{
    id: string
    providerId?: string
    fxRate: number
    fee: number
  }>,
  amount: number,
  midMarketRate: number | null,
  weights?: ProviderWeightSnapshot,
  allowlist?: Map<string, IndexPermissionFlags>,
): CorridorIndices => {
  let providerCountTeer = 0
  let providerCountRci = 0
  let providerCountRvi = 0
  let sumWeightRvi = 0
  let sumWeightSqRvi = 0
  let weightedEffectiveSumRvi = 0
  let weightedEffectiveSqSumRvi = 0
  let weightedCostSumTeer = 0
  let sumWeightCostTeer = 0
  let weightedCostSumRci = 0
  let sumWeightCostRci = 0
  const weightConfidence = weights?.weightConfidence
  const blend = weightConfidence !== null && weightConfidence !== undefined
    ? Math.min(1, Math.max(0, weightConfidence))
    : null
  const weightModel = weights?.modelVersion ?? DEFAULT_WEIGHT_MODEL
  const defaultAllow = !allowlist

  const resolveWeight = (providerKey?: string | null) => {
    if (!providerKey) return 1
    const key = providerKey.trim().toLowerCase()
    const corridorWeight = weights?.weights.get(key)
    const globalWeight = weights?.globalWeights.get(key)
    if (blend !== null && corridorWeight !== undefined && globalWeight !== undefined) {
      return blend * corridorWeight + (1 - blend) * globalWeight
    }
    if (corridorWeight !== undefined) return corridorWeight
    if (globalWeight !== undefined) return globalWeight
    return 1
  }

  for (const quote of quotes) {
    const rate = Number(quote.fxRate)
    const fee = Number(quote.fee)

    if (!Number.isFinite(amount) || amount <= 0) continue
    if (!Number.isFinite(rate) || rate <= 0) continue
    if (!Number.isFinite(fee) || fee < 0) continue

    const amountAfterFee = Math.max(amount - fee, 0)
    const effectiveRate = (amountAfterFee * rate) / amount
    if (!Number.isFinite(effectiveRate)) continue

    const providerKey = normalizeProviderKey(quote.providerId || quote.id)
    const weight = resolveWeight(providerKey)
    const flags = providerKey ? allowlist?.get(providerKey) : undefined
    const allowTeer = flags?.teer ?? defaultAllow
    const allowRci = flags?.rci ?? defaultAllow
    const allowRvi = flags?.rvi ?? defaultAllow

    if (allowRvi) {
      providerCountRvi += 1
      sumWeightRvi += weight
      sumWeightSqRvi += weight * weight
      weightedEffectiveSumRvi += weight * effectiveRate
      weightedEffectiveSqSumRvi += weight * effectiveRate * effectiveRate
    }

    if (allowTeer || allowRci) {
      if (midMarketRate && midMarketRate > 0) {
        const hiddenMarkup = (amountAfterFee * (midMarketRate - rate)) / midMarketRate
        const totalCost = fee + (Number.isFinite(hiddenMarkup) ? hiddenMarkup : 0)
        const ratio = totalCost / amount
        if (Number.isFinite(ratio)) {
          if (allowTeer) {
            providerCountTeer += 1
            weightedCostSumTeer += weight * ratio
            sumWeightCostTeer += weight
          }
          if (allowRci) {
            providerCountRci += 1
            weightedCostSumRci += weight * ratio
            sumWeightCostRci += weight
          }
        } else {
          if (allowTeer) providerCountTeer += 1
          if (allowRci) providerCountRci += 1
        }
      } else {
        if (allowTeer) providerCountTeer += 1
        if (allowRci) providerCountRci += 1
      }
    }
  }

  let rviValue: number | null = null
  if (providerCountRvi >= 2 && sumWeightRvi > 0) {
    const numerator = weightedEffectiveSqSumRvi - (weightedEffectiveSumRvi * weightedEffectiveSumRvi) / sumWeightRvi
    const denominator = sumWeightRvi - (sumWeightSqRvi / sumWeightRvi)
    if (denominator > 0) {
      const variance = numerator / denominator
      rviValue = Number.isFinite(variance) ? Math.sqrt(Math.max(0, variance)) : null
    }
  }

  let rci: number | null = null
  let teer: number | null = null
  if (midMarketRate && midMarketRate > 0) {
    if (sumWeightCostRci > 0) {
      rci = weightedCostSumRci / sumWeightCostRci
    }
    if (sumWeightCostTeer > 0) {
      const teerCostRatio = weightedCostSumTeer / sumWeightCostTeer
      const rawTeer = midMarketRate * (1 - teerCostRatio)
      teer = Number.isFinite(rawTeer) ? Math.max(0, rawTeer) : null
    }
  }

  const providerCount = Math.min(
    providerCountTeer || 0,
    providerCountRci || 0,
    providerCountRvi || 0,
  )

  if (teer === null && midMarketRate && midMarketRate > 0 && rci !== null) {
    const rawTeer = midMarketRate * (1 - rci)
    teer = Number.isFinite(rawTeer) ? Math.max(0, rawTeer) : null
  }

  const rvi_bps = (rviValue !== null && teer && teer > 0)
    ? (rviValue / teer) * 10000
    : null

  return {
    teer,
    rvi_bps,
    rci,
    providerCount,
    amount,
    midMarketRate: midMarketRate ?? null,
    weights: weightModel,
    weightConfidence: weights?.weightConfidence ?? null,
    weightWindowDays: weights?.weightWindowDays ?? null,
  }
}

const getBucketCandidates = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) return []
  return DEFAULT_AMOUNT_BUCKETS.includes(amount) ? [amount] : []
}

const getDynamicCacheTtl = async (corridorId: string): Promise<number> => {
  try {
    const volatilityService = new VolatilityService(planeAPool)
    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)
    return ttlResult.ttlSeconds
  } catch (error) {
    logger.warn('providers_volatility_ttl_failed', {
      corridor_id: corridorId,
      error: error instanceof Error ? error.message : String(error),
    })
    return DEFAULT_FALLBACK_TTL_SECONDS
  }
}


const getCorridorMaxAgeSeconds = async (corridorId: string) => {
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

const resolveIndicesMethodProfile = (
  method: 'bank' | 'cash' | 'wallet' | 'airtime',
): 'standard_bank' | 'cash_pickup' | 'standard_card' | null => {
  if (method === 'bank') return 'standard_bank'
  if (method === 'cash') return 'cash_pickup'
  return null
}

const formatTransferTime = (minMinutes: number | null, maxMinutes: number | null) => {
  if (minMinutes === null && maxMinutes === null) {
    return { min: 0, max: 0, label: 'Unknown' }
  }
  if (minMinutes === null) minMinutes = maxMinutes || 0
  if (maxMinutes === null) maxMinutes = minMinutes

  const minHrs = Math.round(minMinutes / 60)
  const maxHrs = Math.round(maxMinutes / 60)
  const minDays = Math.round(minHrs / 24)
  const maxDays = Math.round(maxHrs / 24)

  let label = ''
  if (minHrs === 0 && maxHrs === 0) {
    label = 'Instant'
  } else if (maxHrs >= 24) {
    if (minDays === maxDays) {
      label = `${minDays} ${minDays === 1 ? 'day' : 'days'}`
    } else {
      label = `${minDays}-${maxDays} days`
    }
  } else if (minHrs === maxHrs) {
    label = `${minHrs} ${minHrs === 1 ? 'hour' : 'hours'}`
  } else {
    label = `${minHrs}-${maxHrs} ${maxHrs === 1 ? 'hour' : 'hours'}`
  }

  return { min: minHrs, max: maxHrs, label }
}

const transformQuote = (quote: LatestQuoteByCorridorRecord): TransformedQuote => {
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
    transferTime: {
      min: transferTime.min,
      max: transferTime.max,
    },
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

type TransformedQuote = ProviderQuoteResponse['quotes'][0] & { 
  deliveryLabel: string
  originalQuote: LatestQuoteByCorridorRecord 
}

const groupQuotesByProvider = (
  quotes: LatestQuoteByCorridorRecord[],
): Array<{ psp: ProviderQuoteResponse['psp']; quotes: TransformedQuote[] }> => {
  const providerMap = new Map<string, { metadata: ProviderQuoteResponse['psp']; quotes: TransformedQuote[] }>()
  const logoBaseUrl = LOGO_BASE_URL

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
            sm: toAbsoluteUrl(metadata.logo.sm, logoBaseUrl),
            ico: toAbsoluteUrl(metadata.logo.ico, logoBaseUrl),
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

const providersGetSchema = {
  tags: ['Providers'],
  summary: 'Compare provider quotes for a corridor and amount bucket',
  querystring: {
    type: 'object',
    properties: {
      from: { type: 'string' },
      to: { type: 'string' },
      fromCurrency: { type: 'string' },
      toCurrency: { type: 'string' },
      amount: { type: 'number' },
      method: { type: 'string' },
      corridor_id: { type: 'string' },
      amount_bucket: { type: 'number' },
      payout: { type: 'string' },
      live: { type: 'boolean' },
      include_provider_quotes: { type: 'boolean' },
      // Historical param; tolerated.
      include_provider_quotes_v2: { type: 'boolean' },
    },
    additionalProperties: true,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        comparisonId: { type: 'string' },
        start: { type: 'string' },
        updatedAt: { type: ['string', 'null'] },
        corridor: { type: 'string' },
        amount: { type: 'number' },
        method: { type: ['string', 'null'] },
        bucketUsed: { type: 'number' },
        approximate: { type: 'boolean' },
        bucketDeltaPct: { type: ['number', 'null'] },
        midMarketRate: { type: ['number', 'null'] },
        midMarketSource: { type: ['string', 'null'] },
        midMarketUpdatedAt: { type: ['string', 'null'] },
        cache: {
          type: 'object',
          properties: {
            ttl_seconds: { type: 'number' },
            age_seconds: { type: 'number' },
            fresh: { type: 'boolean' },
          },
          required: ['ttl_seconds', 'age_seconds', 'fresh'],
        },
        availableMethods: { type: 'array', items: { type: 'string' } },
        indices: {},
        indicesReason: { type: ['string', 'null'] },
        data: { type: 'array', items: { type: 'object', additionalProperties: true } },
        providerQuotes: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
      required: ['comparisonId', 'start', 'updatedAt', 'corridor', 'amount', 'bucketUsed', 'approximate', 'data', 'cache', 'availableMethods'],
      additionalProperties: true,
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        details: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
      required: ['error'],
      additionalProperties: true,
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        corridor: { type: 'string' },
      },
      required: ['error', 'message'],
      additionalProperties: true,
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['error', 'message'],
      additionalProperties: true,
    },
  },
} as const

export const providersListRoutes = async (app: FastifyInstance) => {
  const { pool, repositories } = app.container as PlaneAContainer
  planeAPool = pool
  fxRateRepository = repositories.fxRate
  latestQuoteRepository = repositories.latestQuote
  rightsMatrixRepository = repositories.rightsMatrix
  corridorPriorityRepository = repositories.corridorPriority
  corridorCapabilityRepository = repositories.corridorCapability
  goldIndicesRepository = repositories.goldIndices

  app.get('/providers', { schema: providersGetSchema }, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const {
      from,
      to,
      fromCurrency,
      toCurrency,
      amount,
      method,
      corridor_id,
      amount_bucket,
      payout,
      live,
      include_provider_quotes,
    } = parsed.data
    const bypassCache = live === true
    const includeProviderQuotes = include_provider_quotes === true
    const comparisonId = randomUUID()
    const start = new Date().toISOString()

    let corridorId = corridor_id
    let amountBucket = amount_bucket
    let requestedAmount = amount
    let approximate = false
    const maxBucketDeltaPct = Math.max(0, config.planeA.b2c.maxBucketDeltaPct ?? 0)

    if (amountBucket !== undefined && !DEFAULT_AMOUNT_BUCKETS.includes(amountBucket)) {
            throw new ValidationError('Invalid request', { details: {
        error: 'bad_request',
        details: [{ message: 'amount_bucket must be a supported bucket', allowed_buckets: DEFAULT_AMOUNT_BUCKETS }],
      } })
    }

    const normalizedFromCurrency = normalizeCurrencyCode(fromCurrency)
    const normalizedToCurrency = normalizeCurrencyCode(toCurrency)

    if (fromCurrency && !normalizedFromCurrency) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] } })
    }

    if (toCurrency && !normalizedToCurrency) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] } })
    }

    if (from && to && amount !== undefined) {
      const sourceCountry = getCountryByCode(from.toUpperCase())
      const destCountry = getCountryByCode(to.toUpperCase())
      
      if (!sourceCountry || !destCountry) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid country codes' }] } })
      }

      if (normalizedFromCurrency && !isCurrencyAllowedForRequest(sourceCountry.code, normalizedFromCurrency, 'source')) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] } })
      }

      if (normalizedToCurrency && !isCurrencyAllowedForRequest(destCountry.code, normalizedToCurrency, 'destination')) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] } })
      }

      const sourceCurrency = normalizedFromCurrency ?? sourceCountry.currency
      const destCurrency = normalizedToCurrency ?? destCountry.currency
      corridorId = `${from.toUpperCase()}-${to.toUpperCase()}-${sourceCurrency}-${destCurrency}`

      if (!Number.isFinite(amount) || amount <= 0) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'amount must be a positive number' }] } })
      }

      const minAmount = getMinAmount(sourceCurrency)
      const maxAmount = getMaxAmount(sourceCurrency)
      if (amount < minAmount) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: `amount must be >= ${minAmount} ${sourceCurrency}` }] } })
      }
      if (amount > maxAmount) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: `amount must be <= ${maxAmount} ${sourceCurrency}` }] } })
      }

      const bucketSelection = computeBucketSelection(amount)
      amountBucket = bucketSelection.bucket_used
      approximate = bucketSelection.approximate
      requestedAmount = amount

      if (maxBucketDeltaPct === 0 && bucketSelection.approximate) {
                throw new ValidationError('Invalid request', { details: {
          error: 'bad_request',
          details: [{
            message: 'amount must match a supported bucket',
            allowed_buckets: DEFAULT_AMOUNT_BUCKETS,
          }],
        } })
      }
      if (
        maxBucketDeltaPct > 0
        && bucketSelection.delta_pct !== null
        && bucketSelection.delta_pct > maxBucketDeltaPct
      ) {
                throw new ValidationError('Invalid request', { details: {
          error: 'bad_request',
          details: [{
            message: 'amount too far from supported buckets',
            allowed_buckets: DEFAULT_AMOUNT_BUCKETS,
          }],
        } })
      }
    }

    if (!corridorId || amountBucket === undefined) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'missing required parameters' }] } })
    }

    const amountKey = requestedAmount ?? amountBucket
    const requestedMethod = resolveRequestedMethod(method, payout)
    const availableMethods = new Set<'bank' | 'cash' | 'wallet' | 'airtime'>()
    const methodsByProvider = new Map<string, Set<'bank' | 'cash' | 'wallet' | 'airtime'>>()

    try {
      const maxAgeSeconds = await getCorridorMaxAgeSeconds(corridorId)
      const dynamicCacheTtlSeconds = await getDynamicCacheTtl(corridorId)
      const cacheTtlSeconds = maxAgeSeconds > 0
        ? Math.min(dynamicCacheTtlSeconds, maxAgeSeconds)
        : dynamicCacheTtlSeconds
      const cacheKey = `providers:${corridorId}:${amountBucket}:${maxAgeSeconds}:${includeProviderQuotes ? 'with_provider_quotes' : 'flat'}`
      if (!bypassCache) {
        const cached = await providersCache.get(cacheKey)
        if (cached !== null) {
          logger.debug('providers_cache_hit', { cache_key: cacheKey })
          return { ...cached, comparisonId, start }
        }
      }

      const corridorParts = parseCorridorId(corridorId)
      if (!corridorParts) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid corridor_id' }] } })
      }
      const sourceCountry = corridorParts.sourceCountry.toUpperCase()
      const destCountry = corridorParts.destCountry.toUpperCase()
      const sourceCurrency = corridorParts.sourceCurrency.toUpperCase()
      const destCurrency = corridorParts.destCurrency.toUpperCase()
      const defaultDestCurrency = getCountryByCode(destCountry)?.currency?.toUpperCase() ?? null
      const isNonDefaultDestCurrency = Boolean(defaultDestCurrency && destCurrency !== defaultDestCurrency)
      if (!isCurrencyAllowedForRequest(sourceCountry, sourceCurrency, 'source')) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid fromCurrency' }] } })
      }
      if (!isCurrencyAllowedForRequest(destCountry, destCurrency, 'destination')) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'invalid toCurrency' }] } })
      }

      if (!Number.isFinite(amountKey) || amountKey <= 0) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: 'amount must be a positive number' }] } })
      }
      const minAmount = getMinAmount(sourceCurrency)
      const maxAmount = getMaxAmount(sourceCurrency)
      if (amountKey < minAmount) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: `amount must be >= ${minAmount} ${sourceCurrency}` }] } })
      }
      if (amountKey > maxAmount) {
                throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: [{ message: `amount must be <= ${maxAmount} ${sourceCurrency}` }] } })
      }

      const supportedProviderIds = await loadActiveB2cProviderIdsByCountry(
        sourceCountry,
        destCountry,
      )
      const supportedProviderSet = new Set(
        supportedProviderIds.map(id => normalizeProviderId(id)).filter(Boolean),
      )
      const capabilityMethods = new Set<'bank' | 'cash' | 'wallet' | 'airtime'>()
      const capabilityProviderSet = new Set<string>()

      try {
        const capabilityRows = await corridorCapabilityRepository.listByCorridor(corridorId)
        for (const row of capabilityRows) {
          if (!row?.is_supported) continue
          const providerId = row.provider_id ? normalizeProviderId(row.provider_id) : ''
          if (!providerId) continue
          if (supportedProviderSet.size && !supportedProviderSet.has(providerId)) continue
          capabilityProviderSet.add(providerId)
          const metadata = getProviderMetadata(providerId)
          if (!metadata || metadata.type === 'BANK') continue
          const providerKey = metadata?.slug ?? null
          const payoutMethods = Array.isArray(row.payout_methods) ? row.payout_methods : []
          for (const payoutMethod of payoutMethods) {
            const methodValue = toAvailableMethod(payoutMethod)
            if (!methodValue) continue
            capabilityMethods.add(methodValue)
            if (providerKey) {
              if (!methodsByProvider.has(providerKey)) {
                methodsByProvider.set(providerKey, new Set())
              }
              methodsByProvider.get(providerKey)!.add(methodValue)
            }
          }
        }
      } catch (error) {
        logger.warn('capability_methods_lookup_failed', {
          corridor_id: corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      if (isNonDefaultDestCurrency && capabilityProviderSet.size === 0) {
                throw new NotFoundError('Not found', { details: {
          error: 'corridor_unsupported',
          message: 'No providers support this currency for the selected corridor.',
          corridor: corridorId,
        } })
      }

      const allowedProviderSet = capabilityProviderSet.size
        ? capabilityProviderSet
        : supportedProviderSet

      if (!allowedProviderSet.size) {
                throw new NotFoundError('Not found', { details: {
          error: 'corridor_unsupported',
          message: 'No providers currently support this corridor.',
          corridor: corridorId,
        } })
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
        const candidates = getBucketCandidates(requestedAmount)
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

      if (allowedProviderSet.size) {
        quotes = quotes.filter((quote) => {
          const providerId = quote.provider_id ? normalizeProviderId(quote.provider_id) : ''
          return providerId && allowedProviderSet.has(providerId)
        })
      }

      quotes = quotes.filter((quote) => {
        const metadata = getProviderMetadata(quote.provider_id)
        return metadata && metadata.type !== 'BANK'
      })

      for (const quote of quotes) {
        const methodValue = toAvailableMethod(quote.payout)
        if (!methodValue) continue
        availableMethods.add(methodValue)
        const metadata = getProviderMetadata(quote.provider_id)
        if (!metadata || metadata.type === 'BANK') continue
        const key = metadata.slug
        if (!methodsByProvider.has(key)) {
          methodsByProvider.set(key, new Set())
        }
        methodsByProvider.get(key)!.add(methodValue)
      }

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

      if (!quotes.length) {
        const message = 'Quotes are being collected for this corridor. Please try again shortly.'
        return {
          comparisonId,
          start,
          error: { code: 'quotes_unavailable', message },
          message,
          updatedAt: null,
          corridor: corridorId,
          amount: requestedAmount || amountBucket,
          method: requestedMethod,
          bucketUsed,
          approximate,
          bucketDeltaPct: (requestedAmount && approximate && requestedAmount > 0)
            ? Math.abs(bucketUsed - requestedAmount) / requestedAmount
            : null,
          midMarketRate: midMarketRate ?? null,
          midMarketSource: midMarketSource ?? null,
          midMarketUpdatedAt,
          data: [],
          cache: {
            ttl_seconds: cacheTtlSeconds,
            age_seconds: null,
            fresh: false,
          },
          availableMethods: orderMethods(availableMethods),
          indicesReason: 'quotes_unavailable',
        }
      }

      const providerQuotes = groupQuotesByProvider(quotes)
      const providerQuotesPayload = includeProviderQuotes
        ? providerQuotes.map((pq) => ({
            psp: pq.psp,
            quotes: pq.quotes.map(
              ({ deliveryLabel: _deliveryLabel, originalQuote: _originalQuote, ...quotePayload }) =>
                quotePayload,
            ),
          }))
        : undefined

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
        const methods = (providerMethods && providerMethods.size
          ? orderMethods(providerMethods)
          : (() => {
              const fallback = toAvailableMethod(quote.originalQuote.payout)
              return fallback ? [fallback] : ['bank']
            })()) as FrontendProviderQuote['methods']

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
          providerId: normalizeProviderId(quote.originalQuote.provider_id),
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
          const methodValue = toAvailableMethod(method)
          if (methodValue) {
            availableMethods.add(methodValue)
          }
        }
      }

      let latestCollectedAt: string | null = null
      if (quotes.length) {
        let latestTs = 0
        for (const quote of quotes) {
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

      const cacheAgeSeconds = latestCollectedAt
        ? Math.max(0, Math.round((Date.now() - new Date(latestCollectedAt).getTime()) / 1000))
        : null
      const cacheFresh = cacheAgeSeconds !== null
        ? (maxAgeSeconds > 0 ? cacheAgeSeconds <= maxAgeSeconds : true)
        : false

      let indices: CorridorIndices | undefined
      let indicesReason: string | null = null
      const indicesMethodProfile = resolveIndicesMethodProfile(requestedMethod)

      if (!indicesMethodProfile) {
        indicesReason = 'unsupported_method'
      } else if (bucketUsed !== INDICES_AMOUNT_BUCKET) {
        indicesReason = 'bucket_mismatch'
      } else {
        try {
          const latest = await goldIndicesRepository.getIndicesLatest({
            corridorId,
            amountBucket: INDICES_AMOUNT_BUCKET,
            methodProfile: indicesMethodProfile,
          })

          if (!latest) {
            indicesReason = 'gold_indices_unavailable'
          } else {
            const suppressed = latest.suppression_flag === true
            if (suppressed) {
              indicesReason = latest.suppression_reason || 'suppressed'
            }
            indices = {
              teer: suppressed ? null : latest.teer_rate ?? null,
              rvi_bps: suppressed ? null : latest.rvi_bps ?? null,
              rci: suppressed ? null : latest.rci_ratio ?? null,
              providerCount: Number(latest.provider_count ?? latest.provider_count_binned ?? 0),
              amount: INDICES_AMOUNT_BUCKET,
              midMarketRate: suppressed ? null : latest.mid_market_rate ?? null,
              weights: latest.weighting_model || DEFAULT_WEIGHT_MODEL,
              weightConfidence: latest.weight_confidence ?? null,
              weightWindowDays: latest.weight_window_days ?? null,
              source: 'gold',
              updatedAt: latest.created_at ? latest.created_at.toISOString() : null,
              indicesBucket: INDICES_AMOUNT_BUCKET,
              methodProfile: indicesMethodProfile,
              suppressionFlag: latest.suppression_flag,
              suppressionReason: latest.suppression_reason ?? null,
            }
          }
        } catch (error) {
          logger.warn('gold_indices_latest_failed', {
            corridor_id: corridorId,
            error: error instanceof Error ? error.message : String(error),
          })
          indicesReason = 'gold_indices_unavailable'
        }
      }

      const responseBase: ProvidersResponseBase = {
        data: flattenedQuotes,
        updatedAt: latestCollectedAt ?? null,
        corridor: corridorId,
        amount: requestedAmount || amountBucket,
        method: requestedMethod,
        bucketUsed,
        approximate,
        bucketDeltaPct: (requestedAmount && approximate && requestedAmount > 0)
          ? Math.abs(bucketUsed - requestedAmount) / requestedAmount
          : null,
        midMarketRate: midMarketRate ?? null,
        midMarketSource: midMarketSource ?? null,
        midMarketUpdatedAt,
        cache: {
          ttl_seconds: cacheTtlSeconds,
          age_seconds: cacheAgeSeconds,
          fresh: cacheFresh,
        },
        availableMethods: orderMethods(availableMethods),
        indices,
        indicesReason,
      }

      if (providerQuotesPayload) {
        responseBase.providerQuotes = providerQuotesPayload
      }

      const response: ProvidersResponse = {
        ...responseBase,
        comparisonId,
        start,
      }

      if (!bypassCache) {
        const ttlMs = Math.max(0, cacheTtlSeconds * 1000)
        await providersCache.set(cacheKey, responseBase, ttlMs)
      }

      try {
        recordQuoteRequest(corridorId, bucketUsed)
        recordSearch(sourceCountry, destCountry)
      } catch (error) {
        logger.debug('provider_list_metrics_record_failed', {
          corridor_id: corridorId,
          source_country: sourceCountry,
          dest_country: destCountry,
          error: error instanceof Error ? error.message : String(error),
        })
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
