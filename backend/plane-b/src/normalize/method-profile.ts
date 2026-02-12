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
 *
 * **Note**: Database schema (`silver.method_profile` enum) defines these three profiles.
 * Other combinations (e.g., to mobile_wallet, to airtime) return `null` and are flagged
 * as `invalid_method_profile` in quality flags.
 */

import { CanonicalPayinMethod, CanonicalPayoutMethod } from '../../../shared/normalize/canonical'

/**
 * Method profile types matching database enum.
 *
 * These values MUST match the `method_profile` enum in the database schema
 * (backend/db/migrations/002_rse_silver_core.sql).
 */
export type MethodProfile = 'standard_bank' | 'standard_card' | 'cash_pickup'

/**
 * Payin method categories for profile derivation.
 */
type PayinCategory = 'bank' | 'card' | 'cash' | 'other'

/**
 * Payout method categories for profile derivation.
 */
type PayoutCategory = 'bank' | 'cash' | 'wallet' | 'airtime' | 'other'

/**
 * Checks if a payin method is card-based.
 *
 * Card-based methods include debit cards, credit cards, and digital wallets
 * (Apple Pay, Google Pay) that use cards as funding source.
 *
 * @param payin - Canonical payin method
 * @returns True if payin is card-based
 */
const isCardPayin = (payin: CanonicalPayinMethod): boolean =>
  payin === 'debit_card' ||
  payin === 'credit_card' ||
  payin === 'apple_pay' ||
  payin === 'google_pay'

/**
 * Checks if a payin method is cash-based.
 *
 * @param payin - Canonical payin method
 * @returns True if payin is cash
 */
const isCashPayin = (payin: CanonicalPayinMethod): boolean => payin === 'cash'

/**
 * Categorizes a payin method into a category.
 *
 * @param payin - Canonical payin method
 * @returns Payin category
 */
const getPayinCategory = (payin: CanonicalPayinMethod): PayinCategory => {
  if (isCardPayin(payin)) return 'card'
  if (isCashPayin(payin)) return 'cash'
  if (payin === 'bank_transfer') return 'bank'
  return 'other'
}

/**
 * Categorizes a payout method into a category.
 *
 * @param payout - Canonical payout method
 * @returns Payout category
 */
const getPayoutCategory = (payout: CanonicalPayoutMethod): PayoutCategory => {
  if (payout === 'bank_deposit') return 'bank'
  if (payout === 'cash_pickup') return 'cash'
  if (payout === 'mobile_wallet') return 'wallet'
  if (payout === 'airtime') return 'airtime'
  return 'other'
}

/**
 * Lookup table for method profile derivation.
 *
 * Maps `${payinCategory}_to_${payoutCategory}` to method profile.
 * Only combinations that map to database enum values are included.
 */
const PROFILE_LOOKUP: Record<string, MethodProfile> = {
  bank_to_bank: 'standard_bank',
  card_to_bank: 'standard_card',
  bank_to_cash: 'cash_pickup',
  card_to_cash: 'cash_pickup',
  cash_to_cash: 'cash_pickup',
}

/**
 * Derives a method profile from payin and payout method combinations.
 *
 * Method profiles categorize transfer types based on payin and payout methods:
 * - `standard_bank`: Bank transfer to bank deposit
 * - `standard_card`: Card payment to bank deposit
 * - `cash_pickup`: Any payin method to cash pickup
 *
 * Returns `null` if the combination is not supported (e.g., to mobile_wallet, to airtime,
 * or 'other' methods). When `null` is returned, the quote normalizer should set the
 * `invalid_method_profile` quality flag.
 *
 * **Supported Combinations**:
 * - bank_transfer → bank_deposit = `standard_bank`
 * - debit_card/credit_card/apple_pay/google_pay → bank_deposit = `standard_card`
 * - bank_transfer/card/cash → cash_pickup = `cash_pickup`
 *
 * **Unsupported Combinations** (returns null):
 * - Any → mobile_wallet (not in database enum)
 * - Any → airtime (not in database enum)
 * - 'other' payin or payout methods
 *
 * @param payin - Canonical payin method
 * @param payout - Canonical payout method
 * @returns Method profile matching database enum, or null if unsupported
 *
 * @example
 * deriveMethodProfile('bank_transfer', 'bank_deposit') // 'standard_bank'
 * deriveMethodProfile('debit_card', 'bank_deposit') // 'standard_card'
 * deriveMethodProfile('bank_transfer', 'cash_pickup') // 'cash_pickup'
 * deriveMethodProfile('cash', 'cash_pickup') // 'cash_pickup'
 * deriveMethodProfile('bank_transfer', 'mobile_wallet') // null (unsupported)
 * deriveMethodProfile('other', 'bank_deposit') // null (unsupported)
 */
export const deriveMethodProfile = (
  payin: CanonicalPayinMethod,
  payout: CanonicalPayoutMethod,
): MethodProfile | null => {
  const payinCategory = getPayinCategory(payin)
  const payoutCategory = getPayoutCategory(payout)

  if (payinCategory === 'other' || payoutCategory === 'other') {
    return null
  }

  const key = `${payinCategory}_to_${payoutCategory}`
  return PROFILE_LOOKUP[key] ?? null
}

/**
 * Type guard to check if a string is a valid method profile.
 *
 * Validates that the value matches one of the database enum values.
 *
 * @param value - String to check
 * @returns True if value is a valid method profile
 *
 * @example
 * isMethodProfile('standard_bank') // true
 * isMethodProfile('bank_to_bank') // false (old format, not in database)
 * isMethodProfile('invalid') // false
 */
export const isMethodProfile = (value: unknown): value is MethodProfile => {
  const validProfiles: MethodProfile[] = ['standard_bank', 'standard_card', 'cash_pickup']
  return typeof value === 'string' && validProfiles.includes(value as MethodProfile)
}
