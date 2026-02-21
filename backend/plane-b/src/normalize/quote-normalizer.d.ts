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
import { CanonicalPayinMethod, CanonicalPayoutMethod } from '../../../shared/normalize/canonical';
import { MethodProfile } from './method-profile';
import { QualityFlag } from './quality-flags';
/**
 * Input for quote normalization.
 *
 * This type represents a parsed quote from a provider parser before normalization.
 */
export type NormalizeQuoteInput = {
    provider_id: string;
    corridor_id: string;
    amount_bucket?: number;
    send_amount: number;
    fee_amount: number;
    fee_currency?: string | null;
    total_debit_amount?: number | null;
    receive_amount: number;
    payin_method?: string | null;
    payout_method?: string | null;
    promotional_fee_amount?: number | null;
    delivery_time_min_minutes?: number | null;
    delivery_time_max_minutes?: number | null;
    promotional_rate?: number | null;
    base_rate?: number | null;
    promotional_cap_amount?: number | null;
    collected_at: string | Date;
    ingestion_run_id: string;
    bronze_object_key: string;
    parser_version?: string | null;
    parse_flags?: QualityFlag[];
};
/**
 * Normalized quote output.
 *
 * This type represents a fully normalized quote ready for persistence to the database.
 */
export type NormalizedQuote = {
    provider_id: string;
    corridor_id: string;
    amount_bucket: number;
    bucket_used: number;
    fee_bucket_used: number;
    approximate: boolean;
    payin: CanonicalPayinMethod;
    payout: CanonicalPayoutMethod;
    send_amount: number;
    fee_amount: number;
    fee_currency?: string | null;
    total_debit_amount: number;
    receive_amount: number;
    implied_fx_rate: number;
    promotional_fee_amount: number | null;
    delivery_time_min_minutes?: number | null;
    delivery_time_max_minutes?: number | null;
    promotional_rate: number | null;
    base_rate: number | null;
    promotional_cap_amount: number | null;
    collected_at: string;
    ingested_at: string;
    ingestion_run_id: string;
    bronze_object_key: string;
    parser_version?: string | null;
    quality_flags: QualityFlag[];
    method_profile: MethodProfile | null;
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
export declare const normalizeQuote: (input: NormalizeQuoteInput) => NormalizedQuote;
