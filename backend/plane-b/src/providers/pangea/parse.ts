import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type PangeaAmount = {
  Amount?: string | number | null
  Currency?: string | null
}

type PangeaRate = {
  RateType?: string | null
  Rate?: string | number | null
}

export type PangeaPayload = {
  SendingAmount?: PangeaAmount | null
  ReceivingAmount?: PangeaAmount | null
  StandardRate?: PangeaRate | null
  PromotionalRate?: PangeaRate | null
}

export type PangeaParsedQuote = {
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

export const extractPangeaMethodPairs = () => {
  return [
    { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
  ]
}

export const parsePangeaPayload = (
  payload: PangeaPayload,
  request: CollectorRequest,
): PangeaParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency, destCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(payload.SendingAmount?.Amount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const receiveAmountRaw = parseNumber(payload.ReceivingAmount?.Amount)
  const promotionalRateRaw = parseNumber(payload.PromotionalRate?.Rate)
  const baseRateRaw = parseNumber(payload.StandardRate?.Rate)

  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(promotionalRateRaw)
      ? sendAmount * promotionalRateRaw
      : Number.isFinite(baseRateRaw)
        ? sendAmount * baseRateRaw
        : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(baseRateRaw) && !Number.isFinite(promotionalRateRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  const sendCurrency = payload.SendingAmount?.Currency ?? sourceCurrency
  const receiveCurrency = payload.ReceivingAmount?.Currency ?? destCurrency

  if (sendCurrency && sendCurrency.toUpperCase() !== sourceCurrency.toUpperCase()) {
    flags.push(qualityFlags.partial_data)
  }

  if (receiveCurrency && receiveCurrency.toUpperCase() !== destCurrency.toUpperCase()) {
    flags.push(qualityFlags.partial_data)
  }

  const payinMethod = mapPayin('bank_transfer')
  const payoutMethod = mapPayout('bank_deposit')

  const feeAmount = 0
  const totalDebitAmount = sendAmount + feeAmount

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: feeAmount,
    total_debit_amount: totalDebitAmount,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sendCurrency ?? sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
    base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'pangea_fx_calc_v1',
    parse_flags: flags,
  }
}
