/**
 * Canonical normalization shared across all planes.
 *
 * Plane A uses this for request normalization.
 * Plane B uses this as the final safety check in quote normalization.
 */

export const canonicalPayinMethods = [
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay',
  'cash',
  'other',
] as const

export const canonicalPayoutMethods = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
  'debit_card',
  'home_delivery',
  'other',
] as const

export type CanonicalPayinMethod = (typeof canonicalPayinMethods)[number]
export type CanonicalPayoutMethod = (typeof canonicalPayoutMethods)[number]

const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const isCanonicalPayinMethod = (value: string): value is CanonicalPayinMethod => {
  return canonicalPayinMethods.includes(value as CanonicalPayinMethod)
}

const isCanonicalPayoutMethod = (value: string): value is CanonicalPayoutMethod => {
  return canonicalPayoutMethods.includes(value as CanonicalPayoutMethod)
}

export const toCanonicalPayinMethod = (value?: string | null): CanonicalPayinMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (isCanonicalPayinMethod(token)) {
    return token
  }
  return 'other'
}

export const toCanonicalPayoutMethod = (value?: string | null): CanonicalPayoutMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (isCanonicalPayoutMethod(token)) {
    return token
  }
  return 'other'
}

export const normalizeCountryCode = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return ''
  }
  return normalized
}

export const normalizeCurrencyCode = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return ''
  }
  return normalized
}

