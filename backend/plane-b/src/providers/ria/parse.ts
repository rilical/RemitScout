import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

const logger = createLogger('plane-b.ria.parse')

type RiaIndividualQuote = {
  settlementMethod?: string | null
  deliveryMethod?: string | null
  isDefault?: boolean | null
  isEnabled?: boolean | null
  sellAmount?: string | number | null
  buyAmount?: string | number | null
  rate?: string | number | null
  transferFee?: string | number | null
  totalFees?: string | number | null
  totalCostAmount?: string | number | null
  leadTime?: string | null
}

type RiaSettlementProxy = {
  name?: string | null
  defaultSettlementMethod?: string | null
}

type RiaPayload = {
  quote?: {
    individualQuotes?: RiaIndividualQuote[] | null
    errorMessages?: Record<string, { message?: string }> | null
    availableSettlementProxies?: RiaSettlementProxy[] | null
  } | null
  errorMessages?: Record<string, { message?: string }> | null
}

export type RiaParsedQuote = {
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

  const dayRange = text.match(/(\d+)\s*-\s*(\d+)\s*(?:business\s*)?day/)
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

const getQuotes = (payload: RiaPayload) => {
  return payload.quote?.individualQuotes ?? []
}

export const extractRiaMethodPairs = (payload: RiaPayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const quotes = getQuotes(payload)
  const addPair = (payin: string, payout: string) => {
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }
  const payoutsByPayin = new Map<string, Set<string>>()

  for (const quote of quotes) {
    if (quote.isEnabled === false) continue
    const payout = mapPayout(quote.deliveryMethod)
    const payin = mapPayin(quote.settlementMethod)
    addPair(payin, payout)

    if (payin !== 'other' && payout !== 'other') {
      const payouts = payoutsByPayin.get(payin) ?? new Set<string>()
      payouts.add(payout)
      payoutsByPayin.set(payin, payouts)
    }
  }

  const proxies = payload.quote?.availableSettlementProxies
  if (Array.isArray(proxies) && proxies.length > 0) {
    for (const proxy of proxies) {
      const proxyPayin = mapPayin(proxy.name)
      if (proxyPayin === 'other') continue
      const basePayin = mapPayin(proxy.defaultSettlementMethod)
      const payouts = payoutsByPayin.get(basePayin)
      if (!payouts || payouts.size === 0) continue
      for (const payout of payouts) {
        addPair(proxyPayin, payout)
      }
    }
  }

  return Array.from(pairs.values())
}

const selectQuote = (
  quotes: RiaIndividualQuote[],
  request: CollectorRequest,
): { quote: RiaIndividualQuote | null; parse_flags: QualityFlag[] } => {
  const flags: QualityFlag[] = []
  const enabledQuotes = quotes.filter(quote => quote.isEnabled !== false)
  if (!enabledQuotes.length) {
    flags.push(qualityFlags.parse_error)
    return { quote: null, parse_flags: flags }
  }

  const desiredPayin = request.payin_method && request.payin_method !== 'other'
    ? request.payin_method
    : null
  const desiredPayout = request.payout_method && request.payout_method !== 'other'
    ? request.payout_method
    : null

  const match = enabledQuotes.find((quote) => {
    const payin = mapPayin(quote.settlementMethod)
    const payout = mapPayout(quote.deliveryMethod)
    return (!desiredPayin || payin === desiredPayin) && (!desiredPayout || payout === desiredPayout)
  })

  if (match) return { quote: match, parse_flags: flags }

  const fallback = enabledQuotes.find(quote => quote.isDefault) ?? enabledQuotes[0]
  flags.push(qualityFlags.partial_data)
  return { quote: fallback ?? null, parse_flags: flags }
}

export const parseRiaPayload = (
  payload: RiaPayload,
  request: CollectorRequest,
): RiaParsedQuote | null => {
  if (payload.errorMessages && Object.keys(payload.errorMessages).length > 0) {
    logger.warn('ria_parse_error_messages', {
      corridor_id: request.corridor_id,
      error_messages: payload.errorMessages,
    })
    return null
  }

  if (payload.quote?.errorMessages && Object.keys(payload.quote.errorMessages).length > 0) {
    logger.warn('ria_parse_error_messages', {
      corridor_id: request.corridor_id,
      error_messages: payload.quote.errorMessages,
    })
    return null
  }

  const { quote, parse_flags } = selectQuote(getQuotes(payload), request)
  if (!quote) return null

  const { sourceCurrency } = requireCorridorId(request.corridor_id)
  const sendAmount = parseNumber(quote.sellAmount)
  const resolvedSend = Number.isFinite(sendAmount) ? sendAmount : request.send_amount
  const rate = parseNumber(quote.rate)
  const receiveAmountValue = parseNumber(quote.buyAmount)
  const feeAmountValue = parseNumber(quote.transferFee ?? quote.totalFees)
  const totalCostValue = parseNumber(quote.totalCostAmount)
  const payout = mapPayout(quote.deliveryMethod)
  const payin = mapPayin(quote.settlementMethod)
  const deliveryWindow = parseDeliveryWindow(quote.leadTime ?? null)

  const receiveAmount = Number.isFinite(receiveAmountValue)
    ? receiveAmountValue
    : Number.isFinite(rate)
      ? resolvedSend * rate
      : Number.NaN

  if (!Number.isFinite(resolvedSend) || !Number.isFinite(receiveAmount)) {
    parse_flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmountValue)) {
    parse_flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(rate)) {
    parse_flags.push(qualityFlags.partial_data)
  }

  const feeAmount = Number.isFinite(feeAmountValue) ? feeAmountValue : 0
  const totalDebit = Number.isFinite(totalCostValue)
    ? totalCostValue
    : resolvedSend + feeAmount

  return {
    send_amount: resolvedSend,
    receive_amount: receiveAmount,
    fee_amount: feeAmount,
    total_debit_amount: totalDebit,
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
    parser_version: 'ria_quote_v1',
    parse_flags,
  }
}
