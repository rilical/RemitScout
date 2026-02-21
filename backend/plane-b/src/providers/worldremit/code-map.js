"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
exports.payinMethodMap = {
    BANK_TRANSFER: 'bank_transfer',
    BANK: 'bank_transfer',
    TRANSFER: 'bank_transfer',
    DEBIT_CARD: 'debit_card',
    CREDIT_CARD: 'credit_card',
    CARD: 'debit_card',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
    CASH: 'cash',
};
exports.payoutMethodMap = {
    BNK: 'bank_deposit',
    CSH: 'cash_pickup',
    MOB: 'mobile_wallet',
    ATP: 'airtime',
    BANK: 'bank_deposit',
    CASH: 'cash_pickup',
};
