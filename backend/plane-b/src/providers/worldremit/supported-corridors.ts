import { COUNTRIES } from '../../../../shared/countries-currencies'

const COUNTRY_PAIRS = COUNTRIES.map((country) => [country.code, country.currency] as const)

const buildSupportedCorridors = (): string[] => {
  const corridors: string[] = []

  for (const [fromCountry, fromCurrency] of COUNTRY_PAIRS) {
    if (!fromCurrency) continue
    for (const [toCountry, toCurrency] of COUNTRY_PAIRS) {
      if (fromCountry === toCountry || !toCurrency) continue
      corridors.push(`${fromCountry}-${toCountry}-${fromCurrency}-${toCurrency}`)
    }
  }

  return corridors
}

export const WORLDREMIT_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const WORLDREMIT_B2B_CORRIDORS = [...WORLDREMIT_SUPPORTED_CORRIDORS]
