import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'
import { payinMethodMap, payoutMethodMap } from './code-map'
import type { XoomRemittance, XoomQuotePayload } from './fetch'

const logger = createLogger('plane-b.xoom.parse')

type XoomValidation = {
  code?: string | null
  message?: string | null
  path?: string | null
  level?: string | null
}

type XoomAmount = {
  rawValue?: string | number | null
  formattedValue?: string | null
  currencyCode?: string | null
  validations?: XoomValidation[] | null
}

type XoomPricing = {
  disbursementType?: string | null
  paymentType?: { type?: string | null } | null
  validations?: XoomValidation[] | null
  fxRate?: { rate?: string | number | null } | null
  sendAmount?: XoomAmount | null
  receiveAmount?: XoomAmount | null
  feeAmount?: XoomAmount | null
}

type XoomParsedQuote = {
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

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[\s._-]+/g, '_')

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  const normalized = normalizeToken(code)
  return payinMethodMap[code] ?? payinMethodMap[normalized] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  const normalized = normalizeToken(code)
  return payoutMethodMap[code] ?? payoutMethodMap[normalized] ?? 'other'
}

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const hasErrors = (validations?: XoomValidation[] | null) => {
  if (!validations || !validations.length) return false
  return validations.some((validation) => validation.level?.toUpperCase() === 'ERROR')
}

const resolveRemittance = (payload: XoomQuotePayload | null | undefined): XoomRemittance | null => {
  if (!payload) return null
  if (payload.remittance) return payload.remittance
  const data = (payload as {
    data?: { remittance?: XoomRemittance | null; data?: { remittance?: XoomRemittance | null } }
  }).data
  if (data?.remittance) return data.remittance
  if (data?.data?.remittance) return data.data.remittance
  return null
}

const getPricingOptions = (remittance: XoomRemittance | null): XoomPricing[] => {
  if (!remittance?.quote?.pricing) return []
  return remittance.quote.pricing as XoomPricing[]
}

export const extractXoomMethodPairs = (payload: XoomQuotePayload) => {
  const remittance = resolveRemittance(payload)
  const pricing = getPricingOptions(remittance)
  const pairs = new Map<string, { payin_method: string; payout_method: string }>()

  for (const option of pricing) {
    const payin = mapPayin(option.paymentType?.type ?? null)
    const payout = mapPayout(option.disbursementType ?? null)
    const key = `${payin}:${payout}`
    if (!pairs.has(key)) {
      pairs.set(key, { payin_method: payin, payout_method: payout })
    }
  }

  return Array.from(pairs.values())
}

const selectPricing = (
  options: XoomPricing[],
  request: CollectorRequest,
): { pricing: XoomPricing | null; parse_flags: QualityFlag[] } => {
  const flags: QualityFlag[] = []
  if (!options.length) {
    flags.push(qualityFlags.parse_error)
    return { pricing: null, parse_flags: flags }
  }

  const requestedPayin = request.payin_method
  const requestedPayout = request.payout_method

  if (requestedPayin && requestedPayout) {
    const match = options.find((option) => {
      const payin = mapPayin(option.paymentType?.type ?? null)
      const payout = mapPayout(option.disbursementType ?? null)
      return payin === requestedPayin && payout === requestedPayout
    })
    if (match) return { pricing: match, parse_flags: flags }
  }

  if (requestedPayout) {
    const match = options.find((option) => mapPayout(option.disbursementType ?? null) === requestedPayout)
    if (match) {
      flags.push(qualityFlags.partial_data)
      return { pricing: match, parse_flags: flags }
    }
  }

  if (requestedPayin) {
    const match = options.find((option) => mapPayin(option.paymentType?.type ?? null) === requestedPayin)
    if (match) {
      flags.push(qualityFlags.partial_data)
      return { pricing: match, parse_flags: flags }
    }
  }

  flags.push(qualityFlags.partial_data)
  return { pricing: options[0] ?? null, parse_flags: flags }
}

export const parseXoomPayload = (
  payload: XoomQuotePayload,
  request: CollectorRequest,
): XoomParsedQuote | null => {
  const remittance = resolveRemittance(payload)
  if (!remittance) {
    logger.warn('xoom_parse_no_remittance', { corridor_id: request.corridor_id })
    return null
  }

  if (hasErrors(remittance.validations ?? null)) {
    logger.warn('xoom_parse_remittance_errors', {
      corridor_id: request.corridor_id,
      validations: remittance.validations,
    })
    return null
  }

  const pricingOptions = getPricingOptions(remittance)
  const { pricing, parse_flags } = selectPricing(pricingOptions, request)
  if (!pricing) return null

  if (hasErrors(pricing.validations ?? null)) {
    logger.warn('xoom_parse_pricing_errors', {
      corridor_id: request.corridor_id,
      validations: pricing.validations,
    })
    return null
  }

  const { sourceCurrency } = requireCorridorId(request.corridor_id)
  const sendAmount = parseNumber(pricing.sendAmount?.rawValue ?? request.send_amount)
  const receiveAmount = parseNumber(pricing.receiveAmount?.rawValue ?? null)
  const feeAmount = parseNumber(pricing.feeAmount?.rawValue ?? null)
  const baseRate = parseNumber(pricing.fxRate?.rate ?? null)
  const payin = mapPayin(pricing.paymentType?.type ?? null)
  const payout = mapPayout(pricing.disbursementType ?? null)

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
    parse_flags.push(qualityFlags.parse_error)
  }

  return {
    send_amount: Number.isFinite(sendAmount) ? sendAmount : request.send_amount,
    receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: (Number.isFinite(sendAmount) ? sendAmount : request.send_amount)
      + (Number.isFinite(feeAmount) ? feeAmount : 0),
    payin_method: payin,
    payout_method: payout,
    fee_currency: pricing.feeAmount?.currencyCode ?? sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'xoom_html_v1',
    parse_flags,
  }
}
