import type { CollectorRequest } from '../../collectors/types'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type WellsFargoPayload = {
  errorMessage?: string | null
  informationMessage?: string | null
  warningMessage?: string | null
  responseCode?: string | null
  receivingCountry?: string | null
  rnm?: string | null
  paymentMethod?: string | null
  requestedAmount?: string | null
  formattedDeliveyAmount?: string | null
  formattedFxRate?: string | null
  formattedTransferFeeString?: string | null
  deliveryAmountCurrency?: string | null
  fxCurrency?: string | null
  transferFeeCurrency?: string | null
  wibURL?: string | null
  totalAmount?: string | null
  specialOffers?: unknown
  transferFeesMap?: Record<string, string> | null
  fxRateMap?: Record<string, string> | null
  invalidFields?: unknown
  paymentTypes?: unknown
  rnmMap?: unknown
  paymentFromCashFlag?: boolean
  deliveryAmountCurrencyFlag?: boolean
  fxRateMapFlag?: boolean
  paymentFromAccountFlag?: boolean
  informationMessageMsgCode?: string | null
  receivingCountryCode?: string | null
  errorMessageMsgCode?: string | null
  paymentMethodCode?: string | null
  requestedRawAmount?: number
  rnmCode?: string | null
}

export type WellsFargoParsedQuote = {
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

const parseFormattedAmount = (formatted: string | null | undefined): number => {
  if (!formatted) return Number.NaN
  const cleaned = formatted.replace(/[^\d.-]/g, '')
  return parseNumber(cleaned)
}

const parseFxRateFromString = (rateString: string | null | undefined): number => {
  if (!rateString) return Number.NaN
  const match = rateString.match(/(\d+\.?\d*)/)
  if (!match) return Number.NaN
  return parseNumber(match[1])
}

const findFxRateForAmount = (
  fxRateMap: Record<string, string> | null | undefined,
  amount: number,
): number | null => {
  if (!fxRateMap || typeof fxRateMap !== 'object') return null

  for (const [range, rateString] of Object.entries(fxRateMap)) {
    const match = range.match(/\$?([\d,]+\.?\d*)\s*-\s*\$?([\d,]+\.?\d*)/)
    if (!match) continue

    const min = parseNumber(match[1].replace(/,/g, ''))
    const max = parseNumber(match[2].replace(/,/g, ''))

    if (Number.isFinite(min) && Number.isFinite(max) && amount >= min && amount <= max) {
      return parseFxRateFromString(rateString)
    }
  }

  return null
}

const findFeeForAmount = (
  transferFeesMap: Record<string, string> | null | undefined,
  amount: number,
): number | null => {
  if (!transferFeesMap || typeof transferFeesMap !== 'object') return null

  for (const [range, feeString] of Object.entries(transferFeesMap)) {
    const match = range.match(/\$?([\d,]+\.?\d*)\s*-\s*\$?([\d,]+\.?\d*)/)
    if (!match) continue

    const min = parseNumber(match[1].replace(/,/g, ''))
    const max = parseNumber(match[2].replace(/,/g, ''))

    if (Number.isFinite(min) && Number.isFinite(max) && amount >= min && amount <= max) {
      return parseFormattedAmount(feeString)
    }
  }

  return null
}

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  return payinMethodMap[code] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  return payoutMethodMap[code] ?? 'other'
}

export const parseWellsFargoPayload = (
  payload: WellsFargoPayload,
  request: CollectorRequest,
): WellsFargoParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (payload.responseCode !== 'success') {
    flags.push(qualityFlags.parse_error)
    if (payload.errorMessage) {
      flags.push(qualityFlags.partial_data)
    }
  }

  if (payload.errorMessage) {
    flags.push(qualityFlags.parse_error)
  }

  const sendAmount = parseNumber(payload.requestedRawAmount ?? payload.requestedAmount)
  const receiveAmount = parseFormattedAmount(payload.formattedDeliveyAmount)

  let feeAmount = parseFormattedAmount(payload.formattedTransferFeeString)
  if (!Number.isFinite(feeAmount) && sendAmount) {
    const feeFromMap = findFeeForAmount(payload.transferFeesMap, sendAmount)
    if (feeFromMap !== null && Number.isFinite(feeFromMap)) {
      feeAmount = feeFromMap
    }
  }

  let fxRate = parseFxRateFromString(payload.formattedFxRate)
  if (!Number.isFinite(fxRate) && sendAmount) {
    const rateFromMap = findFxRateForAmount(payload.fxRateMap, sendAmount)
    if (rateFromMap !== null && Number.isFinite(rateFromMap)) {
      fxRate = rateFromMap
    }
  }

  const payin = mapPayin(payload.paymentMethodCode)
  const payout = mapPayout(payload.paymentMethodCode)
  const feeCurrency = payload.transferFeeCurrency ?? 'USD'

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.parse_error)
  }

  if (payin === 'other' || payout === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  const totalDebitAmount = Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
    ? sendAmount + feeAmount
    : sendAmount

  const deliveryTime = {
    min: 1440,
    max: 4320,
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: totalDebitAmount,
    payin_method: payin,
    payout_method: payout,
    fee_currency: feeCurrency,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(fxRate) ? fxRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: deliveryTime.min,
    delivery_time_max_minutes: deliveryTime.max,
    collected_at: new Date().toISOString(),
    parser_version: 'wellsfargo_v1',
    parse_flags: flags,
  }
}

