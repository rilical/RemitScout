"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceCodeForPayout = exports.getPaymentCodeForPayin = exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
const DELIVERY_SERVICE_CODES = {
    '000': 'CASH_PICKUP',
    '200': 'DIRECT_TO_CARD',
    '001': 'ACCOUNT_DEPOSIT',
    '002': 'ACCOUNT_DEPOSIT',
    '500': 'ACCOUNT_DEPOSIT',
    '501': 'ACCOUNT_DEPOSIT',
    '50A': 'ACCOUNT_DEPOSIT',
    '100': 'CASH_HOME_DELIVERY',
    '700': 'CASH_HOME_DELIVERY',
    '050': 'MOBILE_MONEY',
    '060': 'WALLET_ACCOUNT',
    '115': 'UPI',
    '080': 'PREPAID_CARD',
    '800': 'MOBILE_MONEY',
    '801': 'MOBILE_MONEY',
};
const PAYMENT_METHOD_CODES = {
    CC: 'CREDITCARD',
    DC: 'DEBITCARD',
    BA: 'BANKACCOUNT',
    AC: 'BANKACCOUNT',
    CA: 'CASH',
    AP: 'APPLEPAY',
    PA: 'PAYNOW',
    PB: 'PAY_BY_BANK',
    IR: 'INTERAC',
    EB: 'ONLINE_BANKING',
    GP: 'GOOGLEPAY',
    TR: 'TRUSTLY',
    TK: 'TRUSTLY',
    SO: 'SOFORT',
};
const DELIVERY_TO_CANONICAL = {
    CASH_PICKUP: 'cash_pickup',
    ACCOUNT_DEPOSIT: 'bank_deposit',
    MOBILE_MONEY: 'mobile_wallet',
    WALLET_ACCOUNT: 'mobile_wallet',
    CASH_HOME_DELIVERY: 'cash_pickup',
    UPI: 'bank_deposit',
    PREPAID_CARD: 'other',
    DIRECT_TO_CARD: 'other',
};
const PAYMENT_TO_CANONICAL = {
    CREDITCARD: 'credit_card',
    DEBITCARD: 'debit_card',
    BANKACCOUNT: 'bank_transfer',
    CASH: 'cash',
    APPLEPAY: 'apple_pay',
    GOOGLEPAY: 'google_pay',
    PAYNOW: 'bank_transfer',
    PAY_BY_BANK: 'bank_transfer',
    INTERAC: 'bank_transfer',
    ONLINE_BANKING: 'bank_transfer',
    TRUSTLY: 'bank_transfer',
    SOFORT: 'bank_transfer',
};
exports.payinMethodMap = Object.fromEntries(Object.entries(PAYMENT_METHOD_CODES)
    .flatMap(([code, name]) => [
    [code, PAYMENT_TO_CANONICAL[name] ?? 'other'],
    [name, PAYMENT_TO_CANONICAL[name] ?? 'other'],
])
    .concat(Object.entries(PAYMENT_TO_CANONICAL)));
exports.payoutMethodMap = Object.fromEntries(Object.entries(DELIVERY_SERVICE_CODES)
    .flatMap(([code, name]) => [
    [code, DELIVERY_TO_CANONICAL[name] ?? 'other'],
    [name, DELIVERY_TO_CANONICAL[name] ?? 'other'],
])
    .concat(Object.entries(DELIVERY_TO_CANONICAL)));
const CANONICAL_PAYIN_TO_CODE = {
    bank_transfer: 'AC',
    debit_card: 'DC',
    credit_card: 'CC',
    cash: 'CA',
};
const CANONICAL_PAYOUT_TO_CODE = {
    cash_pickup: '000',
    bank_deposit: '001',
    mobile_wallet: '050',
};
const getPaymentCodeForPayin = (payinMethod) => {
    if (!payinMethod)
        return CANONICAL_PAYIN_TO_CODE.bank_transfer;
    return CANONICAL_PAYIN_TO_CODE[payinMethod] ?? CANONICAL_PAYIN_TO_CODE.bank_transfer;
};
exports.getPaymentCodeForPayin = getPaymentCodeForPayin;
const getServiceCodeForPayout = (payoutMethod) => {
    if (!payoutMethod)
        return null;
    return CANONICAL_PAYOUT_TO_CODE[payoutMethod] ?? null;
};
exports.getServiceCodeForPayout = getServiceCodeForPayout;
