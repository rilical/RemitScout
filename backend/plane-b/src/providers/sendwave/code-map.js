"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSendwavePayoutMethod = exports.mapSendwavePayinMethod = exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
const PAYIN_TO_CANONICAL = {
    card: 'debit_card',
    debit: 'debit_card',
    debitcard: 'debit_card',
    debit_card: 'debit_card',
    credit: 'credit_card',
    creditcard: 'credit_card',
    credit_card: 'credit_card',
    bank_transfer: 'bank_transfer',
};
const PAYOUT_TO_CANONICAL = {
    bank: 'bank_deposit',
    bank_account: 'bank_deposit',
    bank_deposit: 'bank_deposit',
    cash: 'cash_pickup',
    cash_pickup: 'cash_pickup',
    cash_collection: 'cash_pickup',
    mobile: 'mobile_wallet',
    mobile_money: 'mobile_wallet',
    mobile_wallet: 'mobile_wallet',
    wallet: 'mobile_wallet',
    gcash: 'mobile_wallet',
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
const mapSendwavePayinMethod = (value) => {
    if (!value)
        return 'other';
    const token = normalizeToken(value);
    return exports.payinMethodMap[value] ?? exports.payinMethodMap[token] ?? 'other';
};
exports.mapSendwavePayinMethod = mapSendwavePayinMethod;
const mapSendwavePayoutMethod = (value) => {
    if (!value)
        return 'other';
    const token = normalizeToken(value);
    const mapped = exports.payoutMethodMap[value] ?? exports.payoutMethodMap[token];
    if (mapped)
        return mapped;
    if (token.includes('cash'))
        return 'cash_pickup';
    if (token.includes('bank') || token.includes('account') || token.includes('deposit'))
        return 'bank_deposit';
    if (token.includes('mobile')
        || token.includes('wallet')
        || token.includes('gcash')
        || token.includes('mpesa')
        || token.includes('m_pesa')
        || token.includes('momo')
        || token.includes('airtel')
        || token.includes('tigo')
        || token.includes('orange')) {
        return 'mobile_wallet';
    }
    return 'other';
};
exports.mapSendwavePayoutMethod = mapSendwavePayoutMethod;
