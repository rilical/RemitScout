"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPayoutMethod = exports.mapPayinMethod = exports.normalizeMethodToken = exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
const normalizeToken = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
exports.payinMethodMap = {
    credit: 'credit_card',
    credit_card: 'credit_card',
    debit: 'debit_card',
    debit_card: 'debit_card',
    ach: 'bank_transfer',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    mobile_pay: 'apple_pay',
    mobilepay: 'apple_pay',
    mobile: 'apple_pay',
    apple_pay: 'apple_pay',
    google_pay: 'google_pay',
    boss_money_wallet: 'other',
    wallet: 'other',
};
exports.payoutMethodMap = {
    bank: 'bank_deposit',
    bank_account: 'bank_deposit',
    bank_deposit: 'bank_deposit',
};
const normalizeMethodToken = (value) => {
    if (!value)
        return '';
    return normalizeToken(value);
};
exports.normalizeMethodToken = normalizeMethodToken;
const mapPayinMethod = (value) => {
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (exports.payinMethodMap[token])
        return exports.payinMethodMap[token];
    if (token.includes('credit'))
        return 'credit_card';
    if (token.includes('debit'))
        return 'debit_card';
    if (token.includes('ach') || token.includes('bank'))
        return 'bank_transfer';
    if (token.includes('apple'))
        return 'apple_pay';
    if (token.includes('google'))
        return 'google_pay';
    if (token.includes('mobile'))
        return 'apple_pay';
    return 'other';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (exports.payoutMethodMap[token])
        return exports.payoutMethodMap[token];
    if (token.includes('bank') || token.includes('account'))
        return 'bank_deposit';
    return 'other';
};
exports.mapPayoutMethod = mapPayoutMethod;
