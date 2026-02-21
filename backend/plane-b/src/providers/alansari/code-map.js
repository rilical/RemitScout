"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALANSARI_SOURCE_CURRENCY_ID = exports.resolveDestination = exports.resolveTransferType = exports.mapPayoutMethod = exports.mapPayinMethod = exports.normalizeMethodToken = void 0;
const supported_corridors_1 = require("./supported-corridors");
const normalizeToken = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
const payinMethodMap = {
    bank_transfer: 'bank_transfer',
    banktransfer: 'bank_transfer',
    bank: 'bank_transfer',
    transfer: 'bank_transfer',
};
const payoutMethodMap = {
    bank_deposit: 'bank_deposit',
    bank: 'bank_deposit',
    transfer: 'bank_deposit',
    bank_transfer: 'bank_deposit',
    cash_pickup: 'cash_pickup',
    cashpickup: 'cash_pickup',
    cash: 'cash_pickup',
};
const payoutMethodToTransferType = {
    cash_pickup: 'CP',
    bank_deposit: 'BT',
};
const normalizeMethodToken = (value) => {
    if (!value)
        return '';
    return normalizeToken(value);
};
exports.normalizeMethodToken = normalizeMethodToken;
const mapPayinMethod = (value) => {
    if (!value)
        return 'other';
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    return payinMethodMap[token] ?? 'other';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    if (!value)
        return 'other';
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    return payoutMethodMap[token] ?? 'other';
};
exports.mapPayoutMethod = mapPayoutMethod;
const resolveTransferType = (method) => {
    if (!method)
        return payoutMethodToTransferType.bank_deposit;
    const token = (0, exports.normalizeMethodToken)(method);
    return payoutMethodToTransferType[token] ?? payoutMethodToTransferType.bank_deposit;
};
exports.resolveTransferType = resolveTransferType;
const resolveDestination = (country, currency) => {
    return (0, supported_corridors_1.resolveAlansariDestination)(country, currency);
};
exports.resolveDestination = resolveDestination;
exports.ALANSARI_SOURCE_CURRENCY_ID = 91;
