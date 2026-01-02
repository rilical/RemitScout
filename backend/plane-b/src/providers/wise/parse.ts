import type { CollectorRequest } from '../../collectors/types'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type WisePaymentOption = {
  payIn?: string | null
  payOut?: string | null
  disabled?: boolean
  sourceAmount?: number
  targetAmount?: number
  sourceCurrency?: string
  targetCurrency?: string
  estimatedDelivery?: string | null
  formattedEstimatedDelivery?: string | null
  fee?: {
    total?: number
    discount?: number
    transferwise?: number
    payIn?: number
  }
  price?: {
    total?: {
      value?: {
        amount?: number
        currency?: string
      }
    }
  }
}

type WisePayload = {
  paymentOptions?: WisePaymentOption[]
  rate?: number
  createdTime?: string
  rateTimestamp?: string
  status?: string
  error?: string
  errorCode?: string
  message?: string
}

export type WiseParsedQuote = {
  send_amount: number
  receive_amount: number
  fee_amount: number
  total_debit_amount: number
  payin_method: string
  payout_method: string
  fee_currency: string | null
  exchange_rate: number | null
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

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  return payinMethodMap[token.toUpperCase()] ?? payinMethodMap[token] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  return payoutMethodMap[token.toUpperCase()] ?? payoutMethodMap[token] ?? 'other'
}

const parseNumber = (value?: number | string | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const parseDeliveryMinutes = (
  estimated?: string | null,
  reference?: string | null,
  formatted?: string | null,
) => {
  const parsedEstimated = estimated ? Date.parse(estimated) : Number.NaN
  const parsedReference = reference ? Date.parse(reference) : Number.NaN
  if (Number.isFinite(parsedEstimated) && Number.isFinite(parsedReference)) {
    const diffMinutes = Math.max(0, Math.round((parsedEstimated - parsedReference) / 60000))
    return { min: diffMinutes, max: diffMinutes }
  }

  if (formatted) {
    const lower = formatted.toLowerCase()
    if (lower.includes('in seconds')) {
      return { min: 0, max: 1 }
    }
    const minutesMatch = lower.match(/in\s+(\d+)\s+minutes?/)
    if (minutesMatch) {
      const minutes = Number(minutesMatch[1])
      return { min: minutes, max: minutes }
    }
    const hoursMatch = lower.match(/in\s+(\d+)\s+hours?/)
    if (hoursMatch) {
      const minutes = Number(hoursMatch[1]) * 60
      return { min: minutes, max: minutes }
    }
  }

  return { min: null, max: null }
}

export const extractWiseMethodPairs = (payload: WisePayload) => {
  const options = payload.paymentOptions ?? []
  return options
    .filter(option => !option.disabled)
    .map(option => ({
      payin_method: mapPayin(option.payIn),
      payout_method: mapPayout(option.payOut),
    }))
}

const selectPaymentOption = (
  payload: WisePayload,
  request: CollectorRequest,
  flags: QualityFlag[],
) => {
  const options = (payload.paymentOptions ?? []).filter(option => !option.disabled)
  if (!options.length) return null

  const desiredPayin = request.payin_method && request.payin_method !== 'other'
    ? request.payin_method
    : null
  const desiredPayout = request.payout_method && request.payout_method !== 'other'
    ? request.payout_method
    : null

  const match = options.find(option => {
    const payin = mapPayin(option.payIn)
    const payout = mapPayout(option.payOut)
    return (!desiredPayin || payin === desiredPayin) && (!desiredPayout || payout === desiredPayout)
  })

  if (match) return match

  flags.push(qualityFlags.partial_data)
  return options[0]
}

export const parseWisePayload = (
  payload: WisePayload,
  request: CollectorRequest,
): WiseParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || payload.error || payload.errorCode) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const selected = selectPaymentOption(payload, request, flags)
  if (!selected) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const sendAmount = parseNumber(selected.sourceAmount)
  const receiveAmount = parseNumber(selected.targetAmount)
  const feeTotal = parseNumber(selected.fee?.total ?? selected.price?.total?.value?.amount)
  const feeDiscount = parseNumber(selected.fee?.discount)
  const baseRate = parseNumber(payload.rate)
  const feeCurrency = selected.price?.total?.value?.currency ?? selected.sourceCurrency ?? null
  const { min: deliveryMin, max: deliveryMax } = parseDeliveryMinutes(
    selected.estimatedDelivery ?? null,
    payload.createdTime ?? payload.rateTimestamp ?? null,
    selected.formattedEstimatedDelivery ?? null,
  )

  const hasDiscount = Number.isFinite(feeDiscount) && feeDiscount > 0
  const feeAmount = Number.isFinite(feeTotal)
    ? hasDiscount
      ? feeTotal + feeDiscount
      : feeTotal
    : Number.NaN
  const promotionalFeeAmount = Number.isFinite(feeTotal) && hasDiscount ? feeTotal : null

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(baseRate)) {
    flags.push(qualityFlags.partial_data)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: sendAmount + (promotionalFeeAmount ?? (Number.isFinite(feeAmount) ? feeAmount : 0)),
    payin_method: mapPayin(selected.payIn),
    payout_method: mapPayout(selected.payOut),
    fee_currency: feeCurrency,
    exchange_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: deliveryMin,
    delivery_time_max_minutes: deliveryMax,
    collected_at: new Date().toISOString(),
    parser_version: 'wise_v1',
    parse_flags: flags,
  }
}
