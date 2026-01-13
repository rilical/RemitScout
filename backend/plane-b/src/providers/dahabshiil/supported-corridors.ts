import { COUNTRIES } from '../../../../shared/countries-currencies'

export const DAHABSHIIL_SOURCE_COUNTRIES = [
  'GB',
  'HR',
  'GR',
  'AT',
  'BG',
  'FI',
  'ES',
  'BE',
  'NL',
  'DE',
  'NO',
  'DK',
  'SE',
  'IT',
  'IE',
  'FR',
  'CH',
  'PT',
  'CA',
] as const

const DAHABSHIIL_DESTINATION_COUNTRIES = [
  'SO',
  'KE',
  'AU',
  'BH',
  'CA',
  'DJ',
  'EG',
  'ER',
  'FI',
  'FR',
  'IE',
  'IT',
  'KW',
  'MY',
  'MR',
  'NP',
  'NZ',
  'QA',
  'RW',
  'SA',
  'SS',
  'SD',
  'SE',
  'TR',
  'AE',
  'UG',
  'GB',
  'YE',
  'CD',
  'NL',
  'BI',
  'GM',
  'MA',
] as const

const DAHABSHIIL_DESTINATION_OVERRIDES: Array<[string, string]> = [
  ['KE', 'USD'],
  ['SO', 'USD'],
  ['SD', 'USD'],
  ['DJ', 'USD'],
  ['UG', 'USD'],
]

const currencyByCountry = new Map(COUNTRIES.map(country => [country.code, country.currency]))

const buildDestinationPairs = (): Array<[string, string]> => {
  const pairs = new Map<string, [string, string]>()
  for (const country of DAHABSHIIL_DESTINATION_COUNTRIES) {
    const currency = currencyByCountry.get(country)
    if (!currency) continue
    pairs.set(`${country}:${currency}`, [country, currency])
  }
  for (const [country, currency] of DAHABSHIIL_DESTINATION_OVERRIDES) {
    pairs.set(`${country}:${currency}`, [country, currency])
  }
  return Array.from(pairs.values())
}

const DAHABSHIIL_DESTINATION_PAIRS = buildDestinationPairs()

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()

  for (const source of DAHABSHIIL_SOURCE_COUNTRIES) {
    const sourceCurrency = currencyByCountry.get(source)
    if (!sourceCurrency) continue

    for (const [destCountry, destCurrency] of DAHABSHIIL_DESTINATION_PAIRS) {
      if (source === destCountry) continue
      corridorSet.add(`${source}-${destCountry}-${sourceCurrency}-${destCurrency}`)
    }
  }

  return Array.from(corridorSet)
}

export const DAHABSHIIL_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const DAHABSHIIL_B2B_CORRIDORS: string[] = [...DAHABSHIIL_SUPPORTED_CORRIDORS]
