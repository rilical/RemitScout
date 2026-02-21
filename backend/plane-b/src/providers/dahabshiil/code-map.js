"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayoutTypeForMethod = exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
const PAYIN_TO_CANONICAL = {
    Cash: 'cash',
    CashIn: 'cash',
    Bank: 'bank_transfer',
    BankTransfer: 'bank_transfer',
};
const PAYOUT_TO_CANONICAL = {
    CashCollection: 'cash_pickup',
    Cash_Collection: 'cash_pickup',
    CashCollectionPickup: 'cash_pickup',
    CashPickup: 'cash_pickup',
    CashPayout: 'cash_pickup',
    BankDeposit: 'bank_deposit',
    Bank_Deposit: 'bank_deposit',
    BankAccount: 'bank_deposit',
    MobileWallet: 'mobile_wallet',
    Mobile_Wallet: 'mobile_wallet',
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
const CANONICAL_PAYOUT_TO_DAHABSHIIL = {
    cash_pickup: 'Cash Collection',
    bank_deposit: 'Bank Deposit',
    mobile_wallet: 'Mobile Wallet',
};
const getPayoutTypeForMethod = (payoutMethod) => {
    if (!payoutMethod)
        return CANONICAL_PAYOUT_TO_DAHABSHIIL.cash_pickup;
    return CANONICAL_PAYOUT_TO_DAHABSHIIL[payoutMethod] ?? CANONICAL_PAYOUT_TO_DAHABSHIIL.cash_pickup;
};
exports.getPayoutTypeForMethod = getPayoutTypeForMethod;
