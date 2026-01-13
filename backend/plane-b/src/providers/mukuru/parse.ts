import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, type QualityFlag } from '../../normalize/quality-flags'
import { mapMukuruPayinMethod, mapMukuruPayoutMethod } from './code-map'
import type { MukuruPayload, MukuruProduct, MukuruQuoteResponse } from './fetch'

export type MukuruParsedQuote = {
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

const logger = createLogger('plane-b.mukuru.parse')

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const parseRate = (value?: string | null): number => {
  if (!value) return Number.NaN
  const match = value.match(/:([^\s]+)/)
  if (!match) return Number.NaN
  return parseNumber(match[1])
}

const findBreakdownAmount = (
  breakdown: Record<string, unknown> | null | undefined,
  matcher: (key: string) => boolean,
): number => {
  if (!breakdown || typeof breakdown !== 'object') return Number.NaN
  for (const [key, entry] of Object.entries(breakdown)) {
    if (!matcher(key)) continue
    if (entry && typeof entry === 'object' && 'amount' in entry) {
      return parseNumber((entry as { amount?: string }).amount)
    }
  }
  return Number.NaN
}

const getQuoteError = (quote: MukuruQuoteResponse | string | undefined): string | null => {
  if (!quote) return 'Missing quote response'
  if (typeof quote === 'string') return quote
  if (quote.status && quote.status !== 'success') {
    return quote.message ?? 'Mukuru quote returned error'
  }
  return null
}

const resolveProducts = (payload: MukuruPayload): MukuruProduct[] => {
  if (!payload?.products) return []
  return Array.isArray(payload.products) ? payload.products : []
}

export const extractMukuruMethodPairs = (payload: MukuruPayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const products = resolveProducts(payload)
  const payin = 'bank_transfer'

  for (const product of products) {
    const payout = mapMukuruPayoutMethod(product.title)
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }

  return Array.from(pairs.values())
}

export const getMukuruErrorMessages = (payload: MukuruPayload): string[] => {
  const messages: string[] = []
  if (!payload) return ['Missing payload']
  if (!payload.products || payload.products.length === 0) {
    messages.push('No products returned')
  }
  const quote = payload.quote as MukuruQuoteResponse | string | undefined
  if (!quote) {
    messages.push('Missing quote response')
    return messages
  }
  if (typeof quote === 'string') {
    messages.push(quote)
    return messages
  }
  if (quote.status && quote.status !== 'success') {
    if (quote.message) {
      messages.push(quote.message)
    } else {
      messages.push(`Quote status: ${quote.status}`)
    }
  }
  return messages
}

export const parseMukuruPayload = (
  payload: MukuruPayload,
  request: CollectorRequest,
): MukuruParsedQuote | null => {
  const flags: QualityFlag[] = []
  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const quote = payload.quote as MukuruQuoteResponse | string | undefined
  const error = getQuoteError(quote)
  if (error) {
    logger.warn('mukuru_parse_error', {
      corridor_id: request.corridor_id,
      error,
    })
    return null
  }

  if (!quote || typeof quote !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const data = quote.data
  if (!data) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmount = parseNumber(data.payin_amount)
  const receiveAmount = parseNumber(data.payout_amount)
  const rate = parseRate(data.rate_message)
  const feeFromMessage = parseNumber(data.charge_message)

  const payinBreakdown = (data.breakdown as Record<string, unknown> | undefined)?.payin as
    | Record<string, unknown>
    | undefined
  const feeFromBreakdown = findBreakdownAmount(
    payinBreakdown,
    key => key.toLowerCase().includes('charge'),
  )
  const totalFromBreakdown = findBreakdownAmount(
    payinBreakdown,
    key => key.toLowerCase().includes('total'),
  )

  const feeAmount = Number.isFinite(feeFromBreakdown)
    ? feeFromBreakdown
    : Number.isFinite(feeFromMessage)
      ? feeFromMessage
      : Number.NaN

  const totalDebit = Number.isFinite(totalFromBreakdown)
    ? totalFromBreakdown
    : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
      ? sendAmount + feeAmount
      : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(rate)) {
    flags.push(qualityFlags.partial_data)
  }

  if (payload.sourceCurrency && payload.sourceCurrency !== sourceCurrency) {
    flags.push(qualityFlags.partial_data)
  }

  const payinMethod = mapMukuruPayinMethod(request.payin_method)
  const selectedPayout = payload.payoutMethod || mapMukuruPayoutMethod(request.payout_method)
  const payoutMethod = selectedPayout !== 'other' ? selectedPayout : request.payout_method

  if (request.payout_method && payoutMethod !== request.payout_method) {
    flags.push(qualityFlags.partial_data)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(totalDebit) ? totalDebit : sendAmount,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(rate) ? rate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'mukuru_quote_v1',
    parse_flags: flags,
  }
}
