import type { CollectorRequest } from '../../collectors/types'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type RemitlyCurrency = {
  alpha3?: string | null
}

type RemitlyConduit = {
  source_country?: string | null
  target_country?: string | null
  source_currency?: RemitlyCurrency | null
  target_currency?: RemitlyCurrency | null
}

type RemitlyExchangeRate = {
  promotional_exchange_rate?: string | null
  base_rate?: string | null
  capped_promotional_exchange_rate_amount?: string | null
}

type RemitlyDiscount = {
  fee_discount_amount?: string | null
  send_discount_amount?: string | null
}

type RemitlyFee = {
  total_fee_amount?: string | null
}

type RemitlyEstimate = {
  conduit?: RemitlyConduit | null
  exchange_rate?: RemitlyExchangeRate | null
  fee?: RemitlyFee | null
  discount?: RemitlyDiscount | null
  pay_in_method?: string | null
  pay_out_method?: string | null
  receive_amount?: string | null
  send_amount?: string | null
  total_charge_amount?: string | null
}

type RemitlyPayload = {
  estimate?: RemitlyEstimate | null
  pay_out_price_estimates?: {
    estimates?: RemitlyEstimate[] | null
  } | null
}

export type RemitlyParsedQuote = {
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
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  return payinMethodMap[code] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  return payoutMethodMap[code] ?? 'other'
}

/**
 * Determines delivery time based on payment method (following Monito's logic):
 * - Bank transfers: 1-3 days (1440-4320 minutes)
 * - Card payments (debit/credit): In minutes (15-60 minutes)
 */
const getDeliveryTimeForPayinMethod = (payinMethod: string): {
  min: number | null
  max: number | null
} => {
  if (payinMethod === 'bank_transfer') {
    // Bank transfers: 1-3 days
    return { min: 1440, max: 4320 }
  }

  if (payinMethod === 'debit_card' || payinMethod === 'credit_card') {
    // Card payments: In minutes (typically 15-60 minutes)
    return { min: 15, max: 60 }
  }

  // Default: unknown delivery time
  return { min: null, max: null }
}

/**
 * Determines which exchange rate to use based on payment method (following Monito's logic):
 * - Bank transfers: Use promotional rate (better rate)
 * - Card payments (debit/credit): Use base rate
 */
const getEffectiveExchangeRate = (
  payinMethod: string,
  promotionalRate: number | null,
  baseRate: number | null,
): number | null => {
  if (payinMethod === 'bank_transfer') {
    // Bank transfers use promotional rate if available
    return promotionalRate ?? baseRate
  }

  // Card payments use base rate
  return baseRate
}

const getEstimates = (payload: RemitlyPayload): RemitlyEstimate[] => {
  const list = payload.pay_out_price_estimates?.estimates
  if (Array.isArray(list) && list.length > 0) return list
  if (payload.estimate) return [payload.estimate]
  return []
}

export const extractRemitlyMethodPairs = (payload: RemitlyPayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  for (const estimate of getEstimates(payload)) {
    const payin = mapPayin(estimate.pay_in_method)
    const payout = mapPayout(estimate.pay_out_method)
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }
  return Array.from(pairs.values())
}

const selectEstimate = (
  estimates: RemitlyEstimate[],
  request: CollectorRequest,
): { estimate: RemitlyEstimate | null; parse_flags: QualityFlag[] } => {
  const flags: QualityFlag[] = []

  if (!estimates.length) {
    flags.push(qualityFlags.parse_error)
    return { estimate: null, parse_flags: flags }
  }

  const requestedPayin = request.payin_method
  const requestedPayout = request.payout_method

  if (requestedPayin && requestedPayout) {
    const match = estimates.find((item) => {
      const payin = mapPayin(item.pay_in_method)
      const payout = mapPayout(item.pay_out_method)
      return payin === requestedPayin && payout === requestedPayout
    })
    if (match) return { estimate: match, parse_flags: flags }
  }

  flags.push(qualityFlags.partial_data)
  return { estimate: estimates[0], parse_flags: flags }
}

export const parseRemitlyPayload = (
  payload: RemitlyPayload,
  request: CollectorRequest,
): RemitlyParsedQuote | null => {
  const estimates = getEstimates(payload)
  const { estimate, parse_flags } = selectEstimate(estimates, request)
  if (!estimate) return null

  const sendAmount = parseNumber(estimate.send_amount)
  const receiveAmount = parseNumber(estimate.receive_amount)
  const feeAmount = parseNumber(estimate.fee?.total_fee_amount)
  const totalChargeAmount = parseNumber(estimate.total_charge_amount)
  const promotionalRate = parseNumber(estimate.exchange_rate?.promotional_exchange_rate)
  const baseRate = parseNumber(estimate.exchange_rate?.base_rate)
  const promotionalCapAmount = parseNumber(
    estimate.exchange_rate?.capped_promotional_exchange_rate_amount,
  )
  const feeDiscountAmount = parseNumber(estimate.discount?.fee_discount_amount)

  const payin = mapPayin(estimate.pay_in_method)
  const payout = mapPayout(estimate.pay_out_method)
  const feeCurrency = estimate.conduit?.source_currency?.alpha3 ?? null

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
    parse_flags.push(qualityFlags.parse_error)
  }

  const promotionalFeeAmount = Number.isFinite(feeDiscountAmount) && feeDiscountAmount > 0
    ? feeDiscountAmount
    : null

  // Determine delivery time based on payment method (Monito logic)
  const deliveryTime = getDeliveryTimeForPayinMethod(payin)

  // Determine effective exchange rate based on payment method (Monito logic)
  // Bank transfers use promotional rate, cards use base rate
  const effectiveRate = getEffectiveExchangeRate(payin, promotionalRate, baseRate)

  // Store both rates for reference, but note which one is being used
  // The effective rate logic matches Monito's display behavior
  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(totalChargeAmount)
      ? totalChargeAmount
      : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
        ? sendAmount + feeAmount
        : sendAmount,
    payin_method: payin,
    payout_method: payout,
    fee_currency: feeCurrency,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: Number.isFinite(promotionalCapAmount) ? promotionalCapAmount : null,
    delivery_time_min_minutes: deliveryTime.min,
    delivery_time_max_minutes: deliveryTime.max,
    collected_at: new Date().toISOString(),
    parser_version: 'remitly_estimate_v2', // Updated version to reflect new logic
    parse_flags,
  }
}
