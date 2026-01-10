import type { CollectorRequest } from '../../collectors/types'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'

type WorldRemitMoney = {
  amount: number
  currency: string
  __typename: string
}

type WorldRemitFee = {
  value: WorldRemitMoney
  type: string
  __typename: string
}

type WorldRemitDiscount = {
  value: WorldRemitMoney
  type: string
  __typename: string
}

type WorldRemitInformativeSummary = {
  fee: WorldRemitFee
  discount: WorldRemitDiscount
  appliedPromotions: unknown[]
  totalToPay: {
    amount: number
    __typename: string
  }
  __typename: string
}

type WorldRemitExchangeRate = {
  value: number
  crossedOutValue: number | null
  __typename: string
}

type WorldRemitPayInMethod = {
  name: string
  transferRedirectionType: string
  id: string
  icon: {
    resolutions: unknown[]
    __typename: string
  }
  __typename: string
}

type WorldRemitPayInMethodCalculation = {
  totalToPay: WorldRemitMoney
  payInMethod: WorldRemitPayInMethod
  __typename: string
}

type WorldRemitCalculation = {
  id: string | null
  isFree: boolean
  informativeSummary: WorldRemitInformativeSummary
  payInMethodsCalculations: WorldRemitPayInMethodCalculation[]
  send: WorldRemitMoney
  receive: WorldRemitMoney
  rounding: {
    sendRoundingSeed: number
    receiveRoundingSeed: number
    __typename: string
  }
  exchangeRate: WorldRemitExchangeRate
  __typename: string
}

type WorldRemitCreateCalculation = {
  calculation: WorldRemitCalculation
  errors: Array<{
    __typename: string
    message: string
    [key: string]: unknown
  }>
  __typename: string
}

type WorldRemitPayoutMethod = {
  code: string
  payOutTimeEstimate: string
  correspondents: Array<{
    id: string
    name: string
    payOutTime: string | null
    __typename: string
  }>
  __typename: string
}

type WorldRemitPayload = {
  payoutMethods?: {
    payOutMethods: WorldRemitPayoutMethod[]
  }
  calculation?: {
    createCalculation: WorldRemitCreateCalculation
  }
  mappedPayoutMethod?: string
  selectedPayoutMethod?: WorldRemitPayoutMethod | null
}

export type WorldRemitParsedQuote = {
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

const parseNumber = (value?: number | string | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const mapPayout = (code?: string): string => {
  if (!code) return 'other'
  return payoutMethodMap[code] ?? 'other'
}

const mapPayin = (method?: WorldRemitPayInMethod | null): string => {
  if (!method) return 'other'
  const parts = [method.transferRedirectionType, method.name, method.id].filter(Boolean).join(' ')
  const token = normalizeToken(parts)
  const mapped =
    payinMethodMap[method.transferRedirectionType] ??
    payinMethodMap[method.name] ??
    payinMethodMap[method.id] ??
    payinMethodMap[token] ??
    null
  if (mapped) return mapped

  if (token.includes('bank') || token.includes('transfer')) return 'bank_transfer'
  if (token.includes('debit')) return 'debit_card'
  if (token.includes('credit')) return 'credit_card'
  if (token.includes('card')) return 'debit_card'
  if (token.includes('cash')) return 'cash'
  if (token.includes('apple')) return 'apple_pay'
  if (token.includes('google')) return 'google_pay'
  return 'other'
}

const parseDeliveryTime = (estimate?: string): { min: number | null; max: number | null } => {
  if (!estimate) return { min: null, max: null }
  
  if (estimate.includes('Within 5 minutes') || estimate.includes('⚡ Within 5 minutes')) {
    return { min: 0, max: 5 }
  }
  
  if (estimate.includes('Same day')) {
    return { min: 0, max: 1440 }
  }
  
  // Handle ranges like "1-3 days", "2-4 hours", etc.
  if (estimate.includes('-')) {
    const rangeMatch = estimate.match(/(\d+)\s*-\s*(\d+)\s*(days?|hours?|minutes?)/i)
    if (rangeMatch) {
      const minVal = parseInt(rangeMatch[1], 10)
      const maxVal = parseInt(rangeMatch[2], 10)
      const unit = rangeMatch[3].toLowerCase()
      
      if (unit.startsWith('day')) {
        return { min: minVal * 24 * 60, max: maxVal * 24 * 60 }
      } else if (unit.startsWith('hour')) {
        return { min: minVal * 60, max: maxVal * 60 }
      } else if (unit.startsWith('minute')) {
        return { min: minVal, max: maxVal }
      }
    }
  }
  
  if (estimate.includes('minutes')) {
    const match = estimate.match(/(\d+)\s*minutes?/i)
    if (match) {
      const minutes = parseInt(match[1], 10)
      return { min: minutes, max: minutes }
    }
  }
  
  if (estimate.includes('hours') || estimate.includes('hour')) {
    const match = estimate.match(/(\d+)\s*hours?/i)
    if (match) {
      const hours = parseInt(match[1], 10)
      const minutes = hours * 60
      return { min: minutes, max: minutes }
    }
  }
  
  if (estimate.includes('days') || estimate.includes('day')) {
    const match = estimate.match(/(\d+)\s*days?/i)
    if (match) {
      const days = parseInt(match[1], 10)
      const minutes = days * 24 * 60
      return { min: minutes, max: minutes }
    }
  }
  
  return { min: null, max: null }
}

export const extractWorldRemitMethodPairs = (payload: WorldRemitPayload) => {
  const pairs: Array<{ payin_method: string; payout_method: string }> = []
  
  if (!payload.calculation?.createCalculation?.calculation) {
    return pairs
  }
  
  const calculation = payload.calculation.createCalculation.calculation
  const payoutMethod =
    payload.selectedPayoutMethod?.code
      ? mapPayout(payload.selectedPayoutMethod.code)
      : payload.mappedPayoutMethod ?? 'other'
  
  if (calculation.payInMethodsCalculations && calculation.payInMethodsCalculations.length > 0) {
    for (const payInCalc of calculation.payInMethodsCalculations) {
      const payinMethod = mapPayin(payInCalc.payInMethod)
      pairs.push({
        payin_method: payinMethod,
        payout_method: payoutMethod,
      })
    }
  } else {
    pairs.push({
      payin_method: 'other',
      payout_method: payoutMethod,
    })
  }
  
  return pairs
}

const getCalculationFromPayload = (payload: WorldRemitPayload): WorldRemitCalculation | null => {
  if (!payload.calculation?.createCalculation?.calculation) {
    return null
  }
  return payload.calculation.createCalculation.calculation
}

const selectPayinOption = (
  calculation: WorldRemitCalculation,
  request: CollectorRequest,
  flags: QualityFlag[],
) => {
  const payInCalculations = calculation.payInMethodsCalculations ?? []
  if (!payInCalculations.length) {
    return { payin_method: 'other', total_to_pay: Number.NaN }
  }

  const options = payInCalculations.map((calc) => ({
    payin_method: mapPayin(calc.payInMethod),
    total_to_pay: parseNumber(calc.totalToPay?.amount),
  }))

  const requested = request.payin_method
  const match = requested && requested !== 'other'
    ? options.find(option => option.payin_method === requested)
    : null

  if (match) {
    return match
  }

  flags.push(qualityFlags.partial_data)
  return options[0]
}

export const parseWorldRemitPayload = (
  payload: WorldRemitPayload,
  request: CollectorRequest,
): WorldRemitParsedQuote | null => {
  const flags: QualityFlag[] = []
  
  const calculation = getCalculationFromPayload(payload)
  if (!calculation) {
    flags.push(qualityFlags.parse_error)
    return null
  }
  
  const createCalculationResult = payload.calculation?.createCalculation
  if (createCalculationResult?.errors && createCalculationResult.errors.length > 0) {
    flags.push(qualityFlags.parse_error)
    return null
  }
  
  const sendAmount = parseNumber(calculation.send?.amount)
  const receiveAmount = parseNumber(calculation.receive?.amount)
  const summaryTotalToPay = parseNumber(calculation.informativeSummary?.totalToPay?.amount)
  const feeAmountRaw = parseNumber(calculation.informativeSummary?.fee?.value?.amount)
  const discountAmount = parseNumber(calculation.informativeSummary?.discount?.value?.amount)
  const exchangeRateValue = parseNumber(calculation.exchangeRate?.value)
  const exchangeRateCrossedOut = parseNumber(calculation.exchangeRate?.crossedOutValue)

  const selectedPayin = selectPayinOption(calculation, request, flags)
  const payinMethod = selectedPayin.payin_method
  const selectedTotalToPay = Number.isFinite(selectedPayin.total_to_pay)
    ? selectedPayin.total_to_pay
    : summaryTotalToPay
  const feeFromTotal = Number.isFinite(selectedTotalToPay) && Number.isFinite(sendAmount)
    ? selectedTotalToPay - sendAmount
    : Number.NaN
  const feeDelta = Number.isFinite(feeAmountRaw) && Number.isFinite(feeFromTotal)
    ? Math.abs(feeFromTotal - feeAmountRaw)
    : Number.NaN
  const feeFromTotalDiscounted = Number.isFinite(feeAmountRaw)
    && Number.isFinite(feeFromTotal)
    && feeFromTotal < feeAmountRaw - 0.005
  const payinOverridesSummary = Number.isFinite(selectedPayin.total_to_pay)
    && Number.isFinite(summaryTotalToPay)
    && Math.abs(selectedPayin.total_to_pay - summaryTotalToPay) > 0.0001

  const feeAmount = payinOverridesSummary && Number.isFinite(feeFromTotal)
    ? feeFromTotal
    : Number.isFinite(feeAmountRaw)
      ? feeAmountRaw
      : Number.isFinite(feeFromTotal)
        ? feeFromTotal
        : Number.NaN

  const payoutMethodCode =
    payload.selectedPayoutMethod?.code ??
    payload.payoutMethods?.payOutMethods?.[0]?.code
  const payoutMethod =
    payoutMethodCode ? mapPayout(payoutMethodCode) : payload.mappedPayoutMethod ?? 'other'
  const feeCurrency = calculation.informativeSummary?.fee?.value?.currency ?? null

  const deliveryTimeEstimate =
    payload.selectedPayoutMethod?.payOutTimeEstimate ??
    payload.payoutMethods?.payOutMethods?.[0]?.payOutTimeEstimate
  let { min: deliveryTimeMin, max: deliveryTimeMax } = parseDeliveryTime(deliveryTimeEstimate)
  
  // If delivery time is unknown and payout method is bank deposit, default to 1-3 days
  if (deliveryTimeMin === null && deliveryTimeMax === null) {
    const isBankDeposit = payoutMethod === 'bank' || payoutMethod === 'bank_deposit'
    if (isBankDeposit) {
      deliveryTimeMin = 1440 // 1 day in minutes
      deliveryTimeMax = 4320 // 3 days in minutes
      flags.push(qualityFlags.partial_data) // Flag as partial data since we're using a default
    }
  }
  
  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }
  
  if (!Number.isFinite(feeAmount)) {
    flags.push(qualityFlags.partial_data)
  }
  
  if (!Number.isFinite(exchangeRateValue)) {
    flags.push(qualityFlags.partial_data)
  }

  const baseRate = Number.isFinite(exchangeRateValue)
    ? Number.isFinite(exchangeRateCrossedOut) && exchangeRateCrossedOut > 0 && exchangeRateCrossedOut !== exchangeRateValue
      ? exchangeRateCrossedOut
      : exchangeRateValue
    : null
  const promotionalRate = Number.isFinite(exchangeRateValue) &&
    Number.isFinite(exchangeRateCrossedOut) &&
    exchangeRateCrossedOut > 0 &&
    exchangeRateCrossedOut !== exchangeRateValue
    ? exchangeRateValue
    : null

  const promotionalFeeAmount = !payinOverridesSummary
    && Number.isFinite(feeAmountRaw)
    && Number.isFinite(discountAmount)
    && discountAmount > 0
    ? Math.max(feeAmountRaw - discountAmount, 0)
    : !payinOverridesSummary
      && Number.isFinite(feeAmountRaw)
      && Number.isFinite(feeFromTotal)
      && feeFromTotal >= 0
      && feeFromTotalDiscounted
      && !(Number.isFinite(feeDelta) && feeDelta <= 0.005)
      ? feeFromTotal
      : null
  
  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: Number.isFinite(selectedTotalToPay)
      ? selectedTotalToPay
      : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
        ? sendAmount + feeAmount
        : sendAmount,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: feeCurrency,
    exchange_rate: Number.isFinite(exchangeRateValue) ? exchangeRateValue : null,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: promotionalRate,
    base_rate: baseRate,
    promotional_cap_amount: null,
    delivery_time_min_minutes: deliveryTimeMin,
    delivery_time_max_minutes: deliveryTimeMax,
    collected_at: new Date().toISOString(),
    parser_version: 'worldremit_v1',
    parse_flags: flags,
  }
}
