import { COUNTRIES } from '../../../../shared/countries-currencies'

const PANGEA_DESTINATION_PAIRS: Array<[string, string]> = [
  ['MX', 'MXN'],
  ['PH', 'PHP'],
  ['GT', 'GTQ'],
  ['HN', 'HNL'],
  ['CO', 'COP'],
  ['SV', 'USD'],
  ['BD', 'BDT'],
  ['BF', 'XOF'],
  ['CI', 'XOF'],
  ['DO', 'DOP'],
  ['FR', 'EUR'],
  ['DE', 'EUR'],
  ['GH', 'GHS'],
  ['IN', 'INR'],
  ['ID', 'IDR'],
  ['IT', 'EUR'],
  ['KE', 'KES'],
  ['MY', 'MYR'],
  ['NP', 'NPR'],
  ['SN', 'XOF'],
  ['SG', 'SGD'],
  ['TH', 'THB'],
  ['UG', 'UGX'],
  ['VN', 'VND'],
]

export const PANGEA_DESTINATION_COUNTRIES = Array.from(
  new Set(PANGEA_DESTINATION_PAIRS.map(([country]) => country)),
)

const USD_SOURCE_COUNTRIES = COUNTRIES
  .filter(country => country.currency === 'USD')
  .map(country => country.code)

export const PANGEA_SOURCE_COUNTRIES = Array.from(new Set(USD_SOURCE_COUNTRIES)).sort()

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()

  for (const source of PANGEA_SOURCE_COUNTRIES) {
    for (const [destCountry, destCurrency] of PANGEA_DESTINATION_PAIRS) {
      if (source === destCountry) continue
      corridorSet.add(`${source}-${destCountry}-USD-${destCurrency}`)
    }
  }

  return Array.from(corridorSet)
}

export const PANGEA_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const PANGEA_B2B_CORRIDORS: string[] = [...PANGEA_SUPPORTED_CORRIDORS]
