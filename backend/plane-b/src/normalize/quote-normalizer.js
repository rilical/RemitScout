"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeQuote = void 0;
const amount_bucket_1 = require("../../../shared/amount-bucket");
const corridor_1 = require("../../../shared/corridor");
const logger_1 = require("../../../shared/logger");
const canonical_1 = require("../../../shared/normalize/canonical");
const method_profile_1 = require("./method-profile");
const quality_flags_1 = require("./quality-flags");
const logger = (0, logger_1.createLogger)('plane-b.normalize.quote-normalizer');
/**
 * Checks if a value is a finite number.
 */
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
/**
 * Checks if a value is a non-empty string.
 */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const parseNumeric = (value) => {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.+-Ee]/g, '').trim();
        if (!cleaned)
            return null;
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
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
const normalizeCollectedAt = (value, fallback) => {
    try {
        const date = value instanceof Date ? value : new Date(value);
        if (!Number.isFinite(date.getTime())) {
            throw new Error('Invalid date');
        }
        return date.toISOString();
    }
    catch (error) {
        logger.warn('invalid_collected_at_date', {
            value: String(value),
            error: error instanceof Error ? error.message : String(error),
        });
        return fallback;
    }
};
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
const calculateTotalDebit = (totalDebitAmount, sendAmount, feeAmount, promotionalFeeAmount) => {
    if (Number.isFinite(totalDebitAmount ?? Number.NaN)) {
        return Number(totalDebitAmount);
    }
    if (isFiniteNumber(sendAmount) && isFiniteNumber(feeAmount)) {
        return sendAmount + (promotionalFeeAmount ?? feeAmount);
    }
    return 0;
};
/**
 * Validates input for required fields and corridor ID format.
 *
 * Adds quality flags for validation failures.
 *
 * @param input - Quote input to validate
 * @param flags - Quality flags set (modified in-place)
 */
const validateInput = (input, flags) => {
    const hasRequiredFields = isNonEmptyString(input.provider_id)
        && isNonEmptyString(input.corridor_id)
        && isNonEmptyString(input.bronze_object_key)
        && isNonEmptyString(input.ingestion_run_id);
    if (!hasRequiredFields) {
        flags.add(quality_flags_1.qualityFlags.partial_data);
    }
    if (!isNonEmptyString(input.corridor_id) || !(0, corridor_1.parseCorridorId)(input.corridor_id)) {
        flags.add(quality_flags_1.qualityFlags.parse_error);
    }
};
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
const normalizeQuote = (input) => {
    const flags = new Set(input.parse_flags ?? []);
    validateInput(input, flags);
    const sendAmountParsed = parseNumeric(input.send_amount);
    let feeAmountParsed = parseNumeric(input.fee_amount);
    const receiveAmountParsed = parseNumeric(input.receive_amount);
    const totalDebitParsed = parseNumeric(input.total_debit_amount ?? null);
    const deliveryTimeMinParsed = parseNumeric(input.delivery_time_min_minutes ?? null);
    const deliveryTimeMaxParsed = parseNumeric(input.delivery_time_max_minutes ?? null);
    if (feeAmountParsed === null && totalDebitParsed !== null && sendAmountParsed !== null) {
        const derivedFee = totalDebitParsed - sendAmountParsed;
        if (Number.isFinite(derivedFee)) {
            feeAmountParsed = Math.max(derivedFee, 0);
        }
    }
    if (sendAmountParsed === null || receiveAmountParsed === null) {
        flags.add(quality_flags_1.qualityFlags.parse_error);
    }
    if (feeAmountParsed === null && totalDebitParsed === null) {
        flags.add(quality_flags_1.qualityFlags.partial_data);
    }
    const sendAmount = sendAmountParsed ?? 0;
    const feeAmount = feeAmountParsed ?? 0;
    const receiveAmount = receiveAmountParsed ?? 0;
    let deliveryTimeMinMinutes = deliveryTimeMinParsed !== null ? Math.round(deliveryTimeMinParsed) : null;
    let deliveryTimeMaxMinutes = deliveryTimeMaxParsed !== null ? Math.round(deliveryTimeMaxParsed) : null;
    const payin = (0, canonical_1.toCanonicalPayinMethod)(input.payin_method);
    const payout = (0, canonical_1.toCanonicalPayoutMethod)(input.payout_method);
    if (payin === 'other' || payout === 'other') {
        flags.add(quality_flags_1.qualityFlags.unknown_method);
    }
    const hasBucketHint = isFiniteNumber(input.amount_bucket) && input.amount_bucket > 0;
    const bucketBase = hasBucketHint ? input.amount_bucket : sendAmount;
    const bucketSelection = (0, amount_bucket_1.computeBucketSelection)(bucketBase);
    const bucketApprox = hasBucketHint && isFiniteNumber(sendAmountParsed)
        ? Math.round(sendAmountParsed) !== Math.round(input.amount_bucket)
        : bucketSelection.approximate;
    const approximate = bucketApprox;
    if (approximate) {
        flags.add(quality_flags_1.qualityFlags.bucket_approx);
    }
    const normalizedBucket = (0, amount_bucket_1.normalizeAmountBucket)(sendAmount, 500);
    if (hasBucketHint && normalizedBucket !== Math.round(input.amount_bucket)) {
        flags.add(quality_flags_1.qualityFlags.amount_bucket_mismatch);
        logger.warn('amount_bucket_mismatch', {
            corridor_id: input.corridor_id,
            input_bucket: input.amount_bucket,
            computed_bucket: normalizedBucket,
        });
    }
    const promotionalRate = parseNumeric(input.promotional_rate ?? null);
    const promotionalFeeAmount = parseNumeric(input.promotional_fee_amount ?? null);
    const baseRate = parseNumeric(input.base_rate ?? null);
    const promotionalCapAmount = parseNumeric(input.promotional_cap_amount ?? null);
    const totalDebit = calculateTotalDebit(totalDebitParsed, sendAmount, feeAmount, promotionalFeeAmount);
    const derivedRate = isFiniteNumber(sendAmount) && sendAmount > 0 && isFiniteNumber(receiveAmount)
        ? receiveAmount / sendAmount
        : null;
    const rateMatchesDerived = (rate) => {
        if (!isFiniteNumber(rate) || rate <= 0 || derivedRate === null || derivedRate <= 0)
            return false;
        const tolerance = Math.max(1e-6, Math.abs(derivedRate) * 0.002);
        return Math.abs(rate - derivedRate) <= tolerance;
    };
    // Prefer the rate that matches the actual receive amount when available.
    let impliedFxRate = 0;
    if (derivedRate !== null && derivedRate > 0) {
        if (isFiniteNumber(promotionalRate) && rateMatchesDerived(promotionalRate)) {
            impliedFxRate = promotionalRate;
        }
        else if (isFiniteNumber(baseRate) && rateMatchesDerived(baseRate)) {
            impliedFxRate = baseRate;
        }
        else {
            impliedFxRate = derivedRate;
        }
    }
    else if (isFiniteNumber(promotionalRate) && promotionalRate > 0) {
        impliedFxRate = promotionalRate;
    }
    else if (isFiniteNumber(baseRate) && baseRate > 0) {
        impliedFxRate = baseRate;
    }
    const ingestedAt = new Date().toISOString();
    const collectedAt = normalizeCollectedAt(input.collected_at, ingestedAt);
    const methodProfile = (0, method_profile_1.deriveMethodProfile)(payin, payout);
    if (methodProfile === null) {
        flags.add(quality_flags_1.qualityFlags.invalid_method_profile);
    }
    if (deliveryTimeMinMinutes === null && deliveryTimeMaxMinutes === null) {
        if (methodProfile === 'standard_bank') {
            deliveryTimeMinMinutes = 24 * 60;
            deliveryTimeMaxMinutes = 72 * 60;
        }
        else if (methodProfile === 'standard_card') {
            deliveryTimeMinMinutes = 60;
            deliveryTimeMaxMinutes = 24 * 60;
        }
        else if (methodProfile === 'cash_pickup') {
            deliveryTimeMinMinutes = 30;
            deliveryTimeMaxMinutes = 6 * 60;
        }
        else if (payout === 'mobile_wallet') {
            deliveryTimeMinMinutes = 5;
            deliveryTimeMaxMinutes = 2 * 60;
        }
        else if (payout === 'airtime') {
            deliveryTimeMinMinutes = 5;
            deliveryTimeMaxMinutes = 60;
        }
        if (deliveryTimeMinMinutes !== null && deliveryTimeMaxMinutes !== null) {
            flags.add(quality_flags_1.qualityFlags.estimated_delivery);
        }
    }
    const hasRequiredFields = isNonEmptyString(input.provider_id)
        && isNonEmptyString(input.corridor_id)
        && isNonEmptyString(input.bronze_object_key)
        && isNonEmptyString(input.ingestion_run_id);
    const hasCoreAmounts = sendAmountParsed !== null && receiveAmountParsed !== null;
    const hasCost = feeAmountParsed !== null || totalDebitParsed !== null;
    const hasMethods = payin !== 'other' && payout !== 'other';
    if (hasRequiredFields && hasCoreAmounts && hasCost && hasMethods && methodProfile !== null) {
        flags.delete(quality_flags_1.qualityFlags.partial_data);
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
    };
};
exports.normalizeQuote = normalizeQuote;
