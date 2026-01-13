type CurrencyOption = {
  country: string
  currency: string
}

type IntermexDestinationOption = CurrencyOption & {
  intermexCode: string
}

export const INTERMEX_SOURCE_COUNTRIES = [
  'AS',
  'VG',
  'EC',
  'SV',
  'GU',
  'MH',
  'FM',
  'PW',
  'PA',
  'PR',
  'TL',
  'TC',
  'US',
  'VI',
]

const INTERMEX_SOURCE_OPTIONS: CurrencyOption[] = INTERMEX_SOURCE_COUNTRIES.map(country => ({
  country,
  currency: 'USD',
}))

export const INTERMEX_DESTINATION_OPTIONS: IntermexDestinationOption[] = [
  { country: 'AD', currency: 'EUR', intermexCode: 'AD' },
  { country: 'AR', currency: 'ARS', intermexCode: 'AR' },
  { country: 'AR', currency: 'USD', intermexCode: 'AR' },
  { country: 'AT', currency: 'EUR', intermexCode: 'AT' },
  { country: 'BE', currency: 'EUR', intermexCode: 'BE' },
  { country: 'BG', currency: 'EUR', intermexCode: 'BG' },
  { country: 'BO', currency: 'BOB', intermexCode: 'BO' },
  { country: 'BR', currency: 'BRL', intermexCode: 'BR' },
  { country: 'CH', currency: 'EUR', intermexCode: 'CHE' },
  { country: 'CI', currency: 'XOF', intermexCode: 'CI' },
  { country: 'CL', currency: 'USD', intermexCode: 'CH' },
  { country: 'CO', currency: 'COP', intermexCode: 'CL' },
  { country: 'CR', currency: 'CRC', intermexCode: 'CR' },
  { country: 'CR', currency: 'USD', intermexCode: 'CR' },
  { country: 'CY', currency: 'EUR', intermexCode: 'CY' },
  { country: 'CZ', currency: 'EUR', intermexCode: 'CZ' },
  { country: 'DE', currency: 'EUR', intermexCode: 'DEU' },
  { country: 'DK', currency: 'EUR', intermexCode: 'DK' },
  { country: 'DO', currency: 'DOP', intermexCode: 'RP' },
  { country: 'DO', currency: 'USD', intermexCode: 'RP' },
  { country: 'EC', currency: 'USD', intermexCode: 'EC' },
  { country: 'EE', currency: 'EUR', intermexCode: 'EE' },
  { country: 'EG', currency: 'EGP', intermexCode: 'EGY' },
  { country: 'ES', currency: 'EUR', intermexCode: 'ESP' },
  { country: 'ET', currency: 'ETB', intermexCode: 'ET' },
  { country: 'FI', currency: 'EUR', intermexCode: 'FIN' },
  { country: 'FR', currency: 'EUR', intermexCode: 'FRA' },
  { country: 'GH', currency: 'GHS', intermexCode: 'GH' },
  { country: 'GR', currency: 'EUR', intermexCode: 'GRC' },
  { country: 'GT', currency: 'GTQ', intermexCode: 'GU' },
  { country: 'GT', currency: 'USD', intermexCode: 'GU' },
  { country: 'HN', currency: 'HNL', intermexCode: 'HO' },
  { country: 'HN', currency: 'USD', intermexCode: 'HO' },
  { country: 'HR', currency: 'EUR', intermexCode: 'HRV' },
  { country: 'HT', currency: 'HTG', intermexCode: 'HT' },
  { country: 'HT', currency: 'USD', intermexCode: 'HT' },
  { country: 'HU', currency: 'EUR', intermexCode: 'HU' },
  { country: 'IE', currency: 'EUR', intermexCode: 'IRL' },
  { country: 'IN', currency: 'INR', intermexCode: 'IND' },
  { country: 'IS', currency: 'EUR', intermexCode: 'ISL' },
  { country: 'IT', currency: 'EUR', intermexCode: 'IT' },
  { country: 'JM', currency: 'JMD', intermexCode: 'JA' },
  { country: 'KE', currency: 'KES', intermexCode: 'KE' },
  { country: 'LI', currency: 'EUR', intermexCode: 'LIE' },
  { country: 'LT', currency: 'EUR', intermexCode: 'LTU' },
  { country: 'LU', currency: 'EUR', intermexCode: 'LUX' },
  { country: 'LV', currency: 'EUR', intermexCode: 'LV' },
  { country: 'MC', currency: 'EUR', intermexCode: 'MCO' },
  { country: 'MT', currency: 'EUR', intermexCode: 'MLT' },
  { country: 'MX', currency: 'MXN', intermexCode: 'MX' },
  { country: 'NG', currency: 'NGN', intermexCode: 'NG' },
  { country: 'NI', currency: 'USD', intermexCode: 'NI' },
  { country: 'NL', currency: 'EUR', intermexCode: 'NLD' },
  { country: 'NO', currency: 'EUR', intermexCode: 'NOR' },
  { country: 'PA', currency: 'USD', intermexCode: 'PA' },
  { country: 'PE', currency: 'PEN', intermexCode: 'PE' },
  { country: 'PE', currency: 'USD', intermexCode: 'PE' },
  { country: 'PH', currency: 'PHP', intermexCode: 'PH' },
  { country: 'PK', currency: 'PKR', intermexCode: 'PK' },
  { country: 'PL', currency: 'PLN', intermexCode: 'PL' },
  { country: 'PT', currency: 'EUR', intermexCode: 'PRT' },
  { country: 'RO', currency: 'RON', intermexCode: 'RO' },
  { country: 'SE', currency: 'EUR', intermexCode: 'SE' },
  { country: 'SI', currency: 'EUR', intermexCode: 'SVN' },
  { country: 'SK', currency: 'EUR', intermexCode: 'SVK' },
  { country: 'SM', currency: 'EUR', intermexCode: 'SMR' },
  { country: 'SN', currency: 'XOF', intermexCode: 'SN' },
  { country: 'SV', currency: 'USD', intermexCode: 'SA' },
  { country: 'TH', currency: 'THB', intermexCode: 'TH' },
  { country: 'TR', currency: 'TRY', intermexCode: 'TUR' },
  { country: 'VA', currency: 'EUR', intermexCode: 'VAT' },
  { country: 'VN', currency: 'VND', intermexCode: 'VN' },
]

export const INTERMEX_DESTINATION_COUNTRIES = Array.from(
  new Set(INTERMEX_DESTINATION_OPTIONS.map(option => option.country)),
).sort()

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()
  for (const source of INTERMEX_SOURCE_OPTIONS) {
    for (const destination of INTERMEX_DESTINATION_OPTIONS) {
      if (source.country === destination.country) continue
      corridorSet.add(
        `${source.country}-${destination.country}-${source.currency}-${destination.currency}`,
      )
    }
  }
  return Array.from(corridorSet)
}

export const INTERMEX_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const INTERMEX_B2B_CORRIDORS = INTERMEX_SUPPORTED_CORRIDORS
