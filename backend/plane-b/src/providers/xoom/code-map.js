"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
const PAYMENT_TYPE_TO_CANONICAL = {
    ACH: 'bank_transfer',
    BANK_ACCOUNT: 'bank_transfer',
    BANK_TRANSFER: 'bank_transfer',
    DEBIT_CARD: 'debit_card',
    CREDIT_CARD: 'credit_card',
    PAYPAL_BALANCE: 'other',
    PAYPAL: 'other',
    CRYPTO_PYUSD: 'other',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
    CASH: 'cash',
};
const DISBURSEMENT_TYPE_TO_CANONICAL = {
    DEPOSIT: 'bank_deposit',
    BANK_DEPOSIT: 'bank_deposit',
    UPI_DEPOSIT: 'bank_deposit',
    PICKUP: 'cash_pickup',
    CASH_PICKUP: 'cash_pickup',
    CARD_DEPOSIT: 'bank_deposit',
    DELIVERY: 'cash_pickup',
    MOBILE_WALLET: 'mobile_wallet',
};
const expandKeys = (key) => {
    const lowered = key.toLowerCase();
    return [key, lowered, lowered.replace(/_/g, '-'), lowered.replace(/_/g, ' ')];
};
exports.payinMethodMap = Object.fromEntries(Object.entries(PAYMENT_TYPE_TO_CANONICAL)
    .flatMap(([key, value]) => expandKeys(key).map(expanded => [expanded, value]))
    .concat(Object.entries(PAYMENT_TYPE_TO_CANONICAL).map(([, value]) => [value, value])));
exports.payoutMethodMap = Object.fromEntries(Object.entries(DISBURSEMENT_TYPE_TO_CANONICAL)
    .flatMap(([key, value]) => expandKeys(key).map(expanded => [expanded, value]))
    .concat(Object.entries(DISBURSEMENT_TYPE_TO_CANONICAL).map(([, value]) => [value, value])));
