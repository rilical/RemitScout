import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, type QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

type AlansariPayload = {
  amount?: string | number | null
  get_rate?: string | number | null
  status_msg?: string | null
  status_msg_detail?: string | null
}

export type AlansariParsedQuote = {
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

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(String(value).replace(/[^0-9.+-Ee]/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const isSuccess = (payload: AlansariPayload) => {
  return payload.status_msg?.toUpperCase() === 'SUCCESS'
}

export const extractAlansariMethodPairs = (
  _payload?: AlansariPayload | null,
  request?: CollectorRequest,
) => {
  const payin = mapPayinMethod(request?.payin_method ?? 'bank_transfer')
  const payout = mapPayoutMethod(request?.payout_method ?? 'bank_deposit')
  return [{ payin_method: payin, payout_method: payout }]
}

export const parseAlansariPayload = (
  payload: AlansariPayload,
  request: CollectorRequest,
): AlansariParsedQuote | null => {
  if (!payload || typeof payload !== 'object') return null
  if (!isSuccess(payload)) return null

  const flags: QualityFlag[] = []
  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmount = request.send_amount
  const exchangeRate = parseNumber(payload.get_rate)

  let receiveAmount = parseNumber(payload.amount)
  if (!Number.isFinite(receiveAmount) && Number.isFinite(exchangeRate)) {
    receiveAmount = sendAmount * exchangeRate
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(receiveAmount) || !Number.isFinite(exchangeRate)) {
    flags.push(qualityFlags.parse_error)
  }

  const payin = mapPayinMethod(request.payin_method ?? 'bank_transfer')
  const payout = mapPayoutMethod(request.payout_method ?? 'bank_deposit')

  if (payin === 'other' || payout === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  return {
    send_amount: sendAmount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: 0,
    total_debit_amount: sendAmount,
    payin_method: payin,
    payout_method: payout,
    fee_currency: sourceCurrency ?? null,
    exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'alansari_quote_v1',
    parse_flags: flags,
  }
}
