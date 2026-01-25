import type { CollectorRequest } from '../../collectors/types'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { qualityFlags, QualityFlag } from '../../normalize/quality-flags'

const logger = createLogger('plane-b.dahabshiil.parse')

type DahabshiilCharges = {
  source_currency?: string | null
  source_amount?: string | number | null
  rate?: string | number | null
  base_rate?: string | number | null
  destination_currency?: string | null
  destination_amount?: string | number | null
  commission?: string | number | null
  agent_fee?: string | number | null
  hq_fee?: string | number | null
  total_charges?: string | number | null
  tax?: string | number | null
}

export type DahabshiilPayload = {
  status?: string | null
  code?: number | null
  message?: string | null
  errors?: string[] | null
  form?: {
    errors?: string[] | null
    children?: Record<string, { errors?: string[] | null } | null> | null
  } | null
  data?: {
    charges?: DahabshiilCharges | null
  } | null
}

export type DahabshiilParsedQuote = {
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

const normalizeStatus = (value?: string | null) => {
  if (!value) return ''
  return value.trim().toLowerCase()
}

export const getDahabshiilErrorMessages = (payload: DahabshiilPayload): string[] => {
  const messages: string[] = []
  if (Array.isArray(payload.errors)) {
    messages.push(...payload.errors.filter(Boolean))
  }
  const formErrors = payload.form?.errors
  if (Array.isArray(formErrors)) {
    messages.push(...formErrors.filter(Boolean))
  }
  const children = payload.form?.children ?? null
  if (children && typeof children === 'object') {
    for (const child of Object.values(children)) {
      if (!child?.errors || !Array.isArray(child.errors)) continue
      messages.push(...child.errors.filter(Boolean))
    }
  }
  return messages
}

const getCharges = (payload: DahabshiilPayload): DahabshiilCharges | null => {
  return payload.data?.charges ?? null
}

export const extractDahabshiilMethodPairs = () => {
  return [
    { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
  ]
}

export const parseDahabshiilPayload = (
  payload: DahabshiilPayload,
  request: CollectorRequest,
): DahabshiilParsedQuote | null => {
  const flags: QualityFlag[] = []

  if (!payload || typeof payload !== 'object') {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const errors = getDahabshiilErrorMessages(payload)
  if (errors.length > 0) {
    logger.warn('dahabshiil_parse_error_messages', {
      corridor_id: request.corridor_id,
      errors,
    })
    return null
  }

  const status = normalizeStatus(payload.status)
  if (status && status !== 'success') {
    logger.warn('dahabshiil_parse_error_status', {
      corridor_id: request.corridor_id,
      status: payload.status,
      code: payload.code,
      message: payload.message,
    })
    return null
  }

  const charges = getCharges(payload)
  if (!charges) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  const { sourceCurrency } = requireCorridorId(request.corridor_id)
  const sendAmountRaw = parseNumber(charges.source_amount)
  const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount
  const rate = parseNumber(charges.base_rate ?? charges.rate)
  const receiveAmountRaw = parseNumber(charges.destination_amount)
  const receiveAmount = Number.isFinite(receiveAmountRaw)
    ? receiveAmountRaw
    : Number.isFinite(rate)
      ? sendAmount * rate
      : Number.NaN

  const totalChargesValue = parseNumber(charges.total_charges)
  const commissionValue = parseNumber(charges.commission)
  const agentFeeValue = parseNumber(charges.agent_fee)
  const hqFeeValue = parseNumber(charges.hq_fee)
  const taxValue = parseNumber(charges.tax)
  const fallbackFees = [commissionValue, agentFeeValue, hqFeeValue, taxValue]
    .filter(value => Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0)
  const feeAmountRaw = Number.isFinite(totalChargesValue)
    ? totalChargesValue
    : Number.isFinite(commissionValue)
      ? commissionValue
      : fallbackFees > 0
        ? fallbackFees
        : Number.NaN
  const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN
  const totalDebitRaw = Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
    ? sendAmount + feeAmount
    : Number.NaN

  if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
    flags.push(qualityFlags.parse_error)
    return null
  }

  if (!Number.isFinite(feeAmountRaw)) {
    flags.push(qualityFlags.partial_data)
  }

  if (!Number.isFinite(rate)) {
    flags.push(qualityFlags.partial_data)
  }

  const payinMethod = request.payin_method || 'bank_transfer'
  const payoutMethod = request.payout_method || 'cash_pickup'
  const totalDebit = Number.isFinite(totalDebitRaw)
    ? totalDebitRaw
    : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0)

  return {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
    total_debit_amount: totalDebit,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    fee_currency: charges.source_currency ?? sourceCurrency,
    promotional_fee_amount: null,
    promotional_rate: null,
    base_rate: Number.isFinite(rate) ? rate : null,
    promotional_cap_amount: null,
    delivery_time_min_minutes: null,
    delivery_time_max_minutes: null,
    collected_at: new Date().toISOString(),
    parser_version: 'dahabshiil_quote_v1',
    parse_flags: flags,
  }
}
