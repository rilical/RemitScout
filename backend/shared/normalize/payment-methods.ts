import type { CanonicalPayinMethod, CanonicalPayoutMethod } from './canonical'
import { toCanonicalPayinMethod, toCanonicalPayoutMethod } from './canonical'

const normalizeToken = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
}

const PAYIN_ALIASES: Record<string, string> = {
  bank: 'bank_transfer',
  card: 'debit_card',
  cash: 'cash',
} as const

const PAYOUT_ALIASES: Record<string, string> = {
  bank: 'bank_deposit',
  cash: 'cash_pickup',
  wallet: 'mobile_wallet',
} as const

/**
 * Plane A normalization for user inputs: accept UI aliases and canonical tokens.
 * Returns null when the value is not recognized (instead of coercing to "other").
 */
export const normalizePayinMethod = (value?: string | null): CanonicalPayinMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  const mapped = PAYIN_ALIASES[token] ?? token
  const canonical = toCanonicalPayinMethod(mapped)
  return canonical === 'other' ? null : canonical
}

/**
 * Plane A normalization for user inputs: accept UI aliases and canonical tokens.
 * Returns null when the value is not recognized (instead of coercing to "other").
 */
export const normalizePayoutMethod = (value?: string | null): CanonicalPayoutMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  const mapped = PAYOUT_ALIASES[token] ?? token
  const canonical = toCanonicalPayoutMethod(mapped)
  return canonical === 'other' ? null : canonical
}

