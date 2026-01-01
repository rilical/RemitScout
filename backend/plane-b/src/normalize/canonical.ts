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
  'other',
] as const

export type CanonicalPayinMethod = (typeof canonicalPayinMethods)[number]
export type CanonicalPayoutMethod = (typeof canonicalPayoutMethods)[number]

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

export const toCanonicalPayinMethod = (value?: string | null): CanonicalPayinMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (canonicalPayinMethods.includes(token as CanonicalPayinMethod)) {
    return token as CanonicalPayinMethod
  }
  return 'other'
}

export const toCanonicalPayoutMethod = (value?: string | null): CanonicalPayoutMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (canonicalPayoutMethods.includes(token as CanonicalPayoutMethod)) {
    return token as CanonicalPayoutMethod
  }
  return 'other'
}

export const normalizeCountryCode = (value?: string | null) => {
  if (!value) {
    return ''
  }
  return value.trim().toUpperCase()
}

export const normalizeCurrencyCode = (value?: string | null) => {
  if (!value) {
    return ''
  }
  return value.trim().toUpperCase()
}
