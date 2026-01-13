import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type RemitbeeTimeline = {
  predicted_minutes?: number | string | null
  predicted_date?: string | null
}

type RemitbeePaymentType = {
  label?: string | null
  payment_type?: string | null
  fees?: string | number | null
  timeline?: {
    funding_timeline?: RemitbeeTimeline | null
    settlement_timeline?: RemitbeeTimeline | null
  } | null
  funding_time?: string | null
  settlement_time?: string | null
}

type RemitbeePayload = {
  transfer_amount?: string | number | null
  receiving_amount?: string | number | null
  rate?: string | number | null
  cumulative_rate?: string | number | null
  special_rate?: string | number | null
  spot_rate?: string | number | null
  special_rate_transfer_amount_limit?: string | number | null
  payment_types?: RemitbeePaymentType[] | null
  payment_additional_info?: {
    first_transfer_free?: boolean | null
    all_transfers_free?: boolean | null
  } | null
}

export type RemitbeeParsedQuote = {
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
  const parsed = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const normalizeToken = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_')

const mapPayin = (code?: string | null, label?: string | null) => {
  const candidates = [code, label].filter((value): value is string => Boolean(value))
  for (const candidate of candidates) {
    const token = normalizeToken(candidate)
    if (payinMethodMap[candidate]) return payinMethodMap[candidate]
    if (payinMethodMap[token]) return payinMethodMap[token]
    if (token.includes('debit')) return 'debit_card'
    if (token.includes('credit')) return 'credit_card'
    if (token.includes('interac') || token.includes('transfer') || token.includes('bank')) {
      return 'bank_transfer'
    }
    if (token.includes('card')) return 'debit_card'
  }
  return 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'bank_deposit'
  const token = normalizeToken(code)
  if (payoutMethodMap[code]) return payoutMethodMap[code]
  if (payoutMethodMap[token]) return payoutMethodMap[token]
  if (token.includes('cash')) return 'cash_pickup'
  if (token.includes('wallet')) return 'mobile_wallet'
  return 'bank_deposit'
}

const getPaymentTypes = (payload: RemitbeePayload): RemitbeePaymentType[] => {
  return Array.isArray(payload.payment_types) ? payload.payment_types : []
}

export const extractRemitbeeMethodPairs = (payload: RemitbeePayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const paymentTypes = getPaymentTypes(payload)

  for (const paymentType of paymentTypes) {
    const payin = mapPayin(paymentType.payment_type, paymentType.label)
    const payout = mapPayout(null)
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }

  if (!pairs.size) {
    pairs.set('debit_card:bank_deposit', {
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
    })
  }

  return Array.from(pairs.values())
}

type SelectedPayment = {
  payin: string
  payout: string
  payment: RemitbeePaymentType | null
}

const selectPaymentType = (
  paymentTypes: RemitbeePaymentType[],
  request: CollectorRequest,
  flags: QualityFlag[],
): SelectedPayment => {
  if (!paymentTypes.length) {
    flags.push(qualityFlags.partial_data)
    return {
      payin: request.payin_method || 'debit_card',
      payout: request.payout_method || 'bank_deposit',
      payment: null,
    }
  }

  const mapped = paymentTypes.map((payment) => ({
    payment,
    payin: mapPayin(payment.payment_type, payment.label),
    payout: mapPayout(null),
  }))

  const requestedPayin = request.payin_method
  const requestedPayout = request.payout_method

  if (requestedPayin && requestedPayout) {
    const match = mapped.find(
      (item) => item.payin === requestedPayin && item.payout === requestedPayout,
    )
    if (match) {
      return { payin: match.payin, payout: match.payout, payment: match.payment }
    }
  }

  if (requestedPayin) {
    const match = mapped.find((item) => item.payin === requestedPayin)
    if (match) {
      flags.push(qualityFlags.partial_data)
      return { payin: match.payin, payout: match.payout, payment: match.payment }
    }
  }

  if (requestedPayout) {
    const match = mapped.find((item) => item.payout === requestedPayout)
    if (match) {
      flags.push(qualityFlags.partial_data)
      return { payin: match.payin, payout: match.payout, payment: match.payment }
    }
  }

  flags.push(qualityFlags.partial_data)
  const fallback = mapped[0]
  return { payin: fallback.payin, payout: fallback.payout, payment: fallback.payment }
}

export const parseRemitbeePayload = (
  payload: RemitbeePayload,
  request: CollectorRequest,
): RemitbeeParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(payload.transfer_amount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const receiveAmountRaw = parseNumber(payload.receiving_amount)
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  let baseRate = parseNumber(payload.rate)
  if (!Number.isFinite(baseRate)) {
    baseRate = parseNumber(payload.cumulative_rate)
  }
  if (!Number.isFinite(baseRate)) {
    baseRate = parseNumber(payload.spot_rate)
  }

  const promotionalRate = parseNumber(payload.special_rate)
  const promotionalCap = parseNumber(payload.special_rate_transfer_amount_limit)

  const { payin, payout, payment } = selectPaymentType(
    getPaymentTypes(payload),
    request,
    flags,
  )

  const feeAmountRaw = parseNumber(payment?.fees)
  const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN

  if (!Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(baseRate)) {
    flags.push(qualityFlags.partial_data)
  }

  const deliveryMinutesRaw = parseNumber(payment?.timeline?.settlement_timeline?.predicted_minutes)
  const deliveryMinutes = Number.isFinite(deliveryMinutesRaw) ? deliveryMinutesRaw : null

  const feeValue = Number.isFinite(feeAmount) ? feeAmount : 0

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: feeValue,
    total_debit_amount: sendAmount + feeValue,
    payin_method: payin,
    payout_method: payout,
    fee_currency: sourceCurrency ?? null,
    promotional_fee_amount: null,
    promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: Number.isFinite(promotionalCap) ? promotionalCap : null,
    delivery_time_min_minutes: deliveryMinutes,
    delivery_time_max_minutes: deliveryMinutes,
    collected_at: new Date().toISOString(),
    parser_version: 'remitbee_v1',
    parse_flags: flags,
  }
}
