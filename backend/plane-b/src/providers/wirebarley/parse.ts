import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

type WirebarleyFee = {
  useDiscountFee?: boolean | null
  min?: number | string | null
  max?: number | string | null
  fee1?: number | string | null
  discountFee1?: number | string | null
  threshold1?: number | string | null
  fee2?: number | string | null
  discountFee2?: number | string | null
  threshold2?: number | string | null
  fee3?: number | string | null
  discountFee3?: number | string | null
  option?: string | null
  [key: string]: unknown
}

type WirebarleyRateData = {
  threshold?: number | string | null
  wbRate?: number | string | null
  threshold1?: number | string | null
  wbRate1?: number | string | null
  threshold2?: number | string | null
  wbRate2?: number | string | null
  threshold3?: number | string | null
  wbRate3?: number | string | null
  threshold4?: number | string | null
  wbRate4?: number | string | null
  threshold5?: number | string | null
  wbRate5?: number | string | null
  threshold6?: number | string | null
  wbRate6?: number | string | null
  threshold7?: number | string | null
  wbRate7?: number | string | null
  threshold8?: number | string | null
  wbRate8?: number | string | null
  wbRate9?: number | string | null
}

type WirebarleyExRate = {
  country?: string | null
  currency?: string | null
  wbRate?: number | string | null
  baseRate?: number | string | null
  paymentFees?: WirebarleyFee[] | null
  transferFees?: WirebarleyFee[] | null
  wbRateData?: WirebarleyRateData | null
}

type WirebarleyPayload = {
  data?: {
    exRates?: WirebarleyExRate[] | null
  }
}

export type WireBarleyParsedQuote = {
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
  const parsed = Number(String(value).replace(/[^0-9.+-Ee]/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const getExRates = (payload: WirebarleyPayload | Record<string, unknown> | null | undefined) => {
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray((payload as WirebarleyPayload).data?.exRates)) {
    return (payload as WirebarleyPayload).data?.exRates ?? []
  }
  if (Array.isArray((payload as { exRates?: WirebarleyExRate[] }).exRates)) {
    return (payload as { exRates?: WirebarleyExRate[] }).exRates ?? []
  }
  return []
}

const isAmountWithin = (fee: WirebarleyFee, amount: number) => {
  const min = parseNumber(fee.min)
  const max = parseNumber(fee.max)
  const aboveMin = Number.isFinite(min) ? amount >= min : true
  const belowMax = Number.isFinite(max) ? amount <= max : true
  return aboveMin && belowMax
}

const selectTierFee = (
  fee: WirebarleyFee,
  amount: number,
  useDiscount: boolean,
): number => {
  const fee1 = parseNumber(useDiscount ? fee.discountFee1 : fee.fee1)
  const fee2 = parseNumber(useDiscount ? fee.discountFee2 : fee.fee2)
  const fee3 = parseNumber(useDiscount ? fee.discountFee3 : fee.fee3)
  const threshold1 = parseNumber(fee.threshold1)
  const threshold2 = parseNumber(fee.threshold2)

  if (!Number.isFinite(threshold1)) {
    return Number.isFinite(fee1) ? fee1 : Number.NaN
  }

  if (amount <= threshold1) {
    return Number.isFinite(fee1) ? fee1 : Number.NaN
  }

  if (!Number.isFinite(threshold2)) {
    return Number.isFinite(fee2) ? fee2 : Number.isFinite(fee1) ? fee1 : Number.NaN
  }

  if (amount <= threshold2) {
    return Number.isFinite(fee2) ? fee2 : Number.isFinite(fee1) ? fee1 : Number.NaN
  }

  if (Number.isFinite(fee3)) return fee3
  if (Number.isFinite(fee2)) return fee2
  return Number.isFinite(fee1) ? fee1 : Number.NaN
}

const resolveFeeForEntry = (fee: WirebarleyFee, amount: number) => {
  const regularFee = selectTierFee(fee, amount, false)
  const discountFee = selectTierFee(fee, amount, true)
  const useDiscount = Boolean(fee.useDiscountFee)
  const actualFee = useDiscount && Number.isFinite(discountFee) ? discountFee : regularFee
  return {
    regular: regularFee,
    actual: actualFee,
  }
}

const selectBestFee = (
  fees: WirebarleyFee[],
  requestedMethod: string,
  mapper: (value?: string | null) => string,
  amount: number,
) => {
  if (!fees.length) return null

  const matches = fees.filter((entry) => mapper(entry.option) === requestedMethod)
  const candidates = matches.length ? matches : fees
  const applicable = candidates.filter((entry) => isAmountWithin(entry, amount))
  const scoped = applicable.length ? applicable : candidates

  let best: WirebarleyFee | null = null
  let bestFee = Number.POSITIVE_INFINITY
  for (const entry of scoped) {
    const { actual } = resolveFeeForEntry(entry, amount)
    if (Number.isFinite(actual) && actual < bestFee) {
      best = entry
      bestFee = actual
    }
  }

  return best ?? scoped[0] ?? null
}

const buildRateTiers = (rateData: WirebarleyRateData | null | undefined, fallbackRate: number) => {
  const tiers: Array<{ threshold: number; rate: number }> = []
  const pushTier = (thresholdValue: unknown, rateValue: unknown) => {
    const rate = parseNumber(rateValue as number | string | null)
    if (!Number.isFinite(rate)) return
    const threshold = parseNumber(thresholdValue as number | string | null)
    if (!Number.isFinite(threshold)) return
    tiers.push({ threshold, rate })
  }

  if (rateData) {
    pushTier(rateData.threshold, rateData.wbRate)
    pushTier(rateData.threshold1, rateData.wbRate1)
    pushTier(rateData.threshold2, rateData.wbRate2)
    pushTier(rateData.threshold3, rateData.wbRate3)
    pushTier(rateData.threshold4, rateData.wbRate4)
    pushTier(rateData.threshold5, rateData.wbRate5)
    pushTier(rateData.threshold6, rateData.wbRate6)
    pushTier(rateData.threshold7, rateData.wbRate7)
    pushTier(rateData.threshold8, rateData.wbRate8)
    pushTier(null, rateData.wbRate9)
  }

  if (!tiers.length && Number.isFinite(fallbackRate)) {
    tiers.push({ threshold: 0, rate: fallbackRate })
  }

  return tiers.sort((a, b) => a.threshold - b.threshold)
}

const resolveRate = (
  rateData: WirebarleyRateData | null | undefined,
  fallbackRate: number,
  amount: number,
  flags: QualityFlag[],
) => {
  const tiers = buildRateTiers(rateData, fallbackRate)
  if (!tiers.length) {
    flags.push(qualityFlags.partial_data)
    return Number.NaN
  }

  let selected = tiers[0]
  for (const tier of tiers) {
    if (amount >= tier.threshold) {
      selected = tier
    }
  }
  return selected.rate
}

const resolvePayinMethod = (
  entry: WirebarleyFee | null,
  request: CollectorRequest,
  flags: QualityFlag[],
) => {
  const mapped = entry ? mapPayinMethod(entry.option) : 'other'
  if (mapped !== 'other') return mapped
  flags.push(qualityFlags.partial_data)
  return request.payin_method || 'other'
}

const resolvePayoutMethod = (
  entry: WirebarleyFee | null,
  request: CollectorRequest,
  flags: QualityFlag[],
) => {
  const mapped = entry ? mapPayoutMethod(entry.option) : 'other'
  if (mapped !== 'other') return mapped
  flags.push(qualityFlags.partial_data)
  return request.payout_method || 'other'
}

export const extractWireBarleyMethodPairs = (payload: WirebarleyPayload | Record<string, unknown>) => {
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()
  const exRates = getExRates(payload)

  for (const rate of exRates) {
    const payins = new Set<string>()
    const payouts = new Set<string>()

    for (const fee of rate.paymentFees ?? []) {
      const mapped = mapPayinMethod(fee.option)
      if (mapped && mapped !== 'other') payins.add(mapped)
    }
    for (const fee of rate.transferFees ?? []) {
      const mapped = mapPayoutMethod(fee.option)
      if (mapped && mapped !== 'other') payouts.add(mapped)
    }

    if (payins.size === 0) payins.add('bank_transfer')
    if (payouts.size === 0) payouts.add('bank_deposit')

    for (const payin of payins) {
      for (const payout of payouts) {
        const key = `${payin}:${payout}`
        if (!pairs.has(key)) {
          pairs.set(key, { payin_method: payin, payout_method: payout })
        }
      }
    }
  }

  return Array.from(pairs.values())
}

export const parseWireBarleyPayload = (
  payload: WirebarleyPayload | Record<string, unknown>,
  request: CollectorRequest,
): WireBarleyParsedQuote | null => {
  const flags: QualityFlag[] = []
  const { destCountry, destCurrency, sourceCurrency } = requireCorridorId(request.corridor_id)
  const exRates = getExRates(payload)

  const selectedRate = exRates.find((rate) =>
    rate.country?.toUpperCase() === destCountry && rate.currency?.toUpperCase() === destCurrency,
  )

  if (!selectedRate) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const sendAmount = request.send_amount
  const baseRate = parseNumber(selectedRate.baseRate)
  const fallbackRate = parseNumber(selectedRate.wbRate)
  const exchangeRate = resolveRate(selectedRate.wbRateData ?? null, fallbackRate, sendAmount, flags)

  if (!Number.isFinite(exchangeRate)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const receiveAmount = sendAmount * exchangeRate
  if (!Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const payinEntry = selectBestFee(
    selectedRate.paymentFees ?? [],
    request.payin_method,
    mapPayinMethod,
    sendAmount,
  )
  const payoutEntry = selectBestFee(
    selectedRate.transferFees ?? [],
    request.payout_method,
    mapPayoutMethod,
    sendAmount,
  )

  const payinFee = payinEntry ? resolveFeeForEntry(payinEntry, sendAmount) : { regular: Number.NaN, actual: Number.NaN }
  const payoutFee = payoutEntry ? resolveFeeForEntry(payoutEntry, sendAmount) : { regular: Number.NaN, actual: Number.NaN }

  const regularFee = Number.isFinite(payinFee.regular) || Number.isFinite(payoutFee.regular)
    ? (Number.isFinite(payinFee.regular) ? payinFee.regular : 0)
      + (Number.isFinite(payoutFee.regular) ? payoutFee.regular : 0)
    : Number.NaN
  const actualFee = Number.isFinite(payinFee.actual) || Number.isFinite(payoutFee.actual)
    ? (Number.isFinite(payinFee.actual) ? payinFee.actual : 0)
      + (Number.isFinite(payoutFee.actual) ? payoutFee.actual : 0)
    : Number.NaN

  let feeAmount = Number.isFinite(actualFee) ? actualFee : Number.NaN
  let promotionalFeeAmount: number | null = null
  if (Number.isFinite(regularFee) && Number.isFinite(actualFee) && regularFee > actualFee) {
    feeAmount = regularFee
    promotionalFeeAmount = actualFee
  }

  if (!Number.isFinite(feeAmount)) {
    feeAmount = 0
    flags.push(qualityFlags.partial_data)
  }

  const payinMethod = resolvePayinMethod(payinEntry, request, flags)
  const payoutMethod = resolvePayoutMethod(payoutEntry, request, flags)

  if (payinMethod === 'other' || payoutMethod === 'other') {
    flags.push(qualityFlags.unknown_method)
  }

  const promotionalRate = Number.isFinite(baseRate) && Number.isFinite(exchangeRate) && exchangeRate !== baseRate
    ? exchangeRate
    : null

  if (!Number.isFinite(baseRate)) {
    flags.push(qualityFlags.partial_data)
  }

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: feeAmount,
    total_debit_amount: sendAmount + (promotionalFeeAmount ?? feeAmount),
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sourceCurrency ?? null,
    exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
    promotional_fee_amount: promotionalFeeAmount,
    promotional_rate: promotionalRate,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'wirebarley_v1',
    parse_flags: flags,
  }
}
