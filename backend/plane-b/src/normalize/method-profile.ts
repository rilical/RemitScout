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

import { CanonicalPayinMethod, CanonicalPayoutMethod } from '../../../shared/normalize/canonical'

/**
 * Method profile types matching database enum.
 *
 * These values MUST match the `method_profile` enum in the database schema
 * (backend/db/migrations/002_rse_silver_core.sql + 088_expand_method_profile.sql).
 */
export type MethodProfile =
  | 'standard_bank'
  | 'standard_card'
  | 'cash_pickup'
  | 'mobile_wallet'
  | 'airtime_topup'
  | 'card_delivery'
  | 'home_delivery'

/**
 * Payin method categories for profile derivation.
 */
type PayinCategory = 'bank' | 'card' | 'cash' | 'other'

/**
 * Payout method categories for profile derivation.
 */
type PayoutCategory = 'bank' | 'cash' | 'wallet' | 'airtime' | 'card' | 'home' | 'other'

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
  if (payout === 'debit_card') return 'card'
  if (payout === 'home_delivery') return 'home'
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
  bank_to_wallet: 'mobile_wallet',
  card_to_wallet: 'mobile_wallet',
  cash_to_wallet: 'mobile_wallet',
  bank_to_airtime: 'airtime_topup',
  card_to_airtime: 'airtime_topup',
  bank_to_card: 'card_delivery',
  card_to_card: 'card_delivery',
  bank_to_home: 'home_delivery',
  card_to_home: 'home_delivery',
  cash_to_home: 'home_delivery',
}

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
 */
export const isMethodProfile = (value: unknown): value is MethodProfile => {
  const validProfiles: MethodProfile[] = [
    'standard_bank',
    'standard_card',
    'cash_pickup',
    'mobile_wallet',
    'airtime_topup',
    'card_delivery',
    'home_delivery',
  ]
  return typeof value === 'string' && validProfiles.includes(value as MethodProfile)
}
