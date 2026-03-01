/**
 * Quality flags for quote data quality tracking.
 *
 * Quality flags mark various issues with quote data, from parse errors to business rule
 * violations. They are stored as a JSON array in `silver.quote_record.quality_flags`.
 *
 * **Flag Categories**:
 * - **Parse Errors**: Issues during data parsing
 * - **Data Quality**: Issues with data completeness or accuracy
 * - **Business Rules**: Violations of business logic or constraints
 * - **Method Issues**: Problems with payment method combinations
 */

/**
 * Quality flag constants.
 *
 * Each flag represents a specific data quality issue that can be tracked and analyzed.
 */
export const qualityFlags = {
  /**
   * Parse Errors
   */

  /** Failed to parse provider response or extract required fields */
  parse_error: 'parse_error',

  /**
   * Data Quality Issues
   */

  /** Quote data is incomplete (missing optional fields) */
  partial_data: 'partial_data',

  /** Amount bucket is approximate (not exact match) */
  bucket_approx: 'bucket_approx',

  /** Input amount bucket doesn't match computed bucket */
  amount_bucket_mismatch: 'amount_bucket_mismatch',

  /**
   * Business Rule Violations
   */

  /** Provider or corridor is blocked (rate limit, HTTP 403, etc.) */
  blocked: 'blocked',

  /** Quote is stale (older than freshness threshold) */
  stale: 'stale',

  /** Delivery time is estimated from method profile defaults */
  estimated_delivery: 'estimated_delivery',

  /** Send amount is below provider's minimum send amount */
  min_send_violation: 'min_send_violation',

  /**
   * Method Issues
   */

  /** Payin or payout method could not be mapped to canonical value */
  unknown_method: 'unknown_method',

  /** Corridor is not supported by provider */
  unsupported_corridor: 'unsupported_corridor',

  /** Method profile could not be derived from payin/payout combination */
  invalid_method_profile: 'invalid_method_profile',

  /**
   * Fee Issues
   */

  /** Derived fee was negative (total_debit < send_amount) */
  negative_fee: 'negative_fee',
} as const

/**
 * TypeScript type for quality flags.
 *
 * Derived from the qualityFlags constant to ensure type safety.
 */
export type QualityFlag = (typeof qualityFlags)[keyof typeof qualityFlags]

/**
 * Type guard to check if a string is a valid quality flag.
 *
 * Validates that the value is one of the defined quality flag constants.
 *
 * @param value - String to check
 * @returns True if value is a valid quality flag
 *
 * @example
 * isQualityFlag('parse_error') // true
 * isQualityFlag('blocked') // true
 * isQualityFlag('invalid') // false
 * isQualityFlag('') // false
 */
export const isQualityFlag = (value: unknown): value is QualityFlag => {
  return typeof value === 'string' && Object.values(qualityFlags).includes(value as QualityFlag)
}

/**
 * Validates an array of quality flags.
 *
 * Checks that all values in the array are valid quality flags.
 *
 * @param values - Array to validate
 * @returns True if all values are valid quality flags
 *
 * @example
 * areValidQualityFlags(['parse_error', 'blocked']) // true
 * areValidQualityFlags(['parse_error', 'invalid']) // false
 * areValidQualityFlags([]) // true
 */
export const areValidQualityFlags = (values: unknown[]): values is QualityFlag[] => {
  return Array.isArray(values) && values.every(isQualityFlag)
}
