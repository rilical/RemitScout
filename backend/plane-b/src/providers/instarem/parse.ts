import type { CollectorRequest } from '../../collectors/types'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod, normalizeMethodToken } from './code-map'
import type { InstaremPaymentMethod } from './fetch'

type InstaremQuoteData = {
  source_currency?: string | null
  destination_currency?: string | null
  gross_source_amount?: number | string | null
  net_source_amount?: number | string | null
  net_of_fee_amount?: number | string | null
  destination_amount?: number | string | null
  instarem_fx_rate?: number | string | null
  fx_rate?: number | string | null
  regular_instarem_fx_rate?: number | string | null
  transaction_fee_amount?: number | string | null
  payment_method_fee_amount?: number | string | null
  payout_method_fee_amount?: number | string | null
  regular_transaction_fee_amount?: number | string | null
  regular_payment_method_fee_amount?: number | string | null
  regular_payout_method_fee_amount?: number | string | null
  net_tax_amount?: number | string | null
  tax_amount_1?: number | string | null
  tax_amount_2?: number | string | null
  tax_amount_3?: number | string | null
  transaction_config?: {
    total_fee_amount?: number | string | null
    regular_total_fee_amount?: number | string | null
    source_currency?: string | null
  }
}

export type InstaremParsedQuote = {
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

type InstaremPayload = {
  payment_methods?: InstaremPaymentMethod[]
  selected_payment_method?: InstaremPaymentMethod | null
  quote?: InstaremQuoteData | null
  data?: InstaremQuoteData | null
}

const parseNumber = (value?: number | string | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const sumNumbers = (values: Array<number | string | null | undefined>): number => {
  let total = 0
  let hasValue = false
  for (const value of values) {
    const parsed = parseNumber(value ?? null)
    if (Number.isFinite(parsed)) {
      total += parsed
      hasValue = true
    }
  }
  return hasValue ? total : Number.NaN
}

const extractPaymentMethods = (payload: InstaremPayload): InstaremPaymentMethod[] => {
  if (Array.isArray(payload.payment_methods)) return payload.payment_methods
  if (Array.isArray((payload as unknown as { data?: unknown }).data)) {
    return (payload as unknown as { data: InstaremPaymentMethod[] }).data
  }
  return []
}

const methodDescriptor = (method?: InstaremPaymentMethod | null) =>
  method ? [method.text, method.code, method.icon_url].filter(Boolean).join(' ') : ''

const resolvePayinMethod = (
  payload: InstaremPayload,
  request: CollectorRequest,
  flags: QualityFlag[],
): string => {
  const selected = payload.selected_payment_method
  if (selected) {
    const mapped = mapPayinMethod(methodDescriptor(selected))
    if (mapped !== 'other') return mapped
  }

  const methods = extractPaymentMethods(payload)
  const desired = normalizeMethodToken(request.payin_method)
  if (desired) {
    const match = methods.find((method) => mapPayinMethod(methodDescriptor(method)) === request.payin_method)
    if (match) return mapPayinMethod(methodDescriptor(match))
  }

  flags.push(qualityFlags.partial_data)
  return request.payin_method || 'other'
}

const resolvePayoutMethod = (
  payload: InstaremPayload,
  flags: QualityFlag[],
): string => {
  const quote = payload.quote as Record<string, unknown> | null | undefined
  const explicitValue = quote?.payout_method ?? quote?.payout_method_code ?? quote?.payout_method_type ?? null
  const explicit = mapPayoutMethod(explicitValue ? String(explicitValue) : null)
  if (explicit && explicit !== 'other') return explicit
  flags.push(qualityFlags.partial_data)
  return 'bank_deposit'
}

export const extractInstaremMethodPairs = (payload: InstaremPayload) => {
  const methods = extractPaymentMethods(payload)
  if (!methods.length) return []
  return methods.map((method) => ({
    payin_method: mapPayinMethod(methodDescriptor(method)),
    payout_method: 'bank_deposit',
  }))
}

const getQuoteData = (payload: InstaremPayload): InstaremQuoteData | null => {
  if (payload.quote && typeof payload.quote === 'object') return payload.quote
  if (payload.data && typeof payload.data === 'object') return payload.data
  return null
}

const resolveFeeCurrency = (quote: InstaremQuoteData, request: CollectorRequest): string | null => {
  const currency = quote.source_currency ?? quote.transaction_config?.source_currency
  if (currency && typeof currency === 'string') return currency
  const corridorCurrency = request.corridor_id.split('-')[2]
  return corridorCurrency ? corridorCurrency.toUpperCase() : null
}

export const parseInstaremPayload = (
  payload: InstaremPayload,
  request: CollectorRequest,
): InstaremParsedQuote | null => {
  const flags: QualityFlag[] = []
  const quote = getQuoteData(payload)

  if (!quote) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const sendAmount = [quote.gross_source_amount, quote.net_source_amount, quote.net_of_fee_amount]
    .map(value => parseNumber(value))
    .find(value => Number.isFinite(value)) ?? Number(request.send_amount)

  const receiveAmount = parseNumber(quote.destination_amount)
  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const taxAmount = Number.isFinite(parseNumber(quote.net_tax_amount))
    ? parseNumber(quote.net_tax_amount)
    : sumNumbers([quote.tax_amount_1, quote.tax_amount_2, quote.tax_amount_3])

  const actualFeeFallback = parseNumber(quote.transaction_config?.total_fee_amount)
  const actualFeeParts = sumNumbers([
    quote.transaction_fee_amount,
    quote.payment_method_fee_amount,
    quote.payout_method_fee_amount,
  ])
  const actualFee = Number.isFinite(actualFeeParts)
    ? actualFeeParts + (Number.isFinite(taxAmount) ? taxAmount : 0)
    : actualFeeFallback

  const regularFeeFallback = parseNumber(quote.transaction_config?.regular_total_fee_amount)
  const regularFeeParts = sumNumbers([
    quote.regular_transaction_fee_amount,
    quote.regular_payment_method_fee_amount,
    quote.regular_payout_method_fee_amount,
  ])
  const regularFee = Number.isFinite(regularFeeParts)
    ? regularFeeParts + (Number.isFinite(taxAmount) ? taxAmount : 0)
    : regularFeeFallback

  let feeAmount = Number.isFinite(actualFee) ? actualFee : Number.NaN
  let promotionalFeeAmount: number | null = null
  if (Number.isFinite(regularFee) && Number.isFinite(actualFee) && regularFee > actualFee) {
    feeAmount = regularFee
    promotionalFeeAmount = actualFee
  }

  if (!Number.isFinite(feeAmount)) {
    feeAmount = 0
    flags.push(qualityFlags.partial_data)
  }

  const appliedRate = parseNumber(quote.instarem_fx_rate) || parseNumber(quote.fx_rate)
  const baseRate = parseNumber(quote.regular_instarem_fx_rate) || parseNumber(quote.fx_rate)
  const promoRate = Number.isFinite(baseRate) && Number.isFinite(appliedRate) && appliedRate !== baseRate
    ? appliedRate
    : null

  if (!Number.isFinite(appliedRate)) {
    flags.push(qualityFlags.partial_data)
  }

  const payinMethod = resolvePayinMethod(payload, request, flags)
  const payoutMethod = resolvePayoutMethod(payload, flags)

  if (payinMethod === 'other' || payoutMethod === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: feeAmount,
    total_debit_amount: sendAmount + (promotionalFeeAmount ?? feeAmount),
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: resolveFeeCurrency(quote, request),
    exchange_rate: Number.isFinite(appliedRate) ? appliedRate : null,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: promoRate,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'instarem_v1',
    parse_flags: flags,
  }
}
