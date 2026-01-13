import countriesData from './countries-data.json'

type RemitbeeCountry = {
  country_id: number
  country_name?: string
  currency_name?: string
  currency_code: string
  iso2: string
  iso3?: string
}

const entries = Object.values(countriesData) as RemitbeeCountry[]
const normalizeIso2 = (value: string) => value.trim().toUpperCase()

export const remitbeeCountryByIso2 = new Map<string, RemitbeeCountry>()
export const countryIdByIso2: Record<string, number> = {}
export const currencyCodeByIso2: Record<string, string> = {}
export const currencyCodesByIso2: Record<string, string[]> = {}

const currencyOverridesByIso2: Record<string, string[]> = {
  CR: ['USD'],
  DO: ['USD'],
  GT: ['USD'],
  HN: ['USD'],
  JM: ['USD'],
  PE: ['USD'],
  UA: ['USD'],
  UY: ['USD'],
}

for (const entry of entries) {
  const iso2 = normalizeIso2(entry.iso2)
  remitbeeCountryByIso2.set(iso2, { ...entry, iso2 })
  countryIdByIso2[iso2] = entry.country_id
  currencyCodeByIso2[iso2] = entry.currency_code
  const overrides = currencyOverridesByIso2[iso2] ?? []
  currencyCodesByIso2[iso2] = Array.from(new Set([entry.currency_code, ...overrides]))
}

export const getRemitbeeCountry = (iso2: string) => {
  return remitbeeCountryByIso2.get(normalizeIso2(iso2))
}

export const getCountryIdForIso2 = (iso2: string) => {
  const normalized = normalizeIso2(iso2)
  return countryIdByIso2[normalized] ?? null
}

export const getCurrencyCodeForIso2 = (iso2: string) => {
  const normalized = normalizeIso2(iso2)
  return currencyCodeByIso2[normalized] ?? null
}

export const getCurrencyCodesForIso2 = (iso2: string) => {
  const normalized = normalizeIso2(iso2)
  return currencyCodesByIso2[normalized] ?? []
}

export const payinMethodMap: Record<string, string> = {
  debit: 'debit_card',
  debit_card: 'debit_card',
  credit: 'credit_card',
  credit_card: 'credit_card',
  card: 'debit_card',
  interac: 'bank_transfer',
  interac_e_transfer: 'bank_transfer',
  e_transfer: 'bank_transfer',
  etransfer: 'bank_transfer',
  bank: 'bank_transfer',
  bank_transfer: 'bank_transfer',
}

export const payoutMethodMap: Record<string, string> = {
  bank: 'bank_deposit',
  bank_deposit: 'bank_deposit',
  account: 'bank_deposit',
  cash: 'cash_pickup',
  wallet: 'mobile_wallet',
}
