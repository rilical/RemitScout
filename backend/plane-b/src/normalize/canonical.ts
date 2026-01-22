/**
 * Canonical payment method normalization module.
 *
 * Provides standardized payment method types and normalization functions to convert
 * provider-specific method names to canonical values. Used as a final safety check
 * in the quote normalization pipeline.
 *
 * **Two-Stage Normalization**:
 * 1. Provider parsers use code maps to convert provider codes → canonical methods
 * 2. Quote normalizer uses these functions as final validation/fallback
 */

/**
 * Canonical payin (send) methods.
 *
 * These are the standardized payment methods that customers use to send money.
 */
export const canonicalPayinMethods = [
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay',
  'cash',
  'other',
] as const

/**
 * Canonical payout (receive) methods.
 *
 * These are the standardized payment methods for recipients to receive money.
 */
export const canonicalPayoutMethods = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
  'other',
] as const

export type CanonicalPayinMethod = (typeof canonicalPayinMethods)[number]
export type CanonicalPayoutMethod = (typeof canonicalPayoutMethods)[number]

/**
 * Normalizes a string token to a standardized format.
 *
 * This function:
 * 1. Trims whitespace
 * 2. Converts to lowercase
 * 3. Replaces all separators (spaces, hyphens, dots, slashes) with underscores
 * 4. Collapses multiple underscores into one
 * 5. Removes leading/trailing underscores
 *
 * @param value - Input string to normalize
 * @returns Normalized token or empty string if invalid
 *
 * @example
 * normalizeToken("Bank Transfer") // "bank_transfer"
 * normalizeToken("bank-transfer") // "bank_transfer"
 * normalizeToken("BANK.TRANSFER") // "bank_transfer"
 * normalizeToken("bank__transfer") // "bank_transfer"
 * normalizeToken("_bank_transfer_") // "bank_transfer"
 */
const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Type guard to check if a string is a valid canonical payin method.
 *
 * @param value - String to check
 * @returns True if value is a canonical payin method
 */
const isCanonicalPayinMethod = (value: string): value is CanonicalPayinMethod => {
  return canonicalPayinMethods.includes(value as CanonicalPayinMethod)
}

/**
 * Type guard to check if a string is a valid canonical payout method.
 *
 * @param value - String to check
 * @returns True if value is a canonical payout method
 */
const isCanonicalPayoutMethod = (value: string): value is CanonicalPayoutMethod => {
  return canonicalPayoutMethods.includes(value as CanonicalPayoutMethod)
}

/**
 * Normalizes a payment method name to a canonical payin method.
 *
 * This function:
 * 1. Normalizes the input string (trim, lowercase, replace separators)
 * 2. Checks if it matches a canonical method
 * 3. Returns 'other' if no match found
 *
 * **Usage**: Used as a final safety check in quote normalization. Provider parsers
 * should use code maps for primary normalization.
 *
 * @param value - Provider-specific payment method name
 * @returns Canonical payin method or 'other' if not recognized
 *
 * @example
 * toCanonicalPayinMethod("Bank Transfer") // "bank_transfer"
 * toCanonicalPayinMethod("bank-transfer") // "bank_transfer"
 * toCanonicalPayinMethod("BANK_TRANSFER") // "bank_transfer"
 * toCanonicalPayinMethod("DebitCard") // "debitcard" → "other" (no match)
 * toCanonicalPayinMethod("debit_card") // "debit_card"
 * toCanonicalPayinMethod("unknown") // "other"
 * toCanonicalPayinMethod(null) // "other"
 */
export const toCanonicalPayinMethod = (value?: string | null): CanonicalPayinMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (isCanonicalPayinMethod(token)) {
    return token
  }
  return 'other'
}

/**
 * Normalizes a payment method name to a canonical payout method.
 *
 * This function:
 * 1. Normalizes the input string (trim, lowercase, replace separators)
 * 2. Checks if it matches a canonical method
 * 3. Returns 'other' if no match found
 *
 * **Usage**: Used as a final safety check in quote normalization. Provider parsers
 * should use code maps for primary normalization.
 *
 * @param value - Provider-specific payment method name
 * @returns Canonical payout method or 'other' if not recognized
 *
 * @example
 * toCanonicalPayoutMethod("Bank Deposit") // "bank_deposit"
 * toCanonicalPayoutMethod("bank-deposit") // "bank_deposit"
 * toCanonicalPayoutMethod("CASH_PICKUP") // "cash_pickup"
 * toCanonicalPayoutMethod("CashPickup") // "cashpickup" → "other" (no match)
 * toCanonicalPayoutMethod("cash_pickup") // "cash_pickup"
 * toCanonicalPayoutMethod("unknown") // "other"
 * toCanonicalPayoutMethod(null) // "other"
 */
export const toCanonicalPayoutMethod = (value?: string | null): CanonicalPayoutMethod => {
  if (!value) {
    return 'other'
  }
  const token = normalizeToken(value)
  if (isCanonicalPayoutMethod(token)) {
    return token
  }
  return 'other'
}

/**
 * Normalizes a country code to ISO 3166-1 alpha-2 format.
 *
 * This function:
 * 1. Trims whitespace
 * 2. Converts to uppercase
 * 3. Validates format (2 uppercase letters)
 * 4. Returns empty string if invalid
 *
 * **Note**: This function only validates format, not whether the code is a valid
 * ISO 3166-1 country code. It will accept any 2-letter string.
 *
 * @param value - Country code (e.g., "us", "US", " usa ")
 * @returns Normalized country code (2 uppercase letters) or empty string if invalid
 *
 * @example
 * normalizeCountryCode("us") // "US"
 * normalizeCountryCode("US") // "US"
 * normalizeCountryCode(" ph ") // "PH"
 * normalizeCountryCode("usa") // "" (invalid: 3 letters)
 * normalizeCountryCode("1") // "" (invalid: not letters)
 * normalizeCountryCode(null) // ""
 */
export const normalizeCountryCode = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return ''
  }
  return normalized
}

/**
 * Normalizes a currency code to ISO 4217 format.
 *
 * This function:
 * 1. Trims whitespace
 * 2. Converts to uppercase
 * 3. Validates format (3 uppercase letters)
 * 4. Returns empty string if invalid
 *
 * **Note**: This function only validates format, not whether the code is a valid
 * ISO 4217 currency code. It will accept any 3-letter string.
 *
 * @param value - Currency code (e.g., "usd", "USD", " php ")
 * @returns Normalized currency code (3 uppercase letters) or empty string if invalid
 *
 * @example
 * normalizeCurrencyCode("usd") // "USD"
 * normalizeCurrencyCode("USD") // "USD"
 * normalizeCurrencyCode(" php ") // "PHP"
 * normalizeCurrencyCode("us") // "" (invalid: 2 letters)
 * normalizeCurrencyCode("usdt") // "" (invalid: 4 letters)
 * normalizeCurrencyCode("123") // "" (invalid: not letters)
 * normalizeCurrencyCode(null) // ""
 */
export const normalizeCurrencyCode = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return ''
  }
  return normalized
}
