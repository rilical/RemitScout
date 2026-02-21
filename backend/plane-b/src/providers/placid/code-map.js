"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMethodToken = exports.mapPayinToPlacidCode = exports.mapPlacidPaymentType = exports.mapPayoutMethod = exports.mapPayinMethod = exports.payoutMethodMap = exports.payinMethodMap = void 0;
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_');
const PAYIN_TO_CANONICAL = {
    debit: 'debit_card',
    debit_card: 'debit_card',
    card: 'debit_card',
    credit: 'credit_card',
    credit_card: 'credit_card',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    bank_account: 'bank_transfer',
    ach: 'bank_transfer',
};
const PAYOUT_TO_CANONICAL = {
    bank: 'bank_deposit',
    bank_deposit: 'bank_deposit',
    bank_account: 'bank_deposit',
    deposit: 'bank_deposit',
};
const PLACID_PAYIN_CODE_TO_CANONICAL = {
    cc: 'debit_card',
    dc: 'debit_card',
    ba: 'bank_transfer',
    pm: 'other',
};
const CANONICAL_TO_PLACID_PAYIN_CODE = {
    debit_card: 'CC',
    credit_card: 'CC',
    bank_transfer: 'BA',
    bank_account: 'BA',
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
const mapPlacidPaymentType = (value) => {
    if (!value)
        return 'other';
    const token = normalizeToken(value);
    return PLACID_PAYIN_CODE_TO_CANONICAL[token] ?? 'other';
};
exports.mapPlacidPaymentType = mapPlacidPaymentType;
const mapPayinToPlacidCode = (value) => {
    if (!value)
        return 'BA';
    const token = normalizeToken(value);
    return CANONICAL_TO_PLACID_PAYIN_CODE[value]
        ?? CANONICAL_TO_PLACID_PAYIN_CODE[token]
        ?? 'BA';
};
exports.mapPayinToPlacidCode = mapPayinToPlacidCode;
exports.normalizeMethodToken = normalizeToken;
