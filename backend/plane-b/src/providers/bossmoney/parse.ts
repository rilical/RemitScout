import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

type BossMoneyFeeByPaymentMethod = {
  payment_method?: string | null
  fee?: string | number | null
  status?: string | null
  highlight_fee?: boolean | null
  is_enabled?: boolean | null
}

type BossMoneyFee = {
  pricing_rule_name?: string | null
  fee?: string | number | null
  currency_code?: string | null
  max_amount?: string | number | null
  fees_by_payment_method?: BossMoneyFeeByPaymentMethod[] | null
}

type BossMoneyRates = {
  sell_rate?: string | number | null
  base_sell_rate?: string | number | null
}

type BossMoneyAmounts = {
  sender?: string | number | null
  recipient?: string | number | null
}

type BossMoneyFreeTransaction = {
  max_amount?: string | number | null
  currency_code?: string | null
}

export type BossMoneyPayload = {
  free_transaction?: BossMoneyFreeTransaction | null
  pricing_fee?: BossMoneyFee | null
  fee?: BossMoneyFee | null
  loyalty_stats?: unknown
  fx_rates?: BossMoneyRates | null
  amounts?: BossMoneyAmounts | null
}

export type BossMoneyParsedQuote = {
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

const isEntryEnabled = (entry?: BossMoneyFeeByPaymentMethod | null) => {
  if (!entry) return false
  const status = entry.status?.toLowerCase()
  if (status && status !== 'available') return false
  if (entry.is_enabled === false) return false
  return true
}

const resolveMethodFee = (
  entries: BossMoneyFeeByPaymentMethod[] | null | undefined,
  payinMethod: string,
): { fee: number; matched: boolean } => {
  if (!entries || entries.length === 0) {
    return { fee: Number.NaN, matched: false }
  }

  const matching = entries.filter((entry) => mapPayinMethod(entry.payment_method) === payinMethod)
  if (matching.length === 0) {
    return { fee: Number.NaN, matched: false }
  }

  const preferred = matching.find(isEntryEnabled) ?? matching[0]
  return { fee: parseNumber(preferred.fee), matched: true }
}

export const extractBossMoneyMethodPairs = (payload: BossMoneyPayload) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const entries = payload?.pricing_fee?.fees_by_payment_method ?? []

  for (const entry of entries) {
    const payin = mapPayinMethod(entry.payment_method)
    if (payin === 'other') continue
    const payout = 'bank_deposit'
    pairs.set(`${payin}:${payout}`, { payin_method: payin, payout_method: payout })
  }

  if (pairs.size === 0) {
    pairs.set('bank_transfer:bank_deposit', {
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
    })
  }

  return Array.from(pairs.values())
}

export const parseBossMoneyPayload = (
  payload: BossMoneyPayload,
  request: CollectorRequest,
): BossMoneyParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency, destCurrency } = requireCorridorId(request.corridor_id)

  const sendAmountRaw = parseNumber(payload.amounts?.sender)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount

  const receiveAmountRaw = parseNumber(payload.amounts?.recipient)
  const promotionalRateRaw = parseNumber(payload.fx_rates?.sell_rate)
  const baseRateRaw = parseNumber(payload.fx_rates?.base_sell_rate)

  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(promotionalRateRaw)
      ? sendAmount * promotionalRateRaw
      : Number.isFinite(baseRateRaw)
        ? sendAmount * baseRateRaw
        : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
  }

  if (!Number.isFinite(promotionalRateRaw) && !Number.isFinite(baseRateRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  const requestedPayin = mapPayinMethod(request.payin_method)
  const payinMethod = requestedPayin !== 'other' ? requestedPayin : 'bank_transfer'
  if (requestedPayin === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  const requestedPayout = mapPayoutMethod(request.payout_method)
  const payoutMethod = requestedPayout !== 'other' ? requestedPayout : 'bank_deposit'
  if (requestedPayout === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  const { fee: methodFee, matched } = resolveMethodFee(
    payload.pricing_fee?.fees_by_payment_method,
    payinMethod,
  )
  if (!matched) {
    flags.push(qualityFlags.partial_data)
  }

  const baseFeeRaw = Number.isFinite(methodFee)
    ? methodFee
    : parseNumber(payload.pricing_fee?.fee)

  const actualFeeRaw = Number.isFinite(parseNumber(payload.fee?.fee))
    ? parseNumber(payload.fee?.fee)
    : Number.isFinite(methodFee)
      ? methodFee
      : parseNumber(payload.pricing_fee?.fee)

  if (!Number.isFinite(actualFeeRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  const promotionalFeeAmount = Number.isFinite(baseFeeRaw)
    && Number.isFinite(actualFeeRaw)
    && baseFeeRaw > actualFeeRaw
    ? actualFeeRaw
    : null

  const feeCurrency =
    payload.pricing_fee?.currency_code
    ?? payload.fee?.currency_code
    ?? sourceCurrency

  const promoCapRaw = parseNumber(payload.free_transaction?.max_amount)
  const promotionalCapAmount = Number.isFinite(promoCapRaw) ? promoCapRaw : null

  return {
    send_amount: Number.isFinite(sendAmount) ? sendAmount : 0,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: Number.isFinite(actualFeeRaw) ? actualFeeRaw : 0,
    total_debit_amount: Number.isFinite(actualFeeRaw)
      ? sendAmount + actualFeeRaw
      : sendAmount,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: feeCurrency ?? sourceCurrency,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
    base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
    promotional_cap_amount: promotionalCapAmount,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'bossmoney_promo_calc_v1',
    parse_flags: flags,
  }
}
