import { COUNTRIES } from '../../../../shared/countries-currencies'
import { WISE_DESTINATION_CURRENCIES, WISE_SOURCE_CURRENCIES } from '../../../../shared/provider-currencies'

// Wise uses provider-specific currency lists extracted from their currency selectors.
// This approach differs from other providers (Remitly, WorldRemit, etc.) which use
// BASE_SEND_CURRENCIES (USD/EUR/GBP) + local currencies.

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

const buildCountryCurrencyPairs = (currencies: readonly string[]) => {
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
