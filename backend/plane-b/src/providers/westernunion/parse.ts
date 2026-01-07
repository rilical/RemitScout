import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type WUPayGroup = {
  fund_in?: string | null
  fx_rate?: number | string | null
  promotional_fx_rate?: number | string | null
  promo_fx_rate?: number | string | null
  promotional_rate?: number | string | null
  gross_fee?: number | string | null
  send_amount?: number | string | null
  receive_amount?: number | string | null
}

type WUServiceGroup = {
  service?: string | null
  service_name?: string | null
  speed_days?: number | string | null
  pay_groups?: WUPayGroup[] | null
}

type WUResponseStatus = {
  status?: number | null
  message?: string | null
}

type WUResponse = {
  response_status?: WUResponseStatus | null
  services_groups?: WUServiceGroup[] | null
  categories?: Array<Record<string, unknown>> | null
}

type WUOption = {
  payin_method: string
  payout_method: string
  fx_rate: number
  promotional_rate: number | null
  promotional_fee_amount: number | null
  delivery_label: string | null
  fee_amount: number
  send_amount: number | null
  receive_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
}

export type WesternUnionParsedQuote = {
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
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const payoutAliases: Record<string, string> = {
  money_in_minutes: 'cash_pickup',
  direct_to_bank: 'bank_deposit',
  davivienda_bank_deposito_banco: 'bank_deposit',
  mobile_money_transfer: 'mobile_wallet',
  mobile_money: 'mobile_wallet',
  wallet_account: 'mobile_wallet',
  account_deposit: 'bank_deposit',
  cash_pickup: 'cash_pickup',
  direct_to_card: 'other',
  home_delivery: 'other',
}

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  return (
    payinMethodMap[code] ??
    payinMethodMap[code.toUpperCase()] ??
    payinMethodMap[normalizeToken(code)] ??
    'other'
  )
}

const mapPayout = (code?: string | null, label?: string | null) => {
  const token = code ? normalizeToken(code) : ''
  const labelToken = label ? normalizeToken(label) : ''
  return (
    payoutMethodMap[code ?? ''] ??
    payoutMethodMap[(code ?? '').toUpperCase()] ??
    payoutMethodMap[token] ??
    payoutAliases[labelToken] ??
    payoutAliases[token] ??
    'other'
  )
}

const normalizeDeliveryWindow = (label: string | null, speedDays: number | null) => {
  const token = label ? normalizeToken(label) : ''
  if (token.includes('minutes')) {
    return { min: 15, max: 60 }
  }
  if (token.includes('direct_to_bank') || token.includes('bank')) {
    return { min: 60, max: 24 * 60 }
  }
  if (token.includes('direct_to_card')) {
    return { min: 30, max: 180 }
  }
  if (token.includes('mobile')) {
    return { min: 30, max: 180 }
  }
  if (token.includes('home_delivery')) {
    return { min: 24 * 60, max: 48 * 60 }
  }
  if (speedDays !== null && Number.isFinite(speedDays) && speedDays > 0) {
    const minutes = Math.round(speedDays * 1440)
    return { min: minutes, max: minutes }
  }
  return { min: null, max: null }
}

const buildOptions = (payload: WUResponse): WUOption[] => {
  const options: WUOption[] = []
  const serviceGroups = payload.services_groups ?? []
  for (const group of serviceGroups) {
    const payout = mapPayout(group.service, group.service_name)
    const payGroups = group.pay_groups ?? []
    for (const payGroup of payGroups) {
      const payin = mapPayin(payGroup.fund_in)
      const fxRate = parseNumber(payGroup.fx_rate)
      const promoRate = parseNumber(
        payGroup.promotional_fx_rate ?? payGroup.promo_fx_rate ?? payGroup.promotional_rate,
      )
      const netFee = parseNumber((payGroup as { net_fee?: number | string | null }).net_fee)
      const grossFee = parseNumber(payGroup.gross_fee)
      const feeValue = Number.isFinite(grossFee)
        ? grossFee
        : Number.isFinite(netFee)
          ? netFee
          : 0
      const promotionalFeeValue =
        Number.isFinite(netFee) && Number.isFinite(grossFee) && netFee < grossFee
          ? netFee
          : null
      const sendAmount = parseNumber(payGroup.send_amount)
      const receiveAmount = parseNumber(payGroup.receive_amount)
      const speedDays = parseNumber(group.speed_days)
      const deliveryLabel = group.service_name ?? null
      const deliveryWindow = normalizeDeliveryWindow(deliveryLabel, Number.isFinite(speedDays) ? speedDays : null)

      options.push({
        payin_method: payin,
        payout_method: payout,
        fx_rate: Number.isFinite(fxRate) ? fxRate : 0,
        promotional_rate: Number.isFinite(promoRate) ? promoRate : null,
        promotional_fee_amount: promotionalFeeValue,
        delivery_label: deliveryLabel,
        fee_amount: Number.isFinite(feeValue) ? feeValue : 0,
        send_amount: Number.isFinite(sendAmount) ? sendAmount : null,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : null,
        delivery_time_min_minutes: deliveryWindow.min,
        delivery_time_max_minutes: deliveryWindow.max,
      })
    }
  }
  return options
}

const chooseOption = (
  options: WUOption[],
  request: CollectorRequest,
): { option: WUOption | null; parse_flags: QualityFlag[] } => {
  const flags: QualityFlag[] = []
  if (!options.length) {
    flags.push(qualityFlags.parse_error)
    return { option: null, parse_flags: flags }
  }

  const requestedPayin = request.payin_method
  const requestedPayout = request.payout_method
  const match = options.find(
    option => option.payin_method === requestedPayin && option.payout_method === requestedPayout,
  )
  if (match) {
    return { option: match, parse_flags: flags }
  }

  const sorted = [...options].sort((a, b) => b.fx_rate - a.fx_rate)
  flags.push(qualityFlags.partial_data)
  return { option: sorted[0] ?? null, parse_flags: flags }
}

export const extractWesternUnionMethodPairs = (payload: WUResponse) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const options = buildOptions(payload)
  for (const option of options) {
    const key = `${option.payin_method}:${option.payout_method}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: option.payin_method, payout_method: option.payout_method })
    }
  }
  return Array.from(pairs.values())
}

export const parseWesternUnionPayload = (
  payload: WUResponse,
  request: CollectorRequest,
): WesternUnionParsedQuote | null => {
  const statusValue = payload.response_status?.status
  const statusNumber = statusValue === null || statusValue === undefined ? 0 : Number(statusValue)
  if (Number.isFinite(statusNumber) && statusNumber < 0) {
    return null
  }

  const options = buildOptions(payload)
  const { option, parse_flags } = chooseOption(options, request)
  if (!option) return null
  if (Number.isFinite(statusNumber) && statusNumber > 0) {
    parse_flags.push(qualityFlags.partial_data)
  }
  const { sourceCurrency } = requireCorridorId(request.corridor_id)

  const sendAmount = option.send_amount ?? request.send_amount
  const receiveAmount =
    option.receive_amount ?? (option.fx_rate > 0 ? sendAmount * option.fx_rate : Number.NaN)
  const feeForDebit = option.promotional_fee_amount ?? option.fee_amount

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    parse_flags.push(qualityFlags.parse_error)
  }

  return {
    send_amount: Number.isFinite(sendAmount) ? sendAmount : request.send_amount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: option.fee_amount,
    total_debit_amount: Number.isFinite(sendAmount) ? sendAmount + feeForDebit : 0,
    payin_method: option.payin_method,
    payout_method: option.payout_method,
    fee_currency: sourceCurrency,
    promotional_fee_amount: option.promotional_fee_amount,
    promotional_rate: option.promotional_rate,
    base_rate: option.fx_rate > 0 ? option.fx_rate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: option.delivery_time_min_minutes,
    delivery_time_max_minutes: option.delivery_time_max_minutes,
    collected_at: new Date().toISOString(),
    parser_version: 'westernunion_catalog_v1',
    parse_flags,
  }
}
