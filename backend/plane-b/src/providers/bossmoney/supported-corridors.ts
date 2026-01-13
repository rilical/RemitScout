export const BOSSMONEY_SOURCE_PAIRS: Array<[string, string]> = [
  ['US', 'USD'],
  ['CA', 'CAD'],
  ['AU', 'AUD'],
]

export const BOSSMONEY_DESTINATION_PAIRS: Array<[string, string]> = [
  ['GN', 'GNF'],
  ['BD', 'BDT'],
  ['BJ', 'XOF'],
  ['BO', 'BOB'],
  ['BO', 'USD'],
  ['BR', 'BRL'],
  ['BF', 'XOF'],
  ['CM', 'XAF'],
  ['CO', 'COP'],
  ['CR', 'CRC'],
  ['CR', 'USD'],
  ['CD', 'USD'],
  ['DO', 'DOP'],
  ['DO', 'USD'],
  ['EC', 'USD'],
  ['SV', 'USD'],
  ['ER', 'ERN'],
  ['ET', 'ETB'],
  ['FR', 'EUR'],
  ['DE', 'EUR'],
  ['GH', 'GHS'],
  ['GM', 'GMD'],
  ['GR', 'EUR'],
  ['GT', 'GTQ'],
  ['GT', 'USD'],
  ['HT', 'HTG'],
  ['HT', 'USD'],
  ['HN', 'HNL'],
  ['HN', 'USD'],
  ['IN', 'INR'],
  ['IE', 'EUR'],
  ['IT', 'EUR'],
  ['CI', 'XOF'],
  ['JM', 'JMD'],
  ['KE', 'KES'],
  ['LR', 'USD'],
  ['MG', 'MGA'],
  ['MW', 'MWK'],
  ['MX', 'MXN'],
  ['MZ', 'MZN'],
  ['NP', 'NPR'],
  ['NL', 'EUR'],
  ['NI', 'USD'],
  ['NG', 'NGN'],
  ['PA', 'USD'],
  ['PE', 'PEN'],
  ['PE', 'USD'],
  ['PH', 'PHP'],
  ['PK', 'PKR'],
  ['PT', 'EUR'],
  ['RW', 'RWF'],
  ['SN', 'XOF'],
  ['SL', 'SLE'],
  ['ES', 'EUR'],
  ['TG', 'XOF'],
  ['UG', 'UGX'],
  ['GB', 'GBP'],
  ['VE', 'VES'],
  ['ZW', 'USD'],
]

export const BOSSMONEY_SOURCE_COUNTRIES = Array.from(
  new Set(BOSSMONEY_SOURCE_PAIRS.map(([country]) => country)),
).sort()

export const BOSSMONEY_DESTINATION_COUNTRIES = Array.from(
  new Set(BOSSMONEY_DESTINATION_PAIRS.map(([country]) => country)),
).sort()

export const BOSSMONEY_DESTINATION_CURRENCY_OPTIONS = BOSSMONEY_DESTINATION_PAIRS
  .reduce<Record<string, string[]>>((acc, [country, currency]) => {
    if (!acc[country]) {
      acc[country] = []
    }
    if (!acc[country].includes(currency)) {
      acc[country].push(currency)
    }
    return acc
  }, {})

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()

  for (const [sourceCountry, sourceCurrency] of BOSSMONEY_SOURCE_PAIRS) {
    for (const [destCountry, destCurrency] of BOSSMONEY_DESTINATION_PAIRS) {
      if (sourceCountry === destCountry) continue
      corridorSet.add(`${sourceCountry}-${destCountry}-${sourceCurrency}-${destCurrency}`)
    }
  }

  return Array.from(corridorSet)
}

export const BOSSMONEY_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const BOSSMONEY_B2B_CORRIDORS: string[] = [...BOSSMONEY_SUPPORTED_CORRIDORS]
