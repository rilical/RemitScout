const normalizeCurrency = (value: string) => value.trim().toUpperCase()

export const SINGX_SOURCE_CURRENCIES = ['SGD', 'USD'] as const

export const SINGX_SOURCE_COUNTRY_BY_CURRENCY: Record<string, string> = {
  SGD: 'SG',
  USD: 'US',
}

export const SINGX_DESTINATION_CURRENCIES_BY_SOURCE: Record<string, string[]> = {
  SGD: [
    'PLN',
    'PKR',
    'UGX',
    'RWF',
    'BDT',
    'GBP',
    'BHD',
    'USD',
    'XAF',
    'EUR',
    'LKR',
    'DKK',
    'THB',
    'SEK',
    'ETB',
    'EGP',
    'MMK',
    'NPR',
    'NOK',
    'CHF',
    'ZMW',
    'IDR',
    'ZAR',
    'VND',
    'CAD',
    'KRW',
    'HKD',
    'TRY',
    'CZK',
    'AED',
    'NGN',
    'KES',
    'CNY',
    'SGD',
    'AUD',
    'MYR',
    'SLE',
    'SAR',
    'NZD',
    'KWD',
    'XOF',
    'JPY',
    'PHP',
    'MWK',
    'OMR',
    'QAR',
    'TWD',
    'HUF',
    'ILS',
    'INR',
    'RON',
  ],
  USD: [
    'PLN',
    'PKR',
    'UGX',
    'BDT',
    'GBP',
    'BHD',
    'USD',
    'XAF',
    'LKR',
    'EUR',
    'DKK',
    'THB',
    'SEK',
    'ETB',
    'EGP',
    'MMK',
    'NPR',
    'NOK',
    'CHF',
    'IDR',
    'ZAR',
    'VND',
    'CAD',
    'KRW',
    'HKD',
    'TRY',
    'CZK',
    'AED',
    'NGN',
    'KES',
    'CNY',
    'SGD',
    'AUD',
    'MYR',
    'SLE',
    'SAR',
    'NZD',
    'KWD',
    'XOF',
    'JPY',
    'PHP',
    'MWK',
    'OMR',
    'QAR',
    'TWD',
    'HUF',
    'ILS',
    'INR',
    'RON',
  ],
}

export const SINGX_DESTINATION_COUNTRY_BY_CURRENCY: Record<string, string> = {
  PLN: 'PL',
  PKR: 'PK',
  UGX: 'UG',
  RWF: 'RW',
  BDT: 'BD',
  GBP: 'GB',
  BHD: 'BH',
  USD: 'US',
  XAF: 'CM',
  EUR: 'DE',
  LKR: 'LK',
  DKK: 'DK',
  THB: 'TH',
  SEK: 'SE',
  ETB: 'ET',
  EGP: 'EG',
  MMK: 'MM',
  NPR: 'NP',
  NOK: 'NO',
  CHF: 'CH',
  ZMW: 'ZM',
  IDR: 'ID',
  ZAR: 'ZA',
  VND: 'VN',
  CAD: 'CA',
  KRW: 'KR',
  HKD: 'HK',
  TRY: 'TR',
  CZK: 'CZ',
  AED: 'AE',
  NGN: 'NG',
  KES: 'KE',
  CNY: 'CN',
  SGD: 'SG',
  AUD: 'AU',
  MYR: 'MY',
  SLE: 'SL',
  SAR: 'SA',
  NZD: 'NZ',
  KWD: 'KW',
  XOF: 'SN',
  JPY: 'JP',
  PHP: 'PH',
  MWK: 'MW',
  OMR: 'OM',
  QAR: 'QA',
  TWD: 'TW',
  HUF: 'HU',
  ILS: 'IL',
  INR: 'IN',
  RON: 'RO',
}

const buildDestinationCurrencySet = () => {
  const currencies = new Set<string>()
  for (const list of Object.values(SINGX_DESTINATION_CURRENCIES_BY_SOURCE)) {
    for (const currency of list) {
      currencies.add(normalizeCurrency(currency))
    }
  }
  return currencies
}

const buildDestinationCountries = () => {
  const countries = new Set<string>()
  for (const currency of buildDestinationCurrencySet()) {
    const country = SINGX_DESTINATION_COUNTRY_BY_CURRENCY[currency]
    if (country) countries.add(country)
  }
  return Array.from(countries).sort()
}

export const SINGX_SOURCE_COUNTRIES = Object.values(SINGX_SOURCE_COUNTRY_BY_CURRENCY)
  .map((value) => value.trim().toUpperCase())
  .filter((value) => value.length === 2)

export const SINGX_DESTINATION_COUNTRIES = buildDestinationCountries()

const buildSupportedCorridors = () => {
  const corridors = new Set<string>()

  for (const [sourceCurrency, destinations] of Object.entries(
    SINGX_DESTINATION_CURRENCIES_BY_SOURCE,
  )) {
    const normalizedSourceCurrency = normalizeCurrency(sourceCurrency)
    const sourceCountry = SINGX_SOURCE_COUNTRY_BY_CURRENCY[normalizedSourceCurrency]
    if (!sourceCountry) continue

    for (const destinationCurrency of destinations) {
      const normalizedDestCurrency = normalizeCurrency(destinationCurrency)
      const destCountry = SINGX_DESTINATION_COUNTRY_BY_CURRENCY[normalizedDestCurrency]
      if (!destCountry) continue
      if (destCountry === sourceCountry) continue
      corridors.add(
        `${sourceCountry}-${destCountry}-${normalizedSourceCurrency}-${normalizedDestCurrency}`,
      )
    }
  }

  return Array.from(corridors)
}

export const SINGX_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const SINGX_B2B_CORRIDORS = SINGX_SUPPORTED_CORRIDORS
