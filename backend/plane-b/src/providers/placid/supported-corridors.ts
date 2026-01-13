import { COUNTRIES } from '../../../../shared/countries-currencies'

const normalizeCountry = (value: string) => value.trim().toUpperCase()

export const PLACID_SOURCE_CURRENCIES = ['USD'] as const

export type PlacidDestination = {
  placidCode: string
  country: string
  currency: string
  name: string
}

export const PLACID_DESTINATIONS: PlacidDestination[] = [
  { placidCode: 'BAN', country: 'BD', currency: 'BDT', name: 'Bangladesh' },
  { placidCode: 'GHA', country: 'GH', currency: 'GHS', name: 'Ghana' },
  { placidCode: 'IND', country: 'IN', currency: 'INR', name: 'India' },
  { placidCode: 'KEN', country: 'KE', currency: 'KES', name: 'Kenya' },
  { placidCode: 'NEP', country: 'NP', currency: 'NPR', name: 'Nepal' },
  { placidCode: 'PAK', country: 'PK', currency: 'PKR', name: 'Pakistan' },
  { placidCode: 'PHX', country: 'PH', currency: 'PHP', name: 'Philippines' },
  { placidCode: 'SEN', country: 'SN', currency: 'XOF', name: 'Senegal' },
  { placidCode: 'SLK', country: 'LK', currency: 'LKR', name: 'Sri Lanka' },
  { placidCode: 'THA', country: 'TH', currency: 'THB', name: 'Thailand' },
  { placidCode: 'VNM', country: 'VN', currency: 'VND', name: 'Vietnam' },
]

export const PLACID_DESTINATION_COUNTRIES = PLACID_DESTINATIONS
  .map((entry) => entry.country)
  .sort()

export const PLACID_DESTINATION_CURRENCIES = PLACID_DESTINATIONS
  .map((entry) => entry.currency)
  .sort()

export const PLACID_CODE_BY_COUNTRY: Record<string, string> = Object.fromEntries(
  PLACID_DESTINATIONS.map((entry) => [entry.country, entry.placidCode]),
)

export const PLACID_DESTINATION_BY_COUNTRY: Record<string, PlacidDestination> =
  Object.fromEntries(PLACID_DESTINATIONS.map((entry) => [entry.country, entry]))

export const PLACID_DESTINATION_BY_CODE: Record<string, PlacidDestination> = Object.fromEntries(
  PLACID_DESTINATIONS.map((entry) => [entry.placidCode, entry]),
)

export const PLACID_DESTINATION_COUNTRY_BY_CURRENCY: Record<string, string> = Object.fromEntries(
  PLACID_DESTINATIONS.map((entry) => [entry.currency, entry.country]),
)

export const PLACID_DESTINATION_CURRENCY_BY_COUNTRY: Record<string, string> = Object.fromEntries(
  PLACID_DESTINATIONS.map((entry) => [entry.country, entry.currency]),
)

const buildSourceCountries = () => {
  const countries = new Set<string>()
  for (const entry of COUNTRIES) {
    const code = normalizeCountry(entry.code)
    if (code.length === 2) {
      countries.add(code)
    }
  }
  return Array.from(countries).sort()
}

export const PLACID_SOURCE_COUNTRIES = buildSourceCountries()

const buildSupportedCorridors = () => {
  const corridors = new Set<string>()
  const sourceCurrency = PLACID_SOURCE_CURRENCIES[0]

  for (const sourceCountry of PLACID_SOURCE_COUNTRIES) {
    for (const destination of PLACID_DESTINATIONS) {
      if (sourceCountry === destination.country) continue
      corridors.add(
        `${sourceCountry}-${destination.country}-${sourceCurrency}-${destination.currency}`,
      )
    }
  }

  return Array.from(corridors)
}

export const PLACID_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const PLACID_B2B_CORRIDORS = PLACID_SUPPORTED_CORRIDORS
