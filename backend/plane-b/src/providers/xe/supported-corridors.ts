import {
  XE_COMMON_SOURCE_CURRENCIES,
  XE_COUNTRY_TO_CURRENCY,
  getSourceCountryForCurrency,
  getXeCurrencyForCountry,
  isXeCorridorSupported,
} from './code-map'

const DESTINATION_COUNTRIES = Object.keys(XE_COUNTRY_TO_CURRENCY)

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()
  for (const sourceCurrency of XE_COMMON_SOURCE_CURRENCIES) {
    const sourceCountry = getSourceCountryForCurrency(sourceCurrency)
    if (!sourceCountry) continue
    for (const destination of DESTINATION_COUNTRIES) {
      if (sourceCountry === destination) continue
      if (!isXeCorridorSupported(sourceCurrency, destination)) continue
      const destinationCurrency = getXeCurrencyForCountry(destination)
      if (!destinationCurrency) continue
      corridorSet.add(
        `${sourceCountry}-${destination}-${sourceCurrency}-${destinationCurrency}`,
      )
    }
  }
  return Array.from(corridorSet)
}

export const XE_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const XE_B2B_CORRIDORS: string[] = [...XE_SUPPORTED_CORRIDORS]
