"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeliveryMethodForPayout = exports.getPaymentMethodForPayin = exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {
    XK: 'KV',
};
exports.currencyCodeMap = {};
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[\s\-./]+/g, '_');
const PAYIN_TO_CANONICAL = {
    DirectDebit: 'bank_transfer',
    BankTransfer: 'bank_transfer',
    BankAccount: 'bank_transfer',
    DebitCard: 'debit_card',
    CreditCard: 'credit_card',
    ApplePay: 'apple_pay',
    GooglePay: 'google_pay',
    Cash: 'cash',
    PayNearMe: 'cash',
};
const PAYOUT_TO_CANONICAL = {
    BankAccount: 'bank_deposit',
    BankDeposit: 'bank_deposit',
    CashPayout: 'cash_pickup',
    CashPickup: 'cash_pickup',
    OfficePickup: 'cash_pickup',
    MobileWallet: 'mobile_wallet',
    MobilePayment: 'mobile_wallet',
    FundsOnBalance: 'other',
};
const buildMethodMap = (mapping) => {
    const entries = [];
    for (const [key, value] of Object.entries(mapping)) {
        entries.push([key, value]);
        entries.push([normalizeToken(key), value]);
    }
    return Object.fromEntries(entries);
};
exports.payinMethodMap = buildMethodMap(PAYIN_TO_CANONICAL);
exports.payoutMethodMap = buildMethodMap(PAYOUT_TO_CANONICAL);
const CANONICAL_PAYIN_TO_RIA = {
    bank_transfer: 'BankAccount',
    debit_card: 'DebitCard',
    credit_card: 'CreditCard',
    apple_pay: 'ApplePay',
    google_pay: 'GooglePay',
    cash: 'Cash',
};
const CANONICAL_PAYOUT_TO_RIA = {
    bank_deposit: 'BankDeposit',
    cash_pickup: 'CashPayout',
    mobile_wallet: 'MobileWallet',
};
const getPaymentMethodForPayin = (payinMethod) => {
    if (!payinMethod)
        return CANONICAL_PAYIN_TO_RIA.bank_transfer;
    return CANONICAL_PAYIN_TO_RIA[payinMethod] ?? CANONICAL_PAYIN_TO_RIA.bank_transfer;
};
exports.getPaymentMethodForPayin = getPaymentMethodForPayin;
const getDeliveryMethodForPayout = (payoutMethod) => {
    if (!payoutMethod)
        return CANONICAL_PAYOUT_TO_RIA.bank_deposit;
    return CANONICAL_PAYOUT_TO_RIA[payoutMethod] ?? CANONICAL_PAYOUT_TO_RIA.bank_deposit;
};
exports.getDeliveryMethodForPayout = getDeliveryMethodForPayout;
