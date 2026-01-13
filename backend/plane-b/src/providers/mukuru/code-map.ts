import { toCanonicalPayinMethod, toCanonicalPayoutMethod } from '../../normalize/canonical'

const SOURCE_COUNTRY_ALIASES: Record<string, string> = {
  US: 'AA', // Mukuru uses AA for "International" which is USD-based.
}

export const mapMukuruSourceCountry = (code: string): string => {
  const normalized = code.trim().toUpperCase()
  return SOURCE_COUNTRY_ALIASES[normalized] ?? normalized
}

export const mapMukuruPayinMethod = (method: string): string => {
  const normalized = toCanonicalPayinMethod(method)
  if (normalized === 'bank_transfer') return normalized
  if (normalized === 'debit_card' || normalized === 'credit_card') return normalized
  return 'bank_transfer'
}

export const mapMukuruPayoutMethod = (label?: string | null): string => {
  if (!label) return 'other'
  const normalized = label.toLowerCase()
  if (normalized.includes('cash')) return 'cash_pickup'
  if (normalized.includes('bank')) return 'bank_deposit'
  if (normalized.includes('wallet')) return 'mobile_wallet'
  if (normalized.includes('airtime')) return 'airtime'
  if (normalized.includes('m-pesa') || normalized.includes('mpesa')) return 'mobile_wallet'
  if (normalized.includes('top-up') || normalized.includes('topup')) return 'mobile_wallet'
  return toCanonicalPayoutMethod(label)
}
