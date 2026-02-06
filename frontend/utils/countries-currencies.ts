import { COUNTRIES as BASE_COUNTRIES, BASE_CURRENCIES as BASE_CURRENCIES_RAW } from '../../backend/shared/countries-currencies'

export interface Country {
  name: string
  code: string
  flag: string
  currency: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  countries: string[]
}

export const BASE_CURRENCIES = [...BASE_CURRENCIES_RAW] as string[]

const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  CI: 'Côte d\'Ivoire',
  CW: 'Curaçao',
}

const flagFromCode = (code: string): string => {
  const normalized = code.toUpperCase().replace(/[^A-Z]/g, '')
  if (normalized.length !== 2) return ''
  const offset = 0x1F1E6 - 'A'.charCodeAt(0)
  return String.fromCodePoint(
    offset + normalized.charCodeAt(0),
    offset + normalized.charCodeAt(1),
  )
}

export const COUNTRIES: Country[] = BASE_COUNTRIES.map(country => ({
  ...country,
  name: COUNTRY_NAME_OVERRIDES[country.code] || country.name,
  flag: flagFromCode(country.code),
}))

export const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', countries: ['US'] },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', countries: ['DE', 'FR', 'IT', 'ES'] },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', countries: ['GB'] },
  AFN: { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', countries: ['AF'] },
  ALL: { code: 'ALL', name: 'Albanian Lek', symbol: 'L', countries: ['AL'] },
  DZD: { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', countries: ['DZ'] },
  AOA: { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', countries: ['AO'] },
  XCD: { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$', countries: ['AI', 'AG', 'DM', 'GD', 'MS', 'KN', 'LC', 'VC'] },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', countries: ['AR'] },
  AMD: { code: 'AMD', name: 'Armenian Dram', symbol: '֏', countries: ['AM'] },
  AWG: { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ', countries: ['AW'] },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', countries: ['AU'] },
  AZN: { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', countries: ['AZ'] },
  BSD: { code: 'BSD', name: 'Bahamian Dollar', symbol: '$', countries: ['BS'] },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'ب.د', countries: ['BH'] },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', countries: ['BD'] },
  BBD: { code: 'BBD', name: 'Barbadian Dollar', symbol: '$', countries: ['BB'] },
  BYN: { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', countries: ['BY'] },
  BZD: { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', countries: ['BZ'] },
  XOF: { code: 'XOF', name: 'West African CFA Franc', symbol: 'Fr', countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'] },
  BMD: { code: 'BMD', name: 'Bermudian Dollar', symbol: '$', countries: ['BM'] },
  BTN: { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', countries: ['BT'] },
  BOB: { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', countries: ['BO'] },
  BAM: { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM', countries: ['BA'] },
  BWP: { code: 'BWP', name: 'Botswanan Pula', symbol: 'P', countries: ['BW'] },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', countries: ['BR'] },
  BND: { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', countries: ['BN'] },
  BGN: { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', countries: ['BG'] },
  BIF: { code: 'BIF', name: 'Burundian Franc', symbol: 'Fr', countries: ['BI'] },
  KHR: { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', countries: ['KH'] },
  XAF: { code: 'XAF', name: 'Central African CFA Franc', symbol: 'Fr', countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'] },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', countries: ['CA'] },
  CVE: { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$', countries: ['CV'] },
  KYD: { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$', countries: ['KY'] },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$', countries: ['CL'] },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', countries: ['CN'] },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: '$', countries: ['CO'] },
  KMF: { code: 'KMF', name: 'Comorian Franc', symbol: 'Fr', countries: ['KM'] },
  CDF: { code: 'CDF', name: 'Congolese Franc', symbol: 'Fr', countries: ['CD'] },
  CRC: { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', countries: ['CR'] },
  CUP: { code: 'CUP', name: 'Cuban Peso', symbol: '$', countries: ['CU'] },
  ANG: { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ', countries: ['CW'] },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', countries: ['CZ'] },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', countries: ['DK'] },
  DJF: { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fr', countries: ['DJ'] },
  DOP: { code: 'DOP', name: 'Dominican Peso', symbol: '$', countries: ['DO'] },
  ERN: { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', countries: ['ER'] },
  SZL: { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', countries: ['SZ'] },
  ETB: { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', countries: ['ET'] },
  FJD: { code: 'FJD', name: 'Fijian Dollar', symbol: '$', countries: ['FJ'] },
  XPF: { code: 'XPF', name: 'CFP Franc', symbol: '₣', countries: ['PF', 'NC', 'WF'] },
  GMD: { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', countries: ['GM'] },
  GEL: { code: 'GEL', name: 'Georgian Lari', symbol: '₾', countries: ['GE'] },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', countries: ['GH'] },
  GIP: { code: 'GIP', name: 'Gibraltar Pound', symbol: '£', countries: ['GI'] },
  GTQ: { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', countries: ['GT'] },
  GNF: { code: 'GNF', name: 'Guinean Franc', symbol: 'Fr', countries: ['GN'] },
  GYD: { code: 'GYD', name: 'Guyanese Dollar', symbol: '$', countries: ['GY'] },
  HTG: { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', countries: ['HT'] },
  HNL: { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', countries: ['HN'] },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', countries: ['HK'] },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', countries: ['HU'] },
  ISK: { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', countries: ['IS'] },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', countries: ['IN'] },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', countries: ['ID'] },
  IRR: { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', countries: ['IR'] },
  IQD: { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', countries: ['IQ'] },
  ILS: { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', countries: ['IL'] },
  JMD: { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', countries: ['JM'] },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', countries: ['JP'] },
  JOD: { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', countries: ['JO'] },
  KZT: { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', countries: ['KZ'] },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', countries: ['KE'] },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', countries: ['KW'] },
  KGS: { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', countries: ['KG'] },
  LAK: { code: 'LAK', name: 'Lao Kip', symbol: '₭', countries: ['LA'] },
  LBP: { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', countries: ['LB'] },
  LSL: { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', countries: ['LS'] },
  LRD: { code: 'LRD', name: 'Liberian Dollar', symbol: '$', countries: ['LR'] },
  LYD: { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', countries: ['LY'] },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', countries: ['CH', 'LI'] },
  MOP: { code: 'MOP', name: 'Macanese Pataca', symbol: 'P', countries: ['MO'] },
  MGA: { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', countries: ['MG'] },
  MWK: { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', countries: ['MW'] },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', countries: ['MY'] },
  MVR: { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', countries: ['MV'] },
  MRU: { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM', countries: ['MR'] },
  MUR: { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', countries: ['MU'] },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', countries: ['MX'] },
  MDL: { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', countries: ['MD'] },
  MNT: { code: 'MNT', name: 'Mongolian Tögrög', symbol: '₮', countries: ['MN'] },
  MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', countries: ['MA'] },
  MZN: { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', countries: ['MZ'] },
  MMK: { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', countries: ['MM'] },
  NAD: { code: 'NAD', name: 'Namibian Dollar', symbol: '$', countries: ['NA'] },
  NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', countries: ['NP'] },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', countries: ['NZ'] },
  NIO: { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', countries: ['NI'] },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', countries: ['NG'] },
  MKD: { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', countries: ['MK'] },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', countries: ['NO'] },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', countries: ['OM'] },
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', countries: ['PK'] },
  PGK: { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', countries: ['PG'] },
  PYG: { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', countries: ['PY'] },
  PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', countries: ['PE'] },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', countries: ['PH'] },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', countries: ['PL'] },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', countries: ['QA'] },
  RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', countries: ['RO'] },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', countries: ['RU'] },
  RWF: { code: 'RWF', name: 'Rwandan Franc', symbol: 'Fr', countries: ['RW'] },
  WST: { code: 'WST', name: 'Samoan Tālā', symbol: 'T', countries: ['WS'] },
  STN: { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', countries: ['ST'] },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', countries: ['SA'] },
  SBD: { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', countries: ['SB'] },
  RSD: { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.', countries: ['RS'] },
  SCR: { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', countries: ['SC'] },
  SLE: { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', countries: ['SL'] },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', countries: ['SG'] },
  SOS: { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', countries: ['SO'] },
  SSP: { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', countries: ['SS'] },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', countries: ['ZA'] },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', countries: ['KR'] },
  LKR: { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', countries: ['LK'] },
  SDG: { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', countries: ['SD'] },
  SRD: { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', countries: ['SR'] },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', countries: ['SE'] },
  SYP: { code: 'SYP', name: 'Syrian Pound', symbol: '£', countries: ['SY'] },
  TWD: { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', countries: ['TW'] },
  TJS: { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'ЅМ', countries: ['TJ'] },
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'Sh', countries: ['TZ'] },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', countries: ['TH'] },
  TOP: { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', countries: ['TO'] },
  TTD: { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$', countries: ['TT'] },
  TND: { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', countries: ['TN'] },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', countries: ['TR'] },
  TMT: { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', countries: ['TM'] },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', countries: ['UG'] },
  UAH: { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', countries: ['UA'] },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', countries: ['AE'] },
  UYU: { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', countries: ['UY'] },
  UZS: { code: 'UZS', name: 'Uzbekistani Som', symbol: 'so\'m', countries: ['UZ'] },
  VUV: { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'Vt', countries: ['VU'] },
  VES: { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S', countries: ['VE'] },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', countries: ['VN'] },
  YER: { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', countries: ['YE'] },
  ZMW: { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', countries: ['ZM'] },
  ZWL: { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$', countries: ['ZW'] },
}

// Helper to get country by code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}

// Helper to get currency info
export function getCurrencyInfo(code: string): Currency | undefined {
  return CURRENCIES[code]
}

// Helper to get available currencies for a country
// Always includes USD, GBP, EUR plus the country's native currency
export function getAvailableCurrencies(countryCode: string): string[] {
  const country = getCountryByCode(countryCode)
  if (!country) return BASE_CURRENCIES

  const currencies = new Set([...BASE_CURRENCIES, country.currency])
  return Array.from(currencies)
}

// Get currency display name
export function getCurrencyDisplay(code: string): string {
  const currency = CURRENCIES[code]
  if (!currency) return code

  return `${code} | ${currency.name}`
}

// Get country display name
export function getCountryDisplay(code: string): string {
  const country = getCountryByCode(code)
  if (!country) return code

  return `${country.flag} ${country.name}`
}
