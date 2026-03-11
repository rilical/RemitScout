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

import { computeBucketSelection, normalizeAmountBucket } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { createLogger } from '../../../shared/logger'
import {
  CanonicalPayinMethod,
  CanonicalPayoutMethod,
  toCanonicalPayinMethod,
  toCanonicalPayoutMethod,
} from '../../../shared/normalize/canonical'
import { deriveMethodProfile, MethodProfile } from './method-profile'
import { qualityFlags, QualityFlag } from './quality-flags'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { parseNumeric } from '../normalization/parse-utils'

const logger = createLogger('plane-b.normalize.quote-normalizer')

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (): Record<string, string> => ({
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  service: 'remit-scout',
})

/**
 * Input for quote normalization.
 *
 * This type represents a parsed quote from a provider parser before normalization.
 */
export type NormalizeQuoteInput = {
  provider_id: string
  corridor_id: string
  amount_bucket?: number
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
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * Checks if a value is a non-empty string.
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

// parseNumeric is imported from ../normalization/parse-utils to ensure consistent
// parsing behavior between extractors and the normalizer (H28/H29 fix).

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
  feeAmount: number | null,
  promotionalFeeAmount: number | null,
): number => {
  if (Number.isFinite(totalDebitAmount ?? Number.NaN)) {
    return Number(totalDebitAmount)
  }
  if (isFiniteNumber(sendAmount) && isFiniteNumber(feeAmount)) {
    return sendAmount + feeAmount
  }
  if (isFiniteNumber(sendAmount) && isFiniteNumber(promotionalFeeAmount)) {
    return sendAmount + promotionalFeeAmount
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
 * @returns Normalized quote in standard format, or null if the quote is invalid
 *   (e.g., zero or negative send_amount)
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
export const normalizeQuote = (input: NormalizeQuoteInput): NormalizedQuote | null => {
  const flags = new Set<QualityFlag>(input.parse_flags ?? [])
  validateInput(input, flags)

  const sendAmountParsed = parseNumeric(input.send_amount)

  // Reject quotes with zero or negative send_amount to prevent division-by-zero
  // downstream (e.g., rate = receive_amount / send_amount)
  if (sendAmountParsed === null || sendAmountParsed <= 0) {
    logger.warn('invalid_send_amount_rejected', {
      provider_id: input.provider_id,
      corridor_id: input.corridor_id,
      send_amount: input.send_amount,
      ingestion_run_id: input.ingestion_run_id,
    })
    return null
  }

  let feeAmountParsed = parseNumeric(input.fee_amount)
  const receiveAmountParsed = parseNumeric(input.receive_amount)
  const totalDebitParsed = parseNumeric(input.total_debit_amount ?? null)
  const deliveryTimeMinParsed = parseNumeric(input.delivery_time_min_minutes ?? null)
  const deliveryTimeMaxParsed = parseNumeric(input.delivery_time_max_minutes ?? null)

  if (feeAmountParsed === null && totalDebitParsed !== null && sendAmountParsed !== null) {
    const derivedFee = totalDebitParsed - sendAmountParsed
    if (Number.isFinite(derivedFee)) {
      if (derivedFee < 0) {
        flags.add(qualityFlags.negative_fee)
      }
      feeAmountParsed = derivedFee
    }
  }

  if (receiveAmountParsed === null) {
    flags.add(qualityFlags.parse_error)
  }
  if (feeAmountParsed === null && totalDebitParsed === null) {
    flags.add(qualityFlags.partial_data)
  }

  const sendAmount = sendAmountParsed
  const feeAmount = feeAmountParsed ?? 0
  const receiveAmount = receiveAmountParsed ?? 0
  let deliveryTimeMinMinutes = deliveryTimeMinParsed !== null ? Math.round(deliveryTimeMinParsed) : null
  let deliveryTimeMaxMinutes = deliveryTimeMaxParsed !== null ? Math.round(deliveryTimeMaxParsed) : null

  const payin = toCanonicalPayinMethod(input.payin_method)
  const payout = toCanonicalPayoutMethod(input.payout_method)

  if (payin === 'other' || payout === 'other') {
    flags.add(qualityFlags.unknown_method)
  }

  const hasBucketHint = isFiniteNumber(input.amount_bucket) && input.amount_bucket > 0
  const bucketBase = hasBucketHint ? input.amount_bucket! : sendAmount
  const bucketSelection = computeBucketSelection(bucketBase)
  const bucketApprox = hasBucketHint && isFiniteNumber(sendAmountParsed)
    ? Math.round(sendAmountParsed) !== Math.round(input.amount_bucket as number)
    : bucketSelection.approximate
  const approximate = bucketApprox

  if (approximate) {
    flags.add(qualityFlags.bucket_approx)
  }

  const normalizedBucket = normalizeAmountBucket(sendAmount, 500)
  if (hasBucketHint && normalizedBucket !== Math.round(input.amount_bucket!)) {
    flags.add(qualityFlags.amount_bucket_mismatch)
    logger.warn('amount_bucket_mismatch', {
      corridor_id: input.corridor_id,
      input_bucket: input.amount_bucket,
      computed_bucket: normalizedBucket,
    })
  }

  const promotionalRate = parseNumeric(input.promotional_rate ?? null)
  const promotionalFeeAmount = parseNumeric(input.promotional_fee_amount ?? null)
  const baseRate = parseNumeric(input.base_rate ?? null)
  const promotionalCapAmount = parseNumeric(input.promotional_cap_amount ?? null)
  const totalDebit = calculateTotalDebit(
    totalDebitParsed,
    sendAmount,
    feeAmountParsed,
    promotionalFeeAmount,
  )

  const derivedRate = isFiniteNumber(sendAmount) && sendAmount > 0 && isFiniteNumber(receiveAmount)
    ? receiveAmount / sendAmount
    : null
  const rateMatchesDerived = (rate: number | null) => {
    if (!isFiniteNumber(rate) || rate <= 0 || derivedRate === null || derivedRate <= 0) return false
    const tolerance = Math.max(1e-6, Math.abs(derivedRate) * 0.002)
    return Math.abs(rate - derivedRate) <= tolerance
  }

  // Executability check (IA1): flag promotional teasers that diverge from derived rate
  const PROMOTIONAL_DIVERGENCE_THRESHOLD = 0.02 // 2%
  if (promotionalRate !== null && derivedRate !== null && derivedRate > 0) {
    const divergence = Math.abs(promotionalRate - derivedRate) / derivedRate
    if (divergence > PROMOTIONAL_DIVERGENCE_THRESHOLD) {
      flags.add(qualityFlags.promotional_teaser)
    }
  }

  // Prefer the rate that matches the actual receive amount when available.
  let impliedFxRate = 0
  if (derivedRate !== null && derivedRate > 0) {
    if (isFiniteNumber(promotionalRate) && rateMatchesDerived(promotionalRate)) {
      impliedFxRate = promotionalRate
    } else if (isFiniteNumber(baseRate) && rateMatchesDerived(baseRate)) {
      impliedFxRate = baseRate
    } else {
      impliedFxRate = derivedRate
    }
  } else if (isFiniteNumber(promotionalRate) && promotionalRate > 0) {
    impliedFxRate = promotionalRate
  } else if (isFiniteNumber(baseRate) && baseRate > 0) {
    impliedFxRate = baseRate
  }

  const ingestedAt = new Date().toISOString()
  const collectedAt = normalizeCollectedAt(input.collected_at, ingestedAt)

  const methodProfile = deriveMethodProfile(payin, payout)
  if (methodProfile === null) {
    flags.add(qualityFlags.invalid_method_profile)
  }

  if (deliveryTimeMinMinutes === null && deliveryTimeMaxMinutes === null) {
    if (methodProfile === 'standard_bank') {
      deliveryTimeMinMinutes = 24 * 60
      deliveryTimeMaxMinutes = 72 * 60
    } else if (methodProfile === 'standard_card') {
      deliveryTimeMinMinutes = 60
      deliveryTimeMaxMinutes = 24 * 60
    } else if (methodProfile === 'cash_pickup') {
      deliveryTimeMinMinutes = 30
      deliveryTimeMaxMinutes = 6 * 60
    } else if (payout === 'mobile_wallet') {
      deliveryTimeMinMinutes = 5
      deliveryTimeMaxMinutes = 2 * 60
    } else if (payout === 'airtime') {
      deliveryTimeMinMinutes = 5
      deliveryTimeMaxMinutes = 60
    }

    if (deliveryTimeMinMinutes !== null && deliveryTimeMaxMinutes !== null) {
      flags.add(qualityFlags.estimated_delivery)
    }
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

  recordCloudWatchMetric({
    name: 'normalization_success_total',
    value: 1,
    unit: 'Count',
    namespace: AGENT_METRIC_NAMESPACE,
    dimensions: agentMetricDimensions(),
  })
  for (const flag of flags) {
    recordCloudWatchMetric({
      name: 'normalization_quality_flag_total',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: { ...agentMetricDimensions(), flag_type: flag },
    })
  }

  return {
    provider_id: input.provider_id,
    corridor_id: input.corridor_id,
    amount_bucket: bucketSelection.bucket_used,
    bucket_used: bucketSelection.bucket_used,
    fee_bucket_used: bucketSelection.fee_bucket_used,
    approximate,
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
