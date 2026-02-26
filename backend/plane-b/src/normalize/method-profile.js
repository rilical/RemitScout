"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMethodProfile = exports.deriveMethodProfile = void 0;
const isCardPayin = (payin) => payin === 'debit_card' ||
    payin === 'credit_card' ||
    payin === 'apple_pay' ||
    payin === 'google_pay';
const isCashPayin = (payin) => payin === 'cash';
const getPayinCategory = (payin) => {
    if (isCardPayin(payin))
        return 'card';
    if (isCashPayin(payin))
        return 'cash';
    if (payin === 'bank_transfer')
        return 'bank';
    return 'other';
};
const getPayoutCategory = (payout) => {
    if (payout === 'bank_deposit')
        return 'bank';
    if (payout === 'cash_pickup')
        return 'cash';
    if (payout === 'mobile_wallet')
        return 'wallet';
    if (payout === 'airtime')
        return 'airtime';
    if (payout === 'debit_card')
        return 'card';
    if (payout === 'home_delivery')
        return 'home';
    return 'other';
};
const PROFILE_LOOKUP = {
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
};
const deriveMethodProfile = (payin, payout) => {
    const payinCategory = getPayinCategory(payin);
    const payoutCategory = getPayoutCategory(payout);
    if (payinCategory === 'other' || payoutCategory === 'other') {
        return null;
    }
    const key = `${payinCategory}_to_${payoutCategory}`;
    return PROFILE_LOOKUP[key] ?? null;
};
exports.deriveMethodProfile = deriveMethodProfile;
const isMethodProfile = (value) => {
    const validProfiles = [
        'standard_bank',
        'standard_card',
        'cash_pickup',
        'mobile_wallet',
        'airtime_topup',
        'card_delivery',
        'home_delivery',
    ];
    return typeof value === 'string' && validProfiles.includes(value);
};
exports.isMethodProfile = isMethodProfile;
