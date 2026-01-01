import { COUNTRIES } from '../../../../shared/countries-currencies'

// Extracted from Wise currency selectors.
const WISE_SOURCE_CURRENCIES = [
  'AED',
  'AUD',
  'BGN',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'TRY',
  'UAH',
  'USD',
]

const WISE_DESTINATION_CURRENCIES = [
  'AED',
  'ALL',
  'ARS',
  'AUD',
  'AZN',
  'BAM',
  'BDT',
  'BGN',
  'BHD',
  'BMD',
  'BOB',
  'BRL',
  'BWP',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CVE',
  'CZK',
  'DKK',
  'DOP',
  'EGP',
  'EUR',
  'GBP',
  'GEL',
  'GHS',
  'GMD',
  'GNF',
  'GTQ',
  'HKD',
  'HNL',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KRW',
  'KWD',
  'LAK',
  'LKR',
  'MAD',
  'MNT',
  'MOP',
  'MUR',
  'MXN',
  'MYR',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PEN',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RWF',
  'SAR',
  'SCR',
  'SEK',
  'SGD',
  'SRD',
  'THB',
  'TND',
  'TRY',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'UYU',
  'VND',
  'ZAR',
]

const DEFAULT_COUNTRY_BY_CURRENCY: Record<string, string> = {
  USD: 'US',
  EUR: 'DE',
  GBP: 'GB',
  AUD: 'AU',
  CAD: 'CA',
  NZD: 'NZ',
  SGD: 'SG',
  HKD: 'HK',
}

const buildCurrencyCountryIndex = () => {
  const map = new Map<string, string[]>()
  for (const country of COUNTRIES) {
    const list = map.get(country.currency) ?? []
    list.push(country.code)
    map.set(country.currency, list)
  }
  return map
}

const currencyCountries = buildCurrencyCountryIndex()

const buildCountryCurrencyPairs = (currencies: string[]) => {
  const pairs: Array<[string, string]> = []
  for (const currency of currencies) {
    const countries = currencyCountries.get(currency) ?? []
    if (countries.length === 0) {
      const fallback = DEFAULT_COUNTRY_BY_CURRENCY[currency]
      if (fallback) {
        pairs.push([fallback, currency])
      }
      continue
    }
    for (const country of countries) {
      pairs.push([country, currency])
    }
  }
  return pairs
}

const FROM_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs(WISE_SOURCE_CURRENCIES)
const TO_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs(WISE_DESTINATION_CURRENCIES)

const buildSupportedCorridors = (): string[] => {
  const corridors: string[] = []

  for (const [fromCountry, fromCurrency] of FROM_COUNTRIES_WITH_CURRENCIES) {
    for (const [toCountry, toCurrency] of TO_COUNTRIES_WITH_CURRENCIES) {
      if (fromCountry === toCountry) continue
      corridors.push(`${fromCountry}-${toCountry}-${fromCurrency}-${toCurrency}`)
    }
  }

  return corridors
}

export const WISE_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const WISE_B2B_CORRIDORS: string[] = [...WISE_SUPPORTED_CORRIDORS]
