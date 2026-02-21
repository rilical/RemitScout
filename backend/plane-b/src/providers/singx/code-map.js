"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMethodToken = exports.mapPayoutMethod = exports.mapPayinMethod = exports.payoutMethodMap = exports.payinMethodMap = void 0;
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_');
exports.payinMethodMap = {
    bank_transfer: 'bank_transfer',
    bank: 'bank_transfer',
    transfer: 'bank_transfer',
    debit: 'debit_card',
    debit_card: 'debit_card',
    card: 'debit_card',
    credit: 'credit_card',
    credit_card: 'credit_card',
};
exports.payoutMethodMap = {
    bank_deposit: 'bank_deposit',
    bank: 'bank_deposit',
    deposit: 'bank_deposit',
    cash: 'cash_pickup',
    wallet: 'mobile_wallet',
};
const mapPayinMethod = (value) => {
    if (!value)
        return 'bank_transfer';
    const token = normalizeToken(value);
    return exports.payinMethodMap[value] ?? exports.payinMethodMap[token] ?? 'bank_transfer';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    if (!value)
        return 'bank_deposit';
    const token = normalizeToken(value);
    return exports.payoutMethodMap[value] ?? exports.payoutMethodMap[token] ?? 'bank_deposit';
};
exports.mapPayoutMethod = mapPayoutMethod;
exports.normalizeMethodToken = normalizeToken;
