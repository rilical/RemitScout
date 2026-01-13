import { remitbeeCountryByIso2 } from './code-map'

const normalizeIso2 = (value: string) => value.trim().toUpperCase()

export const REMITBEE_SOURCE_COUNTRIES = ['CA']

export const REMITBEE_DESTINATION_CURRENCY_OPTIONS: Record<string, string[]> = {
  IN: ['INR'],
  PH: ['PHP'],
  LK: ['LKR'],
  AR: ['ARS'],
  BJ: ['XOF'],
  BW: ['BWP'],
  CM: ['XAF'],
  CL: ['CLP'],
  CO: ['COP'],
  CR: ['CRC', 'USD'],
  CI: ['XOF'],
  DO: ['DOP', 'USD'],
  EC: ['USD'],
  SV: ['USD'],
  GH: ['GHS'],
  GT: ['GTQ', 'USD'],
  HT: ['USD'],
  HN: ['HNL', 'USD'],
  ID: ['IDR'],
  JM: ['JMD', 'USD'],
  JO: ['JOD'],
  KE: ['KES'],
  PE: ['PEN', 'USD'],
  RO: ['RON'],
  SN: ['XOF'],
  KR: ['KRW'],
  TG: ['XOF'],
  UG: ['UGX'],
  UA: ['UAH', 'USD'],
  UY: ['USD', 'UYU'],
  ZM: ['ZMW'],
}

export const REMITBEE_DESTINATION_COUNTRIES = Object.keys(REMITBEE_DESTINATION_CURRENCY_OPTIONS)
  .map(normalizeIso2)
  .filter((value) => value !== 'CA' && remitbeeCountryByIso2.has(value))
  .sort()

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()
  for (const destination of REMITBEE_DESTINATION_COUNTRIES) {
    if (!remitbeeCountryByIso2.has(destination)) continue
    const currencies = REMITBEE_DESTINATION_CURRENCY_OPTIONS[destination] ?? []
    for (const currency of currencies) {
      corridorSet.add(`CA-${destination}-CAD-${currency}`)
    }
  }
  return Array.from(corridorSet)
}

export const REMITBEE_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const REMITBEE_B2B_CORRIDORS = REMITBEE_SUPPORTED_CORRIDORS
