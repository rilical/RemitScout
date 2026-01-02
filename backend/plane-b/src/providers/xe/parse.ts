import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

const logger = createLogger('plane-b.xe.parse')

type XeIndividualQuote = {
  rate?: number | string | null
  buyAmount?: number | string | null
  transferFee?: number | string | null
  deliveryMethod?: string | null
  leadTime?: string | null
}

type XeQuotePayload = {
  quote?: {
    individualQuotes?: XeIndividualQuote[] | null
  } | null
  errorMessages?: Record<string, { message?: string }> | null
}

export type XeParsedQuote = {
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

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  return payinMethodMap[code] ?? payinMethodMap[token] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  return payoutMethodMap[code] ?? payoutMethodMap[token] ?? 'other'
}

const parseDeliveryWindow = (value?: string | null) => {
  if (!value) return { min: null, max: null }
  const text = value.toLowerCase()

  const dayRange = text.match(/(\d+)\s*-\s*(\d+)\s*day/)
  if (dayRange) {
    const min = Number(dayRange[1]) * 1440
    const max = Number(dayRange[2]) * 1440
    return { min, max }
  }

  const hourRange = text.match(/(\d+)\s*-\s*(\d+)\s*hour/)
  if (hourRange) {
    const min = Number(hourRange[1]) * 60
    const max = Number(hourRange[2]) * 60
    return { min, max }
  }

  const daySingle = text.match(/(\d+)\s*(?:business\s*)?day/)
  if (daySingle) {
    const minutes = Number(daySingle[1]) * 1440
    return { min: minutes, max: minutes }
  }

  const hourSingle = text.match(/(\d+)\s*hour/)
  if (hourSingle) {
    const minutes = Number(hourSingle[1]) * 60
    return { min: minutes, max: minutes }
  }

  const minuteSingle = text.match(/(\d+)\s*minute/)
  if (minuteSingle) {
    const minutes = Number(minuteSingle[1])
    return { min: minutes, max: minutes }
  }

  if (text.includes('within 24 hours') || text.includes('same day')) {
    return { min: 60, max: 1440 }
  }

  if (text.includes('instant') || text.includes('minutes')) {
    return { min: 15, max: 60 }
  }

  return { min: null, max: null }
}

const getQuotes = (payload: XeQuotePayload) => {
  return payload.quote?.individualQuotes ?? []
}

export const extractXeMethodPairs = (payload: XeQuotePayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  for (const quote of getQuotes(payload)) {
    const payout = mapPayout(quote.deliveryMethod ?? 'bank_deposit')
    const payin = mapPayin('bank_transfer')
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }
  return Array.from(pairs.values())
}

const selectQuote = (
  quotes: XeIndividualQuote[],
  request: CollectorRequest,
): { quote: XeIndividualQuote | null; parse_flags: QualityFlag[] } => {
  const flags: QualityFlag[] = []
  if (!quotes.length) {
    flags.push(qualityFlags.parse_error)
    return { quote: null, parse_flags: flags }
  }

  const requestedPayout = request.payout_method
  if (requestedPayout) {
    const match = quotes.find((item) => mapPayout(item.deliveryMethod ?? '') === requestedPayout)
    if (match) return { quote: match, parse_flags: flags }
  }

  flags.push(qualityFlags.partial_data)
  return { quote: quotes[0] ?? null, parse_flags: flags }
}

export const parseXePayload = (
  payload: XeQuotePayload,
  request: CollectorRequest,
): XeParsedQuote | null => {
  if (payload.errorMessages && Object.keys(payload.errorMessages).length > 0) {
    logger.warn('xe_parse_error_messages', {
      corridor_id: request.corridor_id,
      error_messages: payload.errorMessages,
    })
    return null
  }

  const { quote, parse_flags } = selectQuote(getQuotes(payload), request)
  if (!quote) return null

  const { sourceCurrency } = requireCorridorId(request.corridor_id)
  const sendAmount = request.send_amount
  const rate = parseNumber(quote.rate)
  const receiveAmountValue = parseNumber(quote.buyAmount)
  const feeAmount = parseNumber(quote.transferFee)
  const payout = mapPayout(quote.deliveryMethod ?? 'bank_deposit')
  const payin = mapPayin('bank_transfer')
  const deliveryWindow = parseDeliveryWindow(quote.leadTime)

  const receiveAmount = Number.isFinite(receiveAmountValue)
    ? receiveAmountValue
    : Number.isFinite(rate)
      ? sendAmount * rate
      : Number.NaN

  if (!Number.isFinite(rate) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
    parse_flags.push(qualityFlags.parse_error)
  }

  return {
    send_amount: sendAmount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
    payin_method: payin,
    payout_method: payout,
    fee_currency: sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(rate) ? rate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: deliveryWindow.min,
    delivery_time_max_minutes: deliveryWindow.max,
    collected_at: new Date().toISOString(),
    parser_version: 'xe_quote_v1',
    parse_flags,
  }
}
