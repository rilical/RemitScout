export const countryCodeMap: Record<string, string> = {
  AT: 'AUT',
  BE: 'BEL',
  BG: 'BGR',
  CY: 'CYP',
  CZ: 'CZE',
  DE: 'DEU',
  DK: 'DNK',
  EE: 'EST',
  ES: 'ESP',
  FI: 'FIN',
  FR: 'FRA',
  GB: 'GBR',
  GR: 'GRC',
  HR: 'HRV',
  HU: 'HUN',
  IE: 'IRL',
  IS: 'ISL',
  IT: 'ITA',
  LI: 'LIE',
  LT: 'LTU',
  LU: 'LUX',
  LV: 'LVA',
  MT: 'MLT',
  NL: 'NLD',
  NO: 'NOR',
  PL: 'POL',
  PT: 'PRT',
  RO: 'ROU',
  RU: 'RUS',
  SE: 'SWE',
  SI: 'SVN',
  SK: 'SVK',
  AE: 'ARE',
  AM: 'ARM',
  AZ: 'AZE',
  BD: 'BGD',
  BH: 'BHR',
  BR: 'BRA',
  BY: 'BLR',
  CN: 'CHN',
  DZ: 'DZA',
  EC: 'ECU',
  GE: 'GEO',
  HK: 'HKG',
  ID: 'IDN',
  IL: 'ISR',
  IN: 'IND',
  KG: 'KGZ',
  KR: 'KOR',
  KZ: 'KAZ',
  MA: 'MAR',
  MN: 'MNG',
  MX: 'MEX',
  MY: 'MYS',
  OM: 'OMN',
  PH: 'PHL',
  QA: 'QAT',
  RS: 'SRB',
  SG: 'SGP',
  TH: 'THA',
  TJ: 'TJK',
  TN: 'TUN',
  TR: 'TUR',
  UZ: 'UZB',
  VN: 'VNM',
}

export const currencyCodeMap: Record<string, string> = {
  AED: '784',
  AMD: '051',
  AZN: '944',
  BDT: '050',
  BGN: '975',
  BHD: '048',
  BRL: '986',
  BYN: '933',
  CHF: '756',
  CNY: '156',
  CZK: '203',
  DKK: '208',
  DZD: '012',
  EUR: '978',
  GBP: '826',
  GEL: '981',
  HKD: '344',
  HUF: '348',
  IDR: '360',
  ILS: '376',
  INR: '356',
  ISK: '352',
  KGS: '417',
  KRW: '410',
  KZT: '398',
  MAD: '504',
  MNT: '496',
  MXN: '484',
  MYR: '458',
  NOK: '578',
  OMR: '512',
  PHP: '608',
  PLN: '985',
  QAR: '634',
  RON: '946',
  RSD: '941',
  RUB: '643',
  SEK: '752',
  SGD: '702',
  THB: '764',
  TJS: '972',
  TND: '788',
  TRY: '949',
  USD: '840',
  UZS: '860',
  VND: '704',
}

export const currencyMinorUnits: Record<string, number> = {
  AED: 2,
  AMD: 2,
  AZN: 2,
  BDT: 2,
  BGN: 2,
  BHD: 3,
  BRL: 2,
  BYN: 2,
  CHF: 2,
  CNY: 2,
  CZK: 2,
  DKK: 2,
  DZD: 2,
  EUR: 2,
  GBP: 2,
  GEL: 2,
  HKD: 2,
  HUF: 2,
  IDR: 2,
  ILS: 2,
  INR: 2,
  ISK: 0,
  KGS: 2,
  KRW: 0,
  KZT: 2,
  MAD: 2,
  MNT: 2,
  MXN: 2,
  MYR: 2,
  NOK: 2,
  OMR: 3,
  PHP: 2,
  PLN: 2,
  QAR: 2,
  RON: 2,
  RSD: 2,
  RUB: 2,
  SEK: 2,
  SGD: 2,
  THB: 2,
  TJS: 2,
  TND: 3,
  TRY: 2,
  USD: 2,
  UZS: 2,
  VND: 0,
}

const normalizeToken = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .trim()
  .toLowerCase()
  .replace(/[\s./-]+/g, '_')

const PAYIN_TO_CANONICAL: Record<string, string> = {
  debitCard: 'debit_card',
  creditCard: 'credit_card',
  debit_card: 'debit_card',
  credit_card: 'credit_card',
  card: 'debit_card',
}

const PAYOUT_TO_CANONICAL: Record<string, string> = {
  cash: 'cash_pickup',
  card: 'bank_deposit',
  account: 'bank_deposit',
  bank: 'bank_deposit',
  iban: 'bank_deposit',
  accountViaHizlipara: 'bank_deposit',
  wallet: 'mobile_wallet',
}

const buildMethodMap = (mapping: Record<string, string>) => {
  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(mapping)) {
    entries.push([key, value])
    entries.push([normalizeToken(key), value])
  }
  return Object.fromEntries(entries)
}

export const payinMethodMap: Record<string, string> = buildMethodMap(PAYIN_TO_CANONICAL)
export const payoutMethodMap: Record<string, string> = buildMethodMap(PAYOUT_TO_CANONICAL)

const CANONICAL_PAYIN_TO_KORONA: Record<string, string> = {
  debit_card: 'debitCard',
  credit_card: 'creditCard',
  bank_transfer: 'debitCard',
  apple_pay: 'debitCard',
  google_pay: 'debitCard',
  cash: 'debitCard',
}

const CANONICAL_PAYOUT_TO_KORONA: Record<string, string> = {
  bank_deposit: 'card',
  cash_pickup: 'cash',
  mobile_wallet: 'card',
  airtime: 'cash',
}

export const getPaymentMethodForPayin = (payinMethod?: string | null) => {
  if (!payinMethod) return CANONICAL_PAYIN_TO_KORONA.debit_card
  return CANONICAL_PAYIN_TO_KORONA[payinMethod] ?? CANONICAL_PAYIN_TO_KORONA.debit_card
}

export const getReceivingMethodForPayout = (payoutMethod?: string | null) => {
  if (!payoutMethod) return CANONICAL_PAYOUT_TO_KORONA.bank_deposit
  return CANONICAL_PAYOUT_TO_KORONA[payoutMethod] ?? CANONICAL_PAYOUT_TO_KORONA.bank_deposit
}
