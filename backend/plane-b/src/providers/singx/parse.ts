import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, type QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

type SingxPayload = {
  exchangeRate?: number | string | null
  receiveAmount?: number | string | null
  sendAmount?: number | string | null
  singxFee?: number | string | null
  totalPayable?: number | string | null
  errors?: unknown[] | null
  type?: string | null
}

export type SingxParsedQuote = {
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

export const extractSingxMethodPairs = () => {
  return [{ payin_method: 'bank_transfer', payout_method: 'bank_deposit' }]
}

const hasErrors = (payload: SingxPayload) => {
  const errors = payload.errors
  return Array.isArray(errors) && errors.length > 0
}

export const parseSingxPayload = (
  payload: SingxPayload,
  request: CollectorRequest,
): SingxParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (hasErrors(payload)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(payload.sendAmount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const rate = parseNumber(payload.exchangeRate)
  const receiveAmountRaw = parseNumber(payload.receiveAmount)
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(rate)
      ? sendAmount * rate
      : Number.NaN

  const feeAmountRaw = parseNumber(payload.singxFee)
  const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN

  if (!Number.isFinite(rate) || !Number.isFinite(receiveAmount) || !Number.isFinite(sendAmount)) {
    flags.push(qualityFlags.parse_error)
  }

  if (!Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.partial_data)
  }

  const payin = mapPayinMethod(request.payin_method ?? 'bank_transfer')
  const payout = mapPayoutMethod(request.payout_method ?? 'bank_deposit')

  const feeValue = Number.isFinite(feeAmount) ? feeAmount : 0

  return {
    send_amount: sendAmount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: feeValue,
    total_debit_amount: sendAmount + feeValue,
    payin_method: payin,
    payout_method: payout,
    fee_currency: sourceCurrency ?? null,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(rate) ? rate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'singx_quote_v1',
    parse_flags: flags,
  }
}
