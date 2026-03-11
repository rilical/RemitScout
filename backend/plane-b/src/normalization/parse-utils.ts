/**
 * Shared numeric parsing utilities for the normalization pipeline.
 *
 * These functions are used by both the factor extractors (fee, rate, delivery-time,
 * promotional) and the quote-normalizer to ensure consistent parsing behavior
 * across the entire normalization pipeline.
 *
 * **Consistency invariant**: A raw value that parses successfully in an extractor
 * must also parse to the same numeric result in the normalizer, and vice versa.
 *
 * Addresses findings H28/H29: parseAmount/parseRate inconsistency across extractors
 * and the normalizer.
 */

/**
 * Upper bound for parsed numeric values. Values beyond this magnitude are
 * treated as garbage / overflow and rejected.
 */
export const MAX_NUMERIC_VALUE = 1e12

/**
 * Strict pattern for validating cleaned numeric strings. Rejects strings that
 * contain embedded alphabetic characters (e.g. "abc123" -> null).
 */
const STRICT_NUMERIC_PATTERN = /^[-+]?(?:\d+\.?\d*|\.\d+)$/

/**
 * Parses an unknown value into a finite number, or returns null.
 *
 * String inputs are cleaned of whitespace, thousands separators, underscores,
 * and common currency symbols before validation against a strict numeric pattern.
 * This prevents accidentally extracting numbers from garbled or non-numeric text
 * (e.g. "abc123" -> null, not 123).
 *
 * @param value - The value to parse (number, string, null, undefined, or other)
 * @returns The parsed finite number, or null if parsing fails or value is out of bounds
 */
export const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  let result: number | null = null
  if (typeof value === 'number') {
    result = Number.isFinite(value) ? value : null
  } else if (typeof value === 'string') {
    const cleaned = value
      .trim()
      .replace(/[\s,_]/g, '')
      .replace(/[$€£¥]/g, '')
    if (!cleaned || !STRICT_NUMERIC_PATTERN.test(cleaned)) return null
    const parsed = Number(cleaned)
    result = Number.isFinite(parsed) ? parsed : null
  } else {
    const parsed = Number(value)
    result = Number.isFinite(parsed) ? parsed : null
  }
  if (result !== null && (result > MAX_NUMERIC_VALUE || result < -MAX_NUMERIC_VALUE)) {
    return null
  }
  return result
}

/**
 * Parses an unknown value into a finite positive number (for exchange rates).
 *
 * Delegates to {@link parseNumeric} and additionally rejects zero and negative
 * values, since exchange rates must be positive.
 *
 * @param value - The value to parse
 * @returns The parsed positive number, or null
 */
export const parseRate = (value: unknown): number | null => {
  const num = parseNumeric(value)
  return num !== null && num > 0 ? num : null
}

/**
 * Parses an unknown value into a finite non-negative number (for fee amounts).
 *
 * Delegates to {@link parseNumeric}. Unlike parseRate, this allows zero (free
 * transfers) but returns the raw result including negatives so the caller can
 * decide how to handle negative fees (e.g. log a warning, set a quality flag).
 *
 * @param value - The value to parse
 * @returns The parsed finite number, or null
 */
export const parseAmount = (value: unknown): number | null => {
  return parseNumeric(value)
}
