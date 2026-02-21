"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethodMap = exports.payinMethodMap = exports.currencyCodeMap = exports.countryCodeMap = void 0;
exports.countryCodeMap = {};
exports.currencyCodeMap = {};
exports.payinMethodMap = {
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    banktransfer: 'bank_transfer',
    transfer: 'bank_transfer',
    open_banking: 'bank_transfer',
    card: 'debit_card',
    debit: 'debit_card',
    debit_card: 'debit_card',
    credit: 'credit_card',
    credit_card: 'credit_card',
    apple_pay: 'apple_pay',
    google_pay: 'google_pay',
    cash: 'cash',
};
exports.payoutMethodMap = {
    iban: 'bank_deposit',
    bank: 'bank_deposit',
    bank_deposit: 'bank_deposit',
    bank_account: 'bank_deposit',
    bankaccount: 'bank_deposit',
    card: 'bank_deposit',
    cash: 'cash_pickup',
    cash_pickup: 'cash_pickup',
    cashpickup: 'cash_pickup',
    wallet: 'mobile_wallet',
    mobile: 'mobile_wallet',
    mobile_wallet: 'mobile_wallet',
    airtime: 'airtime',
};
