import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { currencyMinorUnits, payinMethodMap, payoutMethodMap } from './code-map'

type KoronaPayCurrency = {
  id?: string | number | null
  code?: string | null
  name?: string | null
}

type KoronaPayTariff = {
  sendingCurrency?: KoronaPayCurrency | null
  sendingAmount?: number | string | null
  sendingAmountWithoutCommission?: number | string | null
  sendingAmountDiscount?: number | string | null
  sendingCommission?: number | string | null
  sendingCommissionDiscount?: number | string | null
  sendingTransferCommission?: number | string | null
  paidNotificationCommission?: number | string | null
  receivingCurrency?: KoronaPayCurrency | null
  receivingAmount?: number | string | null
  exchangeRate?: number | string | null
  exchangeRateType?: string | null
  exchangeRateDiscount?: number | string | null
  profit?: number | string | null
}

type KoronaPayTariffInfo = {
  sendingCurrency?: KoronaPayCurrency | null
  receivingCurrency?: KoronaPayCurrency | null
  paymentMethod?: string | null
  receivingMethod?: string | null
  minSendingAmount?: number | string | null
  maxSendingAmount?: number | string | null
  minReceivingAmount?: number | string | null
  maxReceivingAmount?: number | string | null
}

type KoronaPayError = {
  code?: number | string | null
  message?: string | null
  type?: string | null
}

type KoronaPayPayload = {
  tariffs?: KoronaPayTariff[] | KoronaPayError | null
  tariffInfo?: KoronaPayTariffInfo[] | KoronaPayError | null
}

export type KoronaPayParsedQuote = {
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

const normalizeToken = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .trim()
  .toLowerCase()
  .replace(/[\s./-]+/g, '_')

const parseNumber = (value?: number | string | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const getMinorUnits = (currencyCode?: string | null) => {
  if (!currencyCode) return 2
  const key = currencyCode.toUpperCase()
  return currencyMinorUnits[key] ?? 2
}

const fromMinorUnits = (value: number, currencyCode?: string | null) => {
  const factor = Math.pow(10, getMinorUnits(currencyCode))
  return value / factor
}

const isErrorPayload = (value: unknown): value is KoronaPayError => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as KoronaPayError
  return Boolean(candidate.type === 'error' || candidate.code)
}

const getTariffs = (payload: KoronaPayPayload | KoronaPayTariff[] | null | undefined) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (isErrorPayload(payload.tariffs ?? payload)) return []
  return Array.isArray(payload.tariffs) ? payload.tariffs : []
}

const getTariffInfo = (payload: KoronaPayPayload | KoronaPayTariffInfo[] | null | undefined) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (isErrorPayload(payload.tariffInfo ?? payload)) return []
  return Array.isArray(payload.tariffInfo) ? payload.tariffInfo : []
}

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  return payinMethodMap[code] ?? payinMethodMap[token]
    ?? (token.includes('credit') ? 'credit_card'
      : token.includes('debit') ? 'debit_card'
        : token.includes('card') ? 'debit_card'
          : 'other')
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  const token = normalizeToken(code)
  if (payoutMethodMap[code]) return payoutMethodMap[code]
  if (payoutMethodMap[token]) return payoutMethodMap[token]
  if (token.includes('cash')) return 'cash_pickup'
  if (token.includes('card')) return 'bank_deposit'
  if (token.includes('account') || token.includes('iban') || token.includes('bank')) return 'bank_deposit'
  if (token.includes('wallet')) return 'mobile_wallet'
  return 'other'
}

export const extractKoronaPayMethodPairs = (payload: KoronaPayPayload | KoronaPayTariffInfo[]) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  for (const info of getTariffInfo(payload)) {
    const payin = mapPayin(info.paymentMethod)
    const payout = mapPayout(info.receivingMethod)
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }
  return Array.from(pairs.values())
}

export const parseKoronaPayPayload = (
  payload: KoronaPayPayload | KoronaPayTariff[],
  request: CollectorRequest,
): KoronaPayParsedQuote | null => {
  const flags: QualityFlag[] = []
  const tariffs = getTariffs(payload)
  if (!tariffs.length) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const tariff = tariffs[0]
  const { sourceCurrency } = requireCorridorId(request.corridor_id)
  const sendCurrency = tariff.sendingCurrency?.code ?? sourceCurrency
  const receiveCurrency = tariff.receivingCurrency?.code ?? null

  const sendAmountRaw = parseNumber(tariff.sendingAmountWithoutCommission ?? tariff.sendingAmount)
  const feeAmountRaw = parseNumber(tariff.sendingCommission ?? tariff.sendingTransferCommission)
  const totalDebitRaw = parseNumber(tariff.sendingAmount)
  const receiveAmountRaw = parseNumber(tariff.receivingAmount)
  const exchangeRate = parseNumber(tariff.exchangeRate)

  const sendAmount = Number.isFinite(sendAmountRaw)
    ? fromMinorUnits(sendAmountRaw, sendCurrency)
    : Number.NaN
  const feeAmount = Number.isFinite(feeAmountRaw)
    ? fromMinorUnits(feeAmountRaw, sendCurrency)
    : Number.NaN
  const totalDebit = Number.isFinite(totalDebitRaw)
    ? fromMinorUnits(totalDebitRaw, sendCurrency)
    : Number.NaN
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? fromMinorUnits(receiveAmountRaw, receiveCurrency)
    : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmount) || !Number.isFinite(totalDebit)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(exchangeRate)) {
    flags.push(qualityFlags.partial_data)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(totalDebit)
      ? totalDebit
      : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
    payin_method: request.payin_method,
    payout_method: request.payout_method,
    fee_currency: sendCurrency ?? null,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'koronapay_v1',
    parse_flags: flags,
  }
}
