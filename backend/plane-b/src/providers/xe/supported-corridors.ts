import { COUNTRIES } from '../../../../shared/countries-currencies'
import { getXeCurrencyForCountry } from './code-map'

const buildCorridors = () => {
  const corridors = new Set<string>()
  const countryCodes = COUNTRIES.map((country) => country.code)
  for (const sourceCountry of countryCodes) {
    const sourceCurrency = getXeCurrencyForCountry(sourceCountry)
    if (!sourceCurrency) continue
    for (const destCountry of countryCodes) {
      if (sourceCountry === destCountry) continue
      const destCurrency = getXeCurrencyForCountry(destCountry)
      if (!destCurrency) continue
      corridors.add(`${sourceCountry}-${destCountry}-${sourceCurrency}-${destCurrency}`)
    }
  }
  return Array.from(corridors)
}

export const XE_SUPPORTED_CORRIDORS = buildCorridors()
export const XE_B2B_CORRIDORS = [...XE_SUPPORTED_CORRIDORS]
