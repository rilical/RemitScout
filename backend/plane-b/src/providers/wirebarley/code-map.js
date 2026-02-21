"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPayoutMethod = exports.mapPayinMethod = exports.normalizeMethodToken = void 0;
const normalizeToken = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
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
    if (token.includes('open_api'))
        return 'bank_transfer';
    if (token.includes('bank_account') || token.includes('bank'))
        return 'bank_transfer';
    if (token.includes('card'))
        return 'debit_card';
    return 'other';
};
exports.mapPayinMethod = mapPayinMethod;
const mapPayoutMethod = (value) => {
    const token = (0, exports.normalizeMethodToken)(value);
    if (!token)
        return 'other';
    if (token.includes('mobile_wallet') || token.includes('wallet') || token.includes('alipay') || token.includes('wechat')) {
        return 'mobile_wallet';
    }
    if (token.includes('cash_pickup') || token.includes('cash') || token.includes('home_delivery')) {
        return 'cash_pickup';
    }
    if (token.includes('bank_account') || token.includes('bank') || token.includes('card')) {
        return 'bank_deposit';
    }
    return 'other';
};
exports.mapPayoutMethod = mapPayoutMethod;
