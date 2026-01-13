const ORBITREMIT_SOURCE_PAIRS: Array<[string, string]> = [
  ['AU', 'AUD'],
  ['NZ', 'NZD'],
]

const ORBITREMIT_DESTINATION_PAIRS: Array<[string, string]> = [
  ['AU', 'AUD'],
  ['BD', 'BDT'],
  ['BT', 'BTN'],
  ['BW', 'BWP'],
  ['BR', 'BRL'],
  ['CA', 'CAD'],
  ['CN', 'CNY'],
  ['CO', 'COP'],
  ['DK', 'DKK'],
  ['EG', 'EGP'],
  ['EU', 'EUR'],
  ['FJ', 'FJD'],
  ['HK', 'HKD'],
  ['IN', 'INR'],
  ['ID', 'IDR'],
  ['MY', 'MYR'],
  ['NP', 'NPR'],
  ['NZ', 'NZD'],
  ['NO', 'NOK'],
  ['PK', 'PKR'],
  ['PH', 'PHP'],
  ['PL', 'PLN'],
  ['WS', 'WST'],
  ['SG', 'SGD'],
  ['ZA', 'ZAR'],
  ['KR', 'KRW'],
  ['LK', 'LKR'],
  ['SE', 'SEK'],
  ['TH', 'THB'],
  ['TO', 'TOP'],
  ['GB', 'GBP'],
  ['US', 'USD'],
  ['VN', 'VND'],
]

export const ORBITREMIT_SOURCE_COUNTRIES = ORBITREMIT_SOURCE_PAIRS.map(([country]) => country)
export const ORBITREMIT_DESTINATION_COUNTRIES = ORBITREMIT_DESTINATION_PAIRS.map(([country]) => country)

const buildSupportedCorridors = () => {
  const corridors = new Set<string>()

  for (const [sourceCountry, sourceCurrency] of ORBITREMIT_SOURCE_PAIRS) {
    for (const [destCountry, destCurrency] of ORBITREMIT_DESTINATION_PAIRS) {
      if (sourceCountry === destCountry) continue
      corridors.add(`${sourceCountry}-${destCountry}-${sourceCurrency}-${destCurrency}`)
    }
  }

  return Array.from(corridors)
}

export const ORBITREMIT_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const ORBITREMIT_B2B_CORRIDORS: string[] = [...ORBITREMIT_SUPPORTED_CORRIDORS]
