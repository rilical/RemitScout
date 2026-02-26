/**
 * Method profile derivation module.
 *
 * Derives method profiles from payin/payout combinations to categorize transfer types.
 * Method profiles are used for data aggregation and analysis in the database.
 *
 * **Profile Categories**:
 * - `standard_bank`: Bank transfer to bank deposit (bank-to-bank)
 * - `standard_card`: Card payment to bank deposit (card-to-bank)
 * - `cash_pickup`: Any payin method to cash pickup
 * - `mobile_wallet`: Any payin method to mobile wallet (e.g. M-Pesa, GCash)
 * - `airtime_topup`: Any payin method to airtime top-up
 * - `card_delivery`: Any payin method to debit/credit card payout
 * - `home_delivery`: Any payin method to home/door delivery
 */
import { CanonicalPayinMethod, CanonicalPayoutMethod } from '../../../shared/normalize/canonical';
/**
 * Method profile types matching database enum.
 *
 * These values MUST match the `method_profile` enum in the database schema
 * (backend/db/migrations/002_rse_silver_core.sql + 088_expand_method_profile.sql).
 */
export type MethodProfile = 'standard_bank' | 'standard_card' | 'cash_pickup' | 'mobile_wallet' | 'airtime_topup' | 'card_delivery' | 'home_delivery';
/**
 * Derives a method profile from payin and payout method combinations.
 *
 * Returns `null` for unrecognized combinations (e.g. 'other' payin/payout).
 * When `null` is returned, the quote normalizer sets `invalid_method_profile`.
 *
 * @example
 * deriveMethodProfile('bank_transfer', 'bank_deposit')   // 'standard_bank'
 * deriveMethodProfile('debit_card', 'bank_deposit')      // 'standard_card'
 * deriveMethodProfile('bank_transfer', 'cash_pickup')    // 'cash_pickup'
 * deriveMethodProfile('bank_transfer', 'mobile_wallet')  // 'mobile_wallet'
 * deriveMethodProfile('debit_card', 'airtime')           // 'airtime_topup'
 * deriveMethodProfile('debit_card', 'debit_card')        // 'card_delivery'
 * deriveMethodProfile('bank_transfer', 'home_delivery')  // 'home_delivery'
 */
export declare const deriveMethodProfile: (payin: CanonicalPayinMethod, payout: CanonicalPayoutMethod) => MethodProfile | null;
/**
 * Type guard to check if a string is a valid method profile.
 */
export declare const isMethodProfile: (value: unknown) => value is MethodProfile;
