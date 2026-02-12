import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, type QualityFlag } from '../../normalize/quality-flags'
import {
  mapPayinMethod,
  mapPayinToPlacidCode,
  mapPlacidPaymentType,
  mapPayoutMethod,
} from './code-map'
import {
  PLACID_CODE_BY_COUNTRY,
  PLACID_DESTINATION_CURRENCY_BY_COUNTRY,
} from './supported-corridors'

const logger = createLogger('plane-b.placid.parse')

export type PlacidRate = {
  placidCode: string
  currency: string
  rate: number
  name?: string | null
}

export type PlacidFee = {
  placidCode: string
  currency: string
  paymentType: string
  rangeMin: number
  rangeMax: number
  fee: number
  pct: number
}

export type PlacidPayload = {
  rates: PlacidRate[]
  fees: PlacidFee[]
}

export type PlacidParsedQuote = {
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
  const cleaned = String(value).replace(/[^0-9.+Ee-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const parseFeeStore = (html: string): PlacidFee[] => {
  const feeMatch = html.match(/FeesSTORG[\s\S]*?JSON\.stringify\(([^)]+)\)/)
  if (!feeMatch?.[1]) return []

  try {
    const encoded = feeMatch[1].trim()
    let decoded: string
    if (encoded.startsWith("'") && encoded.endsWith("'")) {
      decoded = encoded.slice(1, -1).replace(/\\'/g, "'")
    } else {
      decoded = JSON.parse(encoded)
    }
    if (typeof decoded !== 'string') return []
    const raw = JSON.parse(decoded) as Array<Record<string, unknown>>
    if (!Array.isArray(raw)) return []
    return raw
      .map((entry) => {
        const placidCode = String(entry.ConCode ?? '').trim().toUpperCase()
        const currency = String(entry.CurCode ?? '').trim().toUpperCase()
        const paymentType = String(entry.PymType ?? '').trim().toUpperCase()
        const rangeMin = parseNumber(entry.FrRange as string)
        const rangeMax = parseNumber(entry.ToRange as string)
        const fee = parseNumber(entry.FeeCust as string)
        const pct = parseNumber(entry.PctCust as string)
        if (!placidCode || !currency || !paymentType) return null
        if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return null
        return {
          placidCode,
          currency,
          paymentType,
          rangeMin,
          rangeMax,
          fee: Number.isFinite(fee) ? fee : 0,
          pct: Number.isFinite(pct) ? pct : 0,
        }
      })
      .filter((entry): entry is PlacidFee => Boolean(entry))
  } catch (error) {
    logger.warn('placid_fee_table_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

const parseRates = (html: string): PlacidRate[] => {
  const rateMatches = html.matchAll(/<div[^>]*class="list-item[^"]*"[^>]*>/g)
  const results: PlacidRate[] = []

  const getAttr = (tag: string, name: string) => {
    const match = tag.match(new RegExp(`${name}="([^"]+)"`))
    return match?.[1] ?? null
  }

  for (const match of rateMatches) {
    const tag = match[0]
    const placidCode = (getAttr(tag, 'data-code') ?? '').trim().toUpperCase()
    const currency = (getAttr(tag, 'data-currency') ?? '').trim().toUpperCase()
    const name = getAttr(tag, 'data-name')
    const rateValue = parseNumber(getAttr(tag, 'data-rate'))
    if (!placidCode || !currency || !Number.isFinite(rateValue)) continue
    results.push({
      placidCode,
      currency,
      rate: rateValue,
      name: name ? name.trim() : null,
    })
  }

  return results
}

export const parsePlacidHtml = (html: string): PlacidPayload => {
  if (!html) return { rates: [], fees: [] }
  return {
    rates: parseRates(html),
    fees: parseFeeStore(html),
  }
}

const resolvePayload = (payload?: PlacidPayload | string | null): PlacidPayload => {
  if (payload && typeof payload === 'object' && Array.isArray(payload.rates)) {
    return payload as PlacidPayload
  }
  if (typeof payload === 'string') {
    return parsePlacidHtml(payload)
  }
  return { rates: [], fees: [] }
}

type FeeSelection = {
  entry: PlacidFee | null
  usedFallback: boolean
}

const selectFeeEntry = (
  fees: PlacidFee[],
  placidCode: string,
  currency: string,
  payinCode: string,
  sendAmount: number,
): FeeSelection => {
  const normalizedCode = placidCode.toUpperCase()
  const normalizedCurrency = currency.toUpperCase()
  const normalizedPayin = payinCode.toUpperCase()

  const matches = fees.filter((fee) =>
    fee.placidCode === normalizedCode
    && fee.currency === normalizedCurrency,
  )

  const inRange = (fee: PlacidFee) => sendAmount >= fee.rangeMin && sendAmount <= fee.rangeMax

  const payinMatch = matches.find((fee) => fee.paymentType === normalizedPayin && inRange(fee))
  if (payinMatch) {
    return { entry: payinMatch, usedFallback: false }
  }

  const fallback = matches.find((fee) => inRange(fee))
  if (fallback) {
    return { entry: fallback, usedFallback: true }
  }

  return { entry: null, usedFallback: false }
}

export const extractPlacidMethodPairs = (payload?: PlacidPayload | string | null) => {
  const parsed = resolvePayload(payload)
  const payinMethods = new Set<string>()

  for (const fee of parsed.fees) {
    const mapped = mapPlacidPaymentType(fee.paymentType)
    if (mapped && mapped !== 'other') {
      payinMethods.add(mapped)
    }
  }

  if (payinMethods.size === 0) {
    payinMethods.add('debit_card')
    payinMethods.add('bank_transfer')
  }

  return Array.from(payinMethods).map((payin) => ({
    payin_method: payin,
    payout_method: 'bank_deposit',
  }))
}

export const parsePlacidPayload = (
  payload: PlacidPayload | string,
  request: CollectorRequest,
): PlacidParsedQuote | null => {
  const flags: QualityFlag[] = []
  const parsedPayload = resolvePayload(payload)
  const { sourceCurrency, destCountry, destCurrency } = requireCorridorId(request.corridor_id)
  const normalizedDestCountry = destCountry.toUpperCase()
  const normalizedDestCurrency = destCurrency.toUpperCase()
  const destinationCode = PLACID_CODE_BY_COUNTRY[normalizedDestCountry]

  if (!destinationCode) {
    flags.push(qualityFlags.unsupported_corridor)
    return null
  }

  const expectedCurrency = PLACID_DESTINATION_CURRENCY_BY_COUNTRY[normalizedDestCountry]
  if (expectedCurrency && expectedCurrency !== normalizedDestCurrency) {
    flags.push(qualityFlags.parse_error)
  }

  const rateEntry = parsedPayload.rates.find((rate) =>
    rate.placidCode === destinationCode && rate.currency === normalizedDestCurrency,
  )
  const baseRate = parseNumber(rateEntry?.rate ?? null)

  if (!Number.isFinite(baseRate)) {
    flags.push(qualityFlags.parse_error)
  }

  const sendAmount = request.send_amount
  const receiveAmount = Number.isFinite(baseRate) ? sendAmount * baseRate : 0

  const payinMethod = mapPayinMethod(request.payin_method ?? 'bank_transfer')
  const payoutMethod = mapPayoutMethod(request.payout_method ?? 'bank_deposit')
  const payinCode = mapPayinToPlacidCode(payinMethod)
  const feeSelection = selectFeeEntry(
    parsedPayload.fees,
    destinationCode,
    normalizedDestCurrency,
    payinCode,
    sendAmount,
  )

  if (!feeSelection.entry || feeSelection.usedFallback) {
    flags.push(qualityFlags.partial_data)
  }

  const feeAmount = feeSelection.entry
    ? feeSelection.entry.fee + (feeSelection.entry.pct * sendAmount)
    : 0

  return {
    send_amount: sendAmount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: sourceCurrency ?? null,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'placid_html_v1',
    parse_flags: flags,
  }
}
