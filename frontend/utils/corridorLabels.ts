import { getCountryByCode } from './countries-currencies'

export type ParsedCorridorId = {
  corridorId: string
  sourceCountryCode: string
  destCountryCode: string
  sourceCurrencyCode: string
  destCurrencyCode: string
}

const normalizePart = (value: string | undefined): string => (value || '').trim().toUpperCase()

const resolveCountryName = (code: string): string => {
  if (!code) return ''
  return getCountryByCode(code)?.name || code
}

export const parseCorridorId = (corridorId: string): ParsedCorridorId => {
  const parts = corridorId.split('-').map(part => normalizePart(part))
  return {
    corridorId,
    sourceCountryCode: parts[0] || '',
    destCountryCode: parts[1] || '',
    sourceCurrencyCode: parts[2] || '',
    destCurrencyCode: parts[3] || '',
  }
}

export const formatCorridorCountryPair = (
  corridorId: string,
  separator = ' -> ',
): string => {
  const parsed = parseCorridorId(corridorId)
  const source = resolveCountryName(parsed.sourceCountryCode)
  const destination = resolveCountryName(parsed.destCountryCode)

  if (source && destination) {
    return `${source}${separator}${destination}`
  }

  return corridorId
}

export const formatCorridorCountryCodePair = (
  corridorId: string,
  separator = ' -> ',
): string => {
  const parsed = parseCorridorId(corridorId)
  if (parsed.sourceCountryCode && parsed.destCountryCode) {
    return `${parsed.sourceCountryCode}${separator}${parsed.destCountryCode}`
  }
  return corridorId
}

export const formatCorridorCurrencyPair = (
  corridorId: string,
  separator = ' / ',
): string => {
  const parsed = parseCorridorId(corridorId)
  if (parsed.sourceCurrencyCode && parsed.destCurrencyCode) {
    return `${parsed.sourceCurrencyCode}${separator}${parsed.destCurrencyCode}`
  }
  return corridorId
}

export const toCountryPairId = (corridorId: string): string => {
  const parsed = parseCorridorId(corridorId)
  if (parsed.sourceCountryCode && parsed.destCountryCode) {
    return `${parsed.sourceCountryCode}-${parsed.destCountryCode}`
  }
  return corridorId.trim().toUpperCase()
}

export const buildCorridorSearchText = (corridorId: string): string => {
  const parsed = parseCorridorId(corridorId)
  return [
    corridorId,
    parsed.sourceCountryCode,
    parsed.destCountryCode,
    parsed.sourceCurrencyCode,
    parsed.destCurrencyCode,
    resolveCountryName(parsed.sourceCountryCode),
    resolveCountryName(parsed.destCountryCode),
    formatCorridorCountryPair(corridorId, ' '),
    formatCorridorCountryCodePair(corridorId, ' '),
    formatCorridorCurrencyPair(corridorId, ' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
