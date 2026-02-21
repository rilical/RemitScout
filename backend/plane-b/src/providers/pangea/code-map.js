"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
exports.payinMethodMap = {
    bank_transfer: 'bank_transfer',
    bank: 'bank_transfer',
    ach: 'bank_transfer',
    debit_card: 'debit_card',
    credit_card: 'credit_card',
};
exports.payoutMethodMap = {
    bank_deposit: 'bank_deposit',
    bank: 'bank_deposit',
    cash_pickup: 'cash_pickup',
    mobile_wallet: 'mobile_wallet',
};
