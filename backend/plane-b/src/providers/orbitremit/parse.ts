import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import {
  getRecipientTypesForCurrency,
  mapPayinMethod,
  mapRecipientTypeToPayoutMethod,
} from './code-map'

type OrbitRemitRateAttributes = {
  send_currency?: string | null
  payout_currency?: string | null
  base_currency?: string | null
  send_amount?: string | number | null
  payout_amount?: string | number | null
  rate?: string | number | null
  promotion_rate?: string | number | null
  promotion_threshold?: string | number | null
  standard_rate?: string | number | null
  standard_send_amount?: string | number | null
  standard_payout_amount?: string | number | null
}

type OrbitRemitRateResponse = {
  type?: string | null
  data?: {
    data?: {
      attributes?: OrbitRemitRateAttributes | null
    } | null
  } | null
  warning?: string | null
}

type OrbitRemitFeeData = {
  fee?: string | number | null
  send_currency?: string | null
  payout_currency?: string | null
  send_amount?: string | number | null
  recipient_type?: string | null
}

type OrbitRemitFeeResponse = {
  code?: number | string | null
  status?: string | null
  data?: OrbitRemitFeeData | null
}

export type OrbitRemitPayload = {
  rate?: OrbitRemitRateResponse | string | null
  fee?: OrbitRemitFeeResponse | string | null
  meta?: {
    recipientType?: string | null
    requestedRecipientType?: string | null
    availableRecipientTypes?: string[] | null
  } | null
}

export type OrbitRemitParsedQuote = {
  send_amount: number
  receive_amount: number
  fee_amount: number
  total_debit_amount: number
  payin_method: string
  payout_method: string
  fee_currency: string | null
  promotional_fee_amount: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  collected_at: string
  parser_version: string
  parse_flags: QualityFlag[]
}

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const getRateAttributes = (payload: OrbitRemitPayload): OrbitRemitRateAttributes | null => {
  if (!payload?.rate || typeof payload.rate !== 'object') return null
  const rate = payload.rate as OrbitRemitRateResponse
  if (rate.type && rate.type !== 'success') return null
  const attributes = rate.data?.data?.attributes ?? null
  return attributes && typeof attributes === 'object' ? attributes : null
}

const getFeeData = (payload: OrbitRemitPayload): OrbitRemitFeeData | null => {
  if (!payload?.fee || typeof payload.fee !== 'object') return null
  const fee = payload.fee as OrbitRemitFeeResponse
  if (fee.status && fee.status !== 'success') return null
  const data = fee.data ?? null
  return data && typeof data === 'object' ? data : null
}

const resolveDestCurrency = (
  payload: OrbitRemitPayload,
  request?: CollectorRequest,
): string | null => {
  const attributes = getRateAttributes(payload)
  const feeData = getFeeData(payload)
  return (
    attributes?.payout_currency
    ?? feeData?.payout_currency
    ?? (request ? requireCorridorId(request.corridor_id).destCurrency : null)
  )
}

export const extractOrbitRemitMethodPairs = (
  payload: OrbitRemitPayload,
  request?: CollectorRequest,
) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const destCurrency = resolveDestCurrency(payload, request)
  const recipientTypes = getRecipientTypesForCurrency(destCurrency ?? undefined)
  const payinMethod = 'bank_transfer'

  const addPair = (recipientType?: string | null) => {
    const payout = mapRecipientTypeToPayoutMethod(recipientType)
    if (!payout || payout === 'other') return
    const key = `${payinMethod}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payinMethod, payout_method: payout })
    }
  }

  if (recipientTypes.length > 0) {
    for (const recipientType of recipientTypes) {
      addPair(recipientType)
    }
  } else {
    const feeData = getFeeData(payload)
    addPair(feeData?.recipient_type ?? payload.meta?.recipientType ?? null)
  }

  if (pairs.size === 0) {
    addPair(payload.meta?.requestedRecipientType ?? null)
  }

  return Array.from(pairs.values())
}

export const parseOrbitRemitPayload = (
  payload: OrbitRemitPayload,
  request: CollectorRequest,
): OrbitRemitParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const rateAttributes = getRateAttributes(payload)
  if (!rateAttributes) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency, destCurrency } = requireCorridorId(request.corridor_id)
  const sendCurrency = rateAttributes.send_currency ?? sourceCurrency

  const sendAmountRaw = parseNumber(rateAttributes.send_amount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const rateRaw = parseNumber(rateAttributes.rate)
  const promotionalRateRaw = parseNumber(rateAttributes.promotion_rate ?? rateAttributes.rate)
  const baseRateRaw = parseNumber(rateAttributes.standard_rate)

  const receiveAmountRaw = parseNumber(rateAttributes.payout_amount)
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(promotionalRateRaw)
      ? sendAmount * promotionalRateRaw
      : Number.isFinite(baseRateRaw)
        ? sendAmount * baseRateRaw
        : Number.isFinite(rateRaw)
          ? sendAmount * rateRaw
          : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(promotionalRateRaw) && !Number.isFinite(baseRateRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  const feeData = getFeeData(payload)
  const feeAmountRaw = parseNumber(feeData?.fee)
  if (!Number.isFinite(feeAmountRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  const requestedPayin = mapPayinMethod(request.payin_method)
  const payinMethod = requestedPayin !== 'other'
    ? requestedPayin
    : 'bank_transfer'
  if (requestedPayin !== 'other' && requestedPayin !== payinMethod) {
    flags.push(qualityFlags.partial_data)
  }

  const recipientType = feeData?.recipient_type
    ?? payload.meta?.recipientType
    ?? payload.meta?.requestedRecipientType
  const payoutMethodRaw = mapRecipientTypeToPayoutMethod(recipientType)
  const payoutMethod = payoutMethodRaw !== 'other'
    ? payoutMethodRaw
    : request.payout_method || 'bank_deposit'

  if (request.payout_method && payoutMethod !== request.payout_method) {
    flags.push(qualityFlags.partial_data)
  }

  const availableRecipientTypes = payload.meta?.availableRecipientTypes
    ?? getRecipientTypesForCurrency(destCurrency)
  if (
    recipientType
    && Array.isArray(availableRecipientTypes)
    && availableRecipientTypes.length > 0
    && !availableRecipientTypes.includes(recipientType)
  ) {
    flags.push(qualityFlags.partial_data)
  }

  const promotionalCapRaw = parseNumber(rateAttributes.promotion_threshold)

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmountRaw) ? feeAmountRaw : 0,
    total_debit_amount: sendAmount + (Number.isFinite(feeAmountRaw) ? feeAmountRaw : 0),
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sendCurrency ?? sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
    base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
    promotional_cap_amount: Number.isFinite(promotionalCapRaw) ? promotionalCapRaw : null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'orbitremit_estimates_v1',
    parse_flags: flags,
  }
}
