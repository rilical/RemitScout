type CurrencyOption = {
  country: string
  currency: string
}

const WIREBARLEY_SOURCE_OPTIONS: CurrencyOption[] = [
  { country: 'KR', currency: 'KRW' },
]

const WIREBARLEY_DESTINATION_OPTIONS: CurrencyOption[] = [
  { country: 'AT', currency: 'EUR' },
  { country: 'AU', currency: 'AUD' },
  { country: 'BD', currency: 'BDT' },
  { country: 'BE', currency: 'EUR' },
  { country: 'BG', currency: 'EUR' },
  { country: 'CA', currency: 'CAD' },
  { country: 'CN', currency: 'CNY' },
  { country: 'CY', currency: 'EUR' },
  { country: 'CZ', currency: 'EUR' },
  { country: 'DE', currency: 'EUR' },
  { country: 'DK', currency: 'EUR' },
  { country: 'EE', currency: 'EUR' },
  { country: 'ES', currency: 'EUR' },
  { country: 'FI', currency: 'EUR' },
  { country: 'FR', currency: 'EUR' },
  { country: 'GB', currency: 'GBP' },
  { country: 'GR', currency: 'EUR' },
  { country: 'HK', currency: 'CNY' },
  { country: 'HK', currency: 'HKD' },
  { country: 'HR', currency: 'EUR' },
  { country: 'HU', currency: 'EUR' },
  { country: 'ID', currency: 'IDR' },
  { country: 'IE', currency: 'EUR' },
  { country: 'IN', currency: 'INR' },
  { country: 'IT', currency: 'EUR' },
  { country: 'JP', currency: 'JPY' },
  { country: 'KH', currency: 'USD' },
  { country: 'LT', currency: 'EUR' },
  { country: 'LU', currency: 'EUR' },
  { country: 'LV', currency: 'EUR' },
  { country: 'MY', currency: 'MYR' },
  { country: 'NL', currency: 'EUR' },
  { country: 'NP', currency: 'NPR' },
  { country: 'NZ', currency: 'NZD' },
  { country: 'PH', currency: 'PHP' },
  { country: 'PH', currency: 'USD' },
  { country: 'PL', currency: 'EUR' },
  { country: 'PT', currency: 'EUR' },
  { country: 'RO', currency: 'EUR' },
  { country: 'SE', currency: 'EUR' },
  { country: 'SG', currency: 'SGD' },
  { country: 'SI', currency: 'EUR' },
  { country: 'SK', currency: 'EUR' },
  { country: 'TH', currency: 'THB' },
  { country: 'US', currency: 'USD' },
  { country: 'UZ', currency: 'USD' },
  { country: 'UZ', currency: 'UZS' },
  { country: 'VN', currency: 'USD' },
  { country: 'VN', currency: 'VND' },
]

export const WIREBARLEY_SOURCE_COUNTRIES = ['KR']

export const WIREBARLEY_DESTINATION_COUNTRIES = [
  'AT',
  'AU',
  'BD',
  'BE',
  'BG',
  'CA',
  'CN',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HK',
  'HR',
  'HU',
  'ID',
  'IE',
  'IN',
  'IT',
  'JP',
  'KH',
  'LT',
  'LU',
  'LV',
  'MY',
  'NL',
  'NP',
  'NZ',
  'PH',
  'PL',
  'PT',
  'RO',
  'SE',
  'SG',
  'SI',
  'SK',
  'TH',
  'US',
  'UZ',
  'VN',
]

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()
  for (const source of WIREBARLEY_SOURCE_OPTIONS) {
    for (const destination of WIREBARLEY_DESTINATION_OPTIONS) {
      if (source.country === destination.country) continue
      corridorSet.add(
        `${source.country}-${destination.country}-${source.currency}-${destination.currency}`,
      )
    }
  }
  return Array.from(corridorSet)
}

export const WIREBARLEY_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const WIREBARLEY_B2B_CORRIDORS = WIREBARLEY_SUPPORTED_CORRIDORS
