/**
 * Quote normalization module.
 *
 * Normalizes provider-specific parsed quotes into a standardized format for storage
 * and analysis. This module is the final stage of the data pipeline before persistence.
 *
 * **Normalization Steps**:
 * 1. Converts payin/payout methods to canonical values
 * 2. Computes amount buckets for categorization
 * 3. Derives method profile (standard_bank, standard_card, cash_pickup)
 * 4. Merges parser quality flags with normalization flags
 * 5. Calculates derived fields (implied FX rate, total debit)
 * 6. Validates and normalizes all fields
 */

import { computeBucketSelection } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { createLogger } from '../../../shared/logger'
import {
  CanonicalPayinMethod,
  CanonicalPayoutMethod,
  toCanonicalPayinMethod,
  toCanonicalPayoutMethod,
} from './canonical'
import { deriveMethodProfile, MethodProfile } from './method-profile'
import { qualityFlags, QualityFlag } from './quality-flags'

const logger = createLogger('plane-b.normalize.quote-normalizer')

/**
 * Input for quote normalization.
 *
 * This type represents a parsed quote from a provider parser before normalization.
 */
export type NormalizeQuoteInput = {
  provider_id: string
  corridor_id: string
  send_amount: number
  fee_amount: number
  fee_currency?: string | null
  total_debit_amount?: number | null
  receive_amount: number
  payin_method?: string | null
  payout_method?: string | null
  promotional_fee_amount?: number | null
  delivery_time_min_minutes?: number | null
  delivery_time_max_minutes?: number | null
  promotional_rate?: number | null
  base_rate?: number | null
  promotional_cap_amount?: number | null
  collected_at: string | Date
  ingestion_run_id: string
  bronze_object_key: string
  parser_version?: string | null
  parse_flags?: QualityFlag[]
}

/**
 * Normalized quote output.
 *
 * This type represents a fully normalized quote ready for persistence to the database.
 */
export type NormalizedQuote = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  bucket_used: number
  fee_bucket_used: number
  approximate: boolean
  payin: CanonicalPayinMethod
  payout: CanonicalPayoutMethod
  send_amount: number
  fee_amount: number
  fee_currency?: string | null
  total_debit_amount: number
  receive_amount: number
  implied_fx_rate: number
  promotional_fee_amount: number | null
  delivery_time_min_minutes?: number | null
  delivery_time_max_minutes?: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  collected_at: string
  ingested_at: string
  ingestion_run_id: string
  bronze_object_key: string
  parser_version?: string | null
  quality_flags: QualityFlag[]
  method_profile: MethodProfile | null
}

/**
 * Checks if a value is a finite number.
 */
const isFiniteNumber = (value: number): boolean => Number.isFinite(value)

/**
 * Checks if a value is a non-empty string.
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.+-Ee]/g, '').trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Normalizes and validates the collected_at timestamp.
 *
 * Handles both Date objects and ISO date strings. Logs warning and uses
 * fallback if the date is invalid.
 *
 * @param value - Date object or ISO string
 * @param fallback - Fallback ISO string if invalid
 * @returns Normalized ISO date string
 */
const normalizeCollectedAt = (value: string | Date, fallback: string): string => {
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (!Number.isFinite(date.getTime())) {
      throw new Error('Invalid date')
    }
    return date.toISOString()
  } catch (error) {
    logger.warn('invalid_collected_at_date', {
      value: String(value),
      error: error instanceof Error ? error.message : String(error),
    })
    return fallback
  }
}

/**
 * Calculates the total debit amount.
 *
 * Uses the following priority:
 * 1. Explicit total_debit_amount (if provided and valid)
 * 2. Calculated from send_amount + fee (uses promotional fee if available)
 * 3. Falls back to 0 if insufficient data
 *
 * @param totalDebitAmount - Explicit total debit amount
 * @param sendAmount - Send amount
 * @param feeAmount - Fee amount
 * @param promotionalFeeAmount - Promotional fee amount (if applicable)
 * @returns Total debit amount
 */
const calculateTotalDebit = (
  totalDebitAmount: number | null | undefined,
  sendAmount: number,
  feeAmount: number,
  promotionalFeeAmount: number | null,
): number => {
  if (Number.isFinite(totalDebitAmount ?? Number.NaN)) {
    return Number(totalDebitAmount)
  }
  if (isFiniteNumber(sendAmount) && isFiniteNumber(feeAmount)) {
    return sendAmount + (promotionalFeeAmount ?? feeAmount)
  }
  return 0
}

/**
 * Validates input for required fields and corridor ID format.
 *
 * Adds quality flags for validation failures.
 *
 * @param input - Quote input to validate
 * @param flags - Quality flags set (modified in-place)
 */
const validateInput = (input: NormalizeQuoteInput, flags: Set<QualityFlag>): void => {
  const hasRequiredFields = isNonEmptyString(input.provider_id)
    && isNonEmptyString(input.corridor_id)
    && isNonEmptyString(input.bronze_object_key)
    && isNonEmptyString(input.ingestion_run_id)

  if (!hasRequiredFields) {
    flags.add(qualityFlags.partial_data)
  }

  if (!isNonEmptyString(input.corridor_id) || !parseCorridorId(input.corridor_id)) {
    flags.add(qualityFlags.parse_error)
  }
}

/**
 * Normalizes a provider-specific parsed quote into a standardized format.
 *
 * This function is the final stage of the data pipeline before persistence. It:
 * 1. Merges parser quality flags with normalization flags (deduplicates automatically)
 * 2. Validates required fields and corridor ID format
 * 3. Converts payin/payout methods to canonical values
 * 4. Computes amount buckets for categorization
 * 5. Derives method profile (bank_to_bank, card_to_bank, bank_to_cash, card_to_cash, bank_to_wallet, card_to_wallet)
 * 6. Calculates derived fields (implied FX rate, total debit)
 * 7. Normalizes dates with error handling
 *
 * **Quality Flags**:
 * - Parser flags (from `input.parse_flags`) are merged with normalization flags
 * - Flags are automatically deduplicated using Set
 * - Common flags: `parse_error`, `unknown_method`, `bucket_approx`, `invalid_method_profile`, `partial_data`
 *
 * **Error Handling**:
 * - Invalid dates fall back to current time and set `parse_error` flag
 * - Invalid corridor IDs set `parse_error` flag
 * - Missing required fields set `partial_data` flag
 * - Invalid send/receive amounts set `parse_error` flag
 *
 * @param input - Provider-specific parsed quote
 * @param input.parse_flags - Quality flags from parser (optional, merged with normalization flags)
 * @returns Normalized quote in standard format
 *
 * @example
 * const normalized = normalizeQuote({
 *   provider_id: 'remitly',
 *   corridor_id: 'US-PH-USD-PHP',
 *   send_amount: 1000,
 *   fee_amount: 5,
 *   receive_amount: 56000,
 *   payin_method: 'bank_transfer',
 *   payout_method: 'bank_deposit',
 *   collected_at: new Date(),
 *   ingestion_run_id: 'run-123',
 *   bronze_object_key: 'bronze/remitly/...',
 *   parse_flags: ['partial_data'], // Merged with normalization flags
 * })
 */
export const normalizeQuote = (input: NormalizeQuoteInput): NormalizedQuote => {
  const flags = new Set<QualityFlag>(input.parse_flags ?? [])
  validateInput(input, flags)

  const sendAmountParsed = parseNumeric(input.send_amount)
  let feeAmountParsed = parseNumeric(input.fee_amount)
  const receiveAmountParsed = parseNumeric(input.receive_amount)
  const totalDebitParsed = parseNumeric(input.total_debit_amount ?? null)
  const deliveryTimeMinParsed = parseNumeric(input.delivery_time_min_minutes ?? null)
  const deliveryTimeMaxParsed = parseNumeric(input.delivery_time_max_minutes ?? null)

  if (feeAmountParsed === null && totalDebitParsed !== null && sendAmountParsed !== null) {
    const derivedFee = totalDebitParsed - sendAmountParsed
    if (Number.isFinite(derivedFee)) {
      feeAmountParsed = Math.max(derivedFee, 0)
    }
  }

  if (sendAmountParsed === null || receiveAmountParsed === null) {
    flags.add(qualityFlags.parse_error)
  }
  if (feeAmountParsed === null && totalDebitParsed === null) {
    flags.add(qualityFlags.partial_data)
  }

  const sendAmount = sendAmountParsed ?? 0
  const feeAmount = feeAmountParsed ?? 0
  const receiveAmount = receiveAmountParsed ?? 0
  const deliveryTimeMinMinutes = deliveryTimeMinParsed !== null ? Math.round(deliveryTimeMinParsed) : null
  const deliveryTimeMaxMinutes = deliveryTimeMaxParsed !== null ? Math.round(deliveryTimeMaxParsed) : null

  const payin = toCanonicalPayinMethod(input.payin_method)
  const payout = toCanonicalPayoutMethod(input.payout_method)

  if (payin === 'other' || payout === 'other') {
    flags.add(qualityFlags.unknown_method)
  }

  const bucketSelection = computeBucketSelection(sendAmount)
  if (bucketSelection.approximate) {
    flags.add(qualityFlags.bucket_approx)
  }

  const promotionalRate = parseNumeric(input.promotional_rate ?? null)
  const promotionalFeeAmount = parseNumeric(input.promotional_fee_amount ?? null)
  const baseRate = parseNumeric(input.base_rate ?? null)
  const promotionalCapAmount = parseNumeric(input.promotional_cap_amount ?? null)
  const totalDebit = calculateTotalDebit(
    totalDebitParsed,
    sendAmount,
    feeAmount,
    promotionalFeeAmount,
  )

  // Calculate implied FX rate, prioritizing promotional_rate when available
  // Promotional rate is the actual rate offered and should be used for accurate comparisons
  let impliedFxRate = 0
  if (isFiniteNumber(promotionalRate) && promotionalRate > 0) {
    // Use promotional rate directly when available (most accurate)
    impliedFxRate = promotionalRate
  } else if (isFiniteNumber(baseRate) && baseRate > 0) {
    // Fallback to base rate if promotional rate not available
    impliedFxRate = baseRate
  } else if (isFiniteNumber(sendAmount) && sendAmount > 0 && isFiniteNumber(receiveAmount)) {
    // Last resort: calculate from receive_amount / send_amount
    // This accounts for fees already applied in receive_amount
    impliedFxRate = receiveAmount / sendAmount
  }

  const ingestedAt = new Date().toISOString()
  const collectedAt = normalizeCollectedAt(input.collected_at, ingestedAt)

  const methodProfile = deriveMethodProfile(payin, payout)
  if (methodProfile === null) {
    flags.add(qualityFlags.invalid_method_profile)
  }

  const hasRequiredFields = isNonEmptyString(input.provider_id)
    && isNonEmptyString(input.corridor_id)
    && isNonEmptyString(input.bronze_object_key)
    && isNonEmptyString(input.ingestion_run_id)
  const hasCoreAmounts = sendAmountParsed !== null && receiveAmountParsed !== null
  const hasCost = feeAmountParsed !== null || totalDebitParsed !== null
  const hasMethods = payin !== 'other' && payout !== 'other'

  if (hasRequiredFields && hasCoreAmounts && hasCost && hasMethods && methodProfile !== null) {
    flags.delete(qualityFlags.partial_data)
  }

  return {
    provider_id: input.provider_id,
    corridor_id: input.corridor_id,
    amount_bucket: bucketSelection.bucket_used,
    bucket_used: bucketSelection.bucket_used,
    fee_bucket_used: bucketSelection.fee_bucket_used,
    approximate: bucketSelection.approximate,
    payin,
    payout,
    send_amount: sendAmount,
    fee_amount: feeAmount,
    fee_currency: input.fee_currency ?? null,
    total_debit_amount: totalDebit,
    receive_amount: receiveAmount,
    implied_fx_rate: impliedFxRate,
    promotional_fee_amount: promotionalFeeAmount,
    delivery_time_min_minutes: deliveryTimeMinMinutes,
    delivery_time_max_minutes: deliveryTimeMaxMinutes,
    promotional_rate: promotionalRate,
    base_rate: baseRate,
    promotional_cap_amount: promotionalCapAmount,
    collected_at: collectedAt,
    ingested_at: ingestedAt,
    ingestion_run_id: input.ingestion_run_id,
    bronze_object_key: input.bronze_object_key,
    parser_version: input.parser_version ?? null,
    quality_flags: Array.from(flags),
    method_profile: methodProfile,
  }
}
