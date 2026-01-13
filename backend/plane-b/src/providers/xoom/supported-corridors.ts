import { COUNTRIES } from '../../../../shared/countries-currencies'

export const XOOM_SOURCE_CURRENCIES = ['USD', 'AUD', 'CAD', 'EUR', 'GBP'] as const

const DESTINATION_COUNTRY_NAMES = [
  'Mexico',
  'Philippines',
  'India',
  'United States',
  'Algeria',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahrain',
  'Bangladesh',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Costa Rica',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Eritrea',
  'Estonia',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'French Guiana',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'Indonesia',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Liberia',
  'Lithuania',
  'Luxembourg',
  'Macedonia',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Mali',
  'Malta',
  'Martinique',
  'Mauritius',
  'Mayotte',
  'Moldova',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'Norway',
  'Oman',
  'Pakistan',
  'Panama',
  'Paraguay',
  'Peru',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Reunion',
  'Romania',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'Uruguay',
  'US Virgin Islands',
  'Uzbekistan',
  'Vietnam',
  'Zambia',
  'Zimbabwe',
]

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'Ivory Coast': "Cote d'Ivoire",
  'Macedonia': 'North Macedonia',
  'Democratic Republic of the Congo': 'Congo (DRC)',
}

const DEFAULT_COUNTRY_BY_CURRENCY: Record<string, string> = {
  USD: 'US',
  EUR: 'DE',
  GBP: 'GB',
  AUD: 'AU',
  CAD: 'CA',
}

const normalizeName = (value: string) => value.trim().toLowerCase()

const buildCountryNameIndex = () => {
  const map = new Map<string, { code: string; currency: string }>()
  for (const country of COUNTRIES) {
    map.set(normalizeName(country.name), { code: country.code, currency: country.currency })
  }
  return map
}

const countryByName = buildCountryNameIndex()
const currencyByCountry = new Map(COUNTRIES.map(country => [country.code, country.currency]))

const resolveCountry = (name: string) => {
  const alias = COUNTRY_NAME_ALIASES[name] ?? name
  return countryByName.get(normalizeName(alias)) ?? null
}

const buildDestinationCountries = () => {
  const codes = new Set<string>()
  for (const name of DESTINATION_COUNTRY_NAMES) {
    const resolved = resolveCountry(name)
    if (!resolved) continue
    codes.add(resolved.code)
  }
  return Array.from(codes)
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

const DESTINATION_COUNTRY_CODES = buildDestinationCountries()
const FROM_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs([...XOOM_SOURCE_CURRENCIES])
const TO_COUNTRIES_WITH_CURRENCIES = DESTINATION_COUNTRY_CODES
  .map((code) => {
    const currency = currencyByCountry.get(code)
    if (!currency) return null
    return [code, currency] as [string, string]
  })
  .filter((pair): pair is [string, string] => Boolean(pair))

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

export const XOOM_DESTINATION_COUNTRIES = DESTINATION_COUNTRY_CODES
export const XOOM_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const XOOM_B2B_CORRIDORS: string[] = [...XOOM_SUPPORTED_CORRIDORS]
