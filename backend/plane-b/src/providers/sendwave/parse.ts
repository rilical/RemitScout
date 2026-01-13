import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { mapSendwavePayinMethod, mapSendwavePayoutMethod } from './code-map'

type SendwaveSegment = {
  description?: string | null
  segmentDisplayName?: string | null
  segmentName?: string | null
}

type SendwavePayoutGroup = {
  payoutMethod?: string | null
  label?: string | null
  bestPricedSegmentName?: string | null
  isBestPricedPayoutMethod?: boolean | null
  segments?: SendwaveSegment[] | null
}

export type SendwaveSegmentsPayload = {
  payoutMethodsAndPrices?: SendwavePayoutGroup[] | null
}

export type SendwavePricingPayload = {
  baseExchangeRate?: string | number | null
  effectiveExchangeRate?: string | number | null
  baseFeeAmount?: string | number | null
  effectiveFeeAmount?: string | number | null
  baseSendAmount?: string | number | null
  effectiveSendAmount?: string | number | null
  payAmount?: string | number | null
  receiveAmount?: string | number | null
}

export type SendwavePayload = {
  segments?: SendwaveSegmentsPayload | string | null
  pricing?: SendwavePricingPayload | string | null
  segmentName?: string | null
  payoutMethod?: string | null
}

export type SendwaveParsedQuote = {
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

const logger = createLogger('plane-b.sendwave.parse')

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const extractErrors = (value: unknown): string[] => {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  const messages: string[] = []

  if (typeof record.message === 'string') {
    messages.push(record.message)
  }
  if (typeof record.error === 'string') {
    messages.push(record.error)
  }
  if (Array.isArray(record.errors)) {
    for (const entry of record.errors) {
      if (typeof entry === 'string') {
        messages.push(entry)
      } else if (entry && typeof entry === 'object' && typeof (entry as { message?: string }).message === 'string') {
        messages.push((entry as { message: string }).message)
      }
    }
  }

  for (const entry of Object.values(record)) {
    if (Array.isArray(entry) && entry.every(item => typeof item === 'string')) {
      messages.push(...(entry as string[]))
    }
  }

  return messages
}

export const getSendwaveErrorMessages = (payload: SendwavePayload): string[] => {
  const messages = new Set<string>()
  for (const message of extractErrors(payload?.segments)) {
    if (message) messages.add(message)
  }
  for (const message of extractErrors(payload?.pricing)) {
    if (message) messages.add(message)
  }
  return Array.from(messages)
}

const resolvePayoutGroups = (payload: SendwavePayload): SendwavePayoutGroup[] => {
  if (!payload?.segments || typeof payload.segments !== 'object') return []
  const segments = payload.segments as SendwaveSegmentsPayload
  return Array.isArray(segments.payoutMethodsAndPrices) ? segments.payoutMethodsAndPrices : []
}

export const extractSendwaveMethodPairs = (payload: SendwavePayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const groups = resolvePayoutGroups(payload)

  for (const group of groups) {
    const payout = mapSendwavePayoutMethod(
      group.payoutMethod
      ?? group.label
      ?? group.bestPricedSegmentName
      ?? group.segments?.[0]?.segmentName,
    )
    const payin = 'debit_card'
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }

  return Array.from(pairs.values())
}

export const parseSendwavePayload = (
  payload: SendwavePayload,
  request: CollectorRequest,
): SendwaveParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const errors = getSendwaveErrorMessages(payload)
  if (errors.length > 0) {
    logger.warn('sendwave_parse_error_messages', {
      corridor_id: request.corridor_id,
      errors,
    })
    return null
  }

  if (!payload.pricing || typeof payload.pricing !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const pricing = payload.pricing as SendwavePricingPayload
  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(pricing.effectiveSendAmount ?? pricing.baseSendAmount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const promotionalRate = parseNumber(pricing.effectiveExchangeRate)
  const baseRate = parseNumber(pricing.baseExchangeRate)

  const receiveAmountRaw = parseNumber(pricing.receiveAmount)
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(promotionalRate)
      ? sendAmount * promotionalRate
      : Number.isFinite(baseRate)
        ? sendAmount * baseRate
        : Number.NaN

  const feeAmountRaw = parseNumber(pricing.effectiveFeeAmount ?? pricing.baseFeeAmount)
  const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN

  const totalDebitRaw = parseNumber(pricing.payAmount)
  const totalDebit = Number.isFinite(totalDebitRaw)
    ? totalDebitRaw
    : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
      ? sendAmount + feeAmount
      : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmountRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(promotionalRate) && !Number.isFinite(baseRate)) {
    flags.push(qualityFlags.partial_data)
  }

  const requestedPayin = mapSendwavePayinMethod(request.payin_method)
  const payinMethod = requestedPayin === 'debit_card' || requestedPayin === 'credit_card'
    ? requestedPayin
    : 'debit_card'
  if (requestedPayin !== 'other' && requestedPayin !== payinMethod) {
    flags.push(qualityFlags.partial_data)
  }

  const selectedPayout = mapSendwavePayoutMethod(
    payload.payoutMethod
    ?? payload.segmentName,
  )

  const payoutMethod = selectedPayout !== 'other'
    ? selectedPayout
    : request.payout_method || 'bank_deposit'

  if (request.payout_method && payoutMethod !== request.payout_method) {
    flags.push(qualityFlags.partial_data)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(totalDebit)
      ? totalDebit
      : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'sendwave_quote_v1',
    parse_flags: flags,
  }
}
