"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INTERMEX_ORIGIN_STATE = exports.DEFAULT_INTERMEX_ORIGIN_COUNTRY = exports.DEFAULT_INTERMEX_DELIVERY_TYPE = exports.DEFAULT_INTERMEX_STYLE_ID = exports.resolveIntermexDestinationCode = exports.resolveTranTypeId = exports.resolvePayinMethodId = exports.mapPayoutMethod = exports.mapPayinMethod = exports.normalizeMethodToken = void 0;
const supported_corridors_1 = require("./supported-corridors");
const normalizeToken = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
const payinMethodIdMap = {
    debit_card: 3,
    credit_card: 4,
};
const payoutTranTypeIdMap = {
    cash_pickup: 1,
    bank_deposit: 3,
};
const payinMethodMap = {
    debit_card: 'debit_card',
    debitcard: 'debit_card',
    debit: 'debit_card',
    credit_card: 'credit_card',
    creditcard: 'credit_card',
    credit: 'credit_card',
    card: 'debit_card',
};
const payoutMethodMap = {
    cash_pickup: 'cash_pickup',
    cash: 'cash_pickup',
    bank_deposit: 'bank_deposit',
    bank: 'bank_deposit',
};
const payoutMethodByTranTypeId = {
    1: 'cash_pickup',
    3: 'bank_deposit',
};
const payinMethodById = {
    3: 'debit_card',
    4: 'credit_card',
};
const normalizeMethodToken = (value) => {
    if (!value)
        return '';
    return normalizeToken(value);
};
exports.normalizeMethodToken = normalizeMethodToken;
const mapPayinMethod = (value) => {
    if (typeof value === 'number') {
        return payinMethodById[value] ?? 'other';
    }
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (payinMethodMap[token])
        return payinMethodMap[token];
    if (token.includes('debit'))
        return 'debit_card';
    if (token.includes('credit'))
        return 'credit_card';
    if (token.includes('card'))
        return 'debit_card';
    return 'other';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    if (typeof value === 'number') {
        return payoutMethodByTranTypeId[value] ?? 'other';
    }
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (payoutMethodMap[token])
        return payoutMethodMap[token];
    if (token.includes('cash'))
        return 'cash_pickup';
    if (token.includes('bank'))
        return 'bank_deposit';
    return 'other';
};
exports.mapPayoutMethod = mapPayoutMethod;
const resolvePayinMethodId = (method) => {
    if (!method)
        return payinMethodIdMap.debit_card;
    const token = (0, exports.normalizeMethodToken)(method);
    return payinMethodIdMap[token] ?? payinMethodIdMap.debit_card;
};
exports.resolvePayinMethodId = resolvePayinMethodId;
const resolveTranTypeId = (method) => {
    if (!method)
        return payoutTranTypeIdMap.bank_deposit;
    const token = (0, exports.normalizeMethodToken)(method);
    return payoutTranTypeIdMap[token] ?? payoutTranTypeIdMap.bank_deposit;
};
exports.resolveTranTypeId = resolveTranTypeId;
const destinationCodeMap = new Map();
for (const option of supported_corridors_1.INTERMEX_DESTINATION_OPTIONS) {
    const key = `${option.country}-${option.currency}`;
    if (!destinationCodeMap.has(key)) {
        destinationCodeMap.set(key, option.intermexCode);
    }
}
const resolveIntermexDestinationCode = (country, currency) => {
    const key = `${country}-${currency}`;
    return destinationCodeMap.get(key) ?? null;
};
exports.resolveIntermexDestinationCode = resolveIntermexDestinationCode;
exports.DEFAULT_INTERMEX_STYLE_ID = 3;
exports.DEFAULT_INTERMEX_DELIVERY_TYPE = 'W';
exports.DEFAULT_INTERMEX_ORIGIN_COUNTRY = 'USA';
exports.DEFAULT_INTERMEX_ORIGIN_STATE = 'PA';
