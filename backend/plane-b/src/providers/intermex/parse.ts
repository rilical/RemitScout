import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod, normalizeMethodToken } from './code-map'

type IntermexPaymentMethod = {
  senderPaymentMethodId?: number | string | null
  senderPaymentMethodName?: string | null
  feeAmount?: number | string | null
  isAvailable?: boolean | null
}

type IntermexDeliveryMethod = {
  tranTypeId?: number | string | null
  tranTypeName?: string | null
  deliveryMethod?: string | null
  isSelected?: boolean | null
}

type IntermexPayload = {
  rate?: number | string | null
  origAmount?: number | string | null
  destAmount?: number | string | null
  feeAmount?: number | string | null
  totalAmount?: number | string | null
  discountAmount?: number | string | null
  fxDif?: number | string | null
  paymentMethods?: IntermexPaymentMethod[] | null
  deliveryMethodsList?: IntermexDeliveryMethod[] | null
}

export type IntermexParsedQuote = {
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

const parseNumber = (value?: number | string | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(String(value).replace(/[^0-9.+-Ee]/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const resolvePaymentMethod = (
  methods: IntermexPaymentMethod[],
  requested?: string | null,
  flags: QualityFlag[] = [],
) => {
  if (!methods.length) return null
  const requestedToken = normalizeMethodToken(requested)
  if (requestedToken) {
    const match = methods.find((method) => {
      const mapped = mapPayinMethod(method.senderPaymentMethodId ?? method.senderPaymentMethodName)
      return normalizeMethodToken(mapped) === requestedToken
    })
    if (match) return match
    flags.push(qualityFlags.partial_data)
  }
  return methods[0] ?? null
}

export const extractIntermexMethodPairs = (
  payload: IntermexPayload | Record<string, unknown>,
): Array<{ payin_method: string; payout_method: string }> => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const methods = Array.isArray((payload as IntermexPayload).paymentMethods)
    ? (payload as IntermexPayload).paymentMethods ?? []
    : []
  const deliveryMethods = Array.isArray((payload as IntermexPayload).deliveryMethodsList)
    ? (payload as IntermexPayload).deliveryMethodsList ?? []
    : []

  const payins = new Set<string>()
  for (const method of methods) {
    const mapped = mapPayinMethod(method.senderPaymentMethodId ?? method.senderPaymentMethodName)
    if (mapped !== 'other') payins.add(mapped)
  }
  if (payins.size === 0) {
    payins.add('debit_card')
  }

  const payouts = new Set<string>()
  if (deliveryMethods.length) {
    for (const method of deliveryMethods) {
      const mapped = mapPayoutMethod(method.tranTypeId ?? method.tranTypeName ?? method.deliveryMethod)
      if (mapped !== 'other') payouts.add(mapped)
    }
  }
  if (payouts.size === 0) {
    payouts.add('bank_deposit')
    payouts.add('cash_pickup')
  }

  for (const payin of payins) {
    for (const payout of payouts) {
      const key = `${payin}:${payout}`
      if (!pairs.has(key)) {
        pairs.set(key, { payin_method: payin, payout_method: payout })
      }
    }
  }

  return Array.from(pairs.values())
}

export const parseIntermexPayload = (
  payload: IntermexPayload,
  request: CollectorRequest,
): IntermexParsedQuote | null => {
  const flags: QualityFlag[] = []
  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(payload.origAmount ?? request.send_amount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  let receiveAmount = parseNumber(payload.destAmount)
  const exchangeRate = parseNumber(payload.rate)
  if (!Number.isFinite(receiveAmount) && Number.isFinite(exchangeRate)) {
    receiveAmount = sendAmount * exchangeRate
    flags.push(qualityFlags.partial_data)
  }

  const paymentMethods = Array.isArray(payload.paymentMethods) ? payload.paymentMethods : []
  const selectedPayment = resolvePaymentMethod(paymentMethods, request.payin_method, flags)

  let feeAmount = parseNumber(selectedPayment?.feeAmount ?? payload.feeAmount)
  const discountAmount = parseNumber(payload.discountAmount)
  let promotionalFeeAmount: number | null = null
  if (Number.isFinite(feeAmount) && Number.isFinite(discountAmount) && discountAmount > 0) {
    promotionalFeeAmount = feeAmount
    feeAmount = feeAmount + discountAmount
  }

  if (!Number.isFinite(receiveAmount) || !Number.isFinite(exchangeRate) || !Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.parse_error)
  }

  if (!Number.isFinite(feeAmount)) {
    feeAmount = 0
    flags.push(qualityFlags.partial_data)
  }

  const totalAmount = parseNumber(payload.totalAmount)
  const totalDebitAmount = Number.isFinite(totalAmount)
    ? totalAmount
    : sendAmount + (promotionalFeeAmount ?? feeAmount)

  const payin = selectedPayment
    ? mapPayinMethod(selectedPayment.senderPaymentMethodId ?? selectedPayment.senderPaymentMethodName)
    : (request.payin_method ?? 'other')
  const payout = request.payout_method ?? 'other'

  if (payin === 'other' || payout === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  return {
    send_amount: sendAmount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(totalDebitAmount) ? totalDebitAmount : sendAmount,
    payin_method: payin,
    payout_method: payout,
    fee_currency: sourceCurrency ?? null,
    exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: null,
    base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'intermex_v1',
    parse_flags: flags,
  }
}
