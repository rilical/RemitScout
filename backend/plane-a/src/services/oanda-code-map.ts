import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.oanda-code-map')

const COUNTRY_ALIASES: Record<string, string> = {
  UK: 'GB',
  EL: 'GR',
}

const CURRENCY_ALIASES: Record<string, string> = {
  RMB: 'CNY',
  UKP: 'GBP',
}

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/
const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/

export const mapCountryToOanda = (countryCode?: string | null): string | null => {
  if (!countryCode) return null
  const normalized = countryCode.trim().toUpperCase()
  if (COUNTRY_ALIASES[normalized]) return COUNTRY_ALIASES[normalized]
  if (!COUNTRY_CODE_REGEX.test(normalized)) {
    logger.warn('oanda_country_code_invalid', { country_code: normalized })
    return null
  }
  return normalized
}

export const normalizeOandaCurrency = (currencyCode?: string | null): string | null => {
  if (!currencyCode) return null
  const normalized = currencyCode.trim().toUpperCase()
  const mapped = CURRENCY_ALIASES[normalized] ?? normalized
  if (!CURRENCY_CODE_REGEX.test(mapped)) {
    logger.warn('oanda_currency_code_invalid', { currency_code: currencyCode })
    return null
  }
  return mapped
}

export const validateOandaCurrency = (currencyCode?: string | null): boolean => {
  return Boolean(normalizeOandaCurrency(currencyCode))
}

export const mapOandaCurrencyPair = (
  baseCurrency?: string | null,
  quoteCurrency?: string | null,
): { base: string | null; quote: string | null } => {
  return {
    base: normalizeOandaCurrency(baseCurrency),
    quote: normalizeOandaCurrency(quoteCurrency),
  }
}
