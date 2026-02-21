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
    card: 'debit_card',
    debit: 'debit_card',
    debit_card: 'debit_card',
    bank_card: 'debit_card',
    bankcard: 'debit_card',
    credit: 'credit_card',
    credit_card: 'credit_card',
    visa: 'debit_card',
    mastercard: 'debit_card',
    amex: 'debit_card',
    unionpay: 'debit_card',
    mir: 'debit_card',
    uzcard: 'debit_card',
    humo: 'debit_card',
    arca: 'debit_card',
    jcb: 'debit_card',
    diners: 'debit_card',
    discover: 'debit_card',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    banktransfer: 'bank_transfer',
    bank_account: 'bank_transfer',
    account: 'bank_transfer',
    sepa: 'bank_transfer',
    swift: 'bank_transfer',
    fasterpayments: 'bank_transfer',
    ideal: 'bank_transfer',
    trustly: 'bank_transfer',
    klarna: 'bank_transfer',
    mbway: 'bank_transfer',
    blik: 'bank_transfer',
    wire: 'bank_transfer',
    wire_transfer: 'bank_transfer',
    transfer: 'bank_transfer',
    apple_pay: 'apple_pay',
    google_pay: 'google_pay',
    wallet: 'mobile_wallet',
};
exports.payoutMethodMap = {
    card: 'debit_card',
    debit: 'debit_card',
    debit_card: 'debit_card',
    bank_card: 'debit_card',
    bankcard: 'debit_card',
    visa: 'debit_card',
    mastercard: 'debit_card',
    amex: 'debit_card',
    unionpay: 'debit_card',
    mir: 'debit_card',
    uzcard: 'debit_card',
    humo: 'debit_card',
    arca: 'debit_card',
    jcb: 'debit_card',
    diners: 'debit_card',
    discover: 'debit_card',
    bank: 'bank_deposit',
    bank_account: 'bank_deposit',
    bankaccount: 'bank_deposit',
    bank_deposit: 'bank_deposit',
    account: 'bank_deposit',
    sepa: 'bank_deposit',
    swift: 'bank_deposit',
    fasterpayments: 'bank_deposit',
    ideal: 'bank_deposit',
    trustly: 'bank_deposit',
    klarna: 'bank_deposit',
    mbway: 'bank_deposit',
    blik: 'bank_deposit',
    cash: 'cash_pickup',
    cash_pickup: 'cash_pickup',
    wallet: 'mobile_wallet',
    mobile_wallet: 'mobile_wallet',
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
    if (token.includes('visa') || token.includes('mastercard') || token.includes('amex'))
        return 'debit_card';
    if (token.includes('unionpay') || token.includes('mir') || token.includes('humo') || token.includes('uzcard')) {
        return 'debit_card';
    }
    if (token.includes('sepa') || token.includes('swift') || token.includes('fasterpayments'))
        return 'bank_transfer';
    if (token.includes('trustly') || token.includes('ideal') || token.includes('klarna') || token.includes('mbway')) {
        return 'bank_transfer';
    }
    if (token.includes('debit'))
        return 'debit_card';
    if (token.includes('credit'))
        return 'credit_card';
    if (token.includes('apple'))
        return 'apple_pay';
    if (token.includes('google'))
        return 'google_pay';
    if (token.includes('card'))
        return 'debit_card';
    if (token.includes('bank') || token.includes('wire') || token.includes('transfer'))
        return 'bank_transfer';
    if (token.includes('account'))
        return 'bank_transfer';
    if (token.includes('wallet'))
        return 'mobile_wallet';
    return 'other';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (exports.payoutMethodMap[token])
        return exports.payoutMethodMap[token];
    if (token.includes('visa') || token.includes('mastercard') || token.includes('amex'))
        return 'debit_card';
    if (token.includes('unionpay') || token.includes('mir') || token.includes('humo') || token.includes('uzcard')) {
        return 'debit_card';
    }
    if (token.includes('sepa') || token.includes('swift') || token.includes('fasterpayments'))
        return 'bank_deposit';
    if (token.includes('trustly') || token.includes('ideal') || token.includes('klarna') || token.includes('mbway')) {
        return 'bank_deposit';
    }
    if (token.includes('bank'))
        return 'bank_deposit';
    if (token.includes('card'))
        return 'debit_card';
    if (token.includes('cash'))
        return 'cash_pickup';
    if (token.includes('wallet'))
        return 'mobile_wallet';
    return 'other';
};
exports.mapPayoutMethod = mapPayoutMethod;
