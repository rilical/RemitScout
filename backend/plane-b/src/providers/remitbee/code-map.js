"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethodMap = exports.payinMethodMap = exports.getCurrencyCodesForIso2 = exports.getCurrencyCodeForIso2 = exports.getCountryIdForIso2 = exports.getRemitbeeCountry = exports.currencyCodesByIso2 = exports.currencyCodeByIso2 = exports.countryIdByIso2 = exports.remitbeeCountryByIso2 = void 0;
const countries_data_json_1 = __importDefault(require("./countries-data.json"));
const entries = Object.values(countries_data_json_1.default);
const normalizeIso2 = (value) => value.trim().toUpperCase();
exports.remitbeeCountryByIso2 = new Map();
exports.countryIdByIso2 = {};
exports.currencyCodeByIso2 = {};
exports.currencyCodesByIso2 = {};
const currencyOverridesByIso2 = {
    CR: ['USD'],
    DO: ['USD'],
    GT: ['USD'],
    HN: ['USD'],
    JM: ['USD'],
    PE: ['USD'],
    UA: ['USD'],
    UY: ['USD'],
};
for (const entry of entries) {
    const iso2 = normalizeIso2(entry.iso2);
    exports.remitbeeCountryByIso2.set(iso2, { ...entry, iso2 });
    exports.countryIdByIso2[iso2] = entry.country_id;
    exports.currencyCodeByIso2[iso2] = entry.currency_code;
    const overrides = currencyOverridesByIso2[iso2] ?? [];
    exports.currencyCodesByIso2[iso2] = Array.from(new Set([entry.currency_code, ...overrides]));
}
const getRemitbeeCountry = (iso2) => {
    return exports.remitbeeCountryByIso2.get(normalizeIso2(iso2));
};
exports.getRemitbeeCountry = getRemitbeeCountry;
const getCountryIdForIso2 = (iso2) => {
    const normalized = normalizeIso2(iso2);
    return exports.countryIdByIso2[normalized] ?? null;
};
exports.getCountryIdForIso2 = getCountryIdForIso2;
const getCurrencyCodeForIso2 = (iso2) => {
    const normalized = normalizeIso2(iso2);
    return exports.currencyCodeByIso2[normalized] ?? null;
};
exports.getCurrencyCodeForIso2 = getCurrencyCodeForIso2;
const getCurrencyCodesForIso2 = (iso2) => {
    const normalized = normalizeIso2(iso2);
    return exports.currencyCodesByIso2[normalized] ?? [];
};
exports.getCurrencyCodesForIso2 = getCurrencyCodesForIso2;
exports.payinMethodMap = {
    debit: 'debit_card',
    debit_card: 'debit_card',
    credit: 'credit_card',
    credit_card: 'credit_card',
    card: 'debit_card',
    interac: 'bank_transfer',
    interac_e_transfer: 'bank_transfer',
    e_transfer: 'bank_transfer',
    etransfer: 'bank_transfer',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
};
exports.payoutMethodMap = {
    bank: 'bank_deposit',
    bank_deposit: 'bank_deposit',
    account: 'bank_deposit',
    cash: 'cash_pickup',
    wallet: 'mobile_wallet',
};
