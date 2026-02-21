"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMukuruPayoutMethod = exports.mapMukuruPayinMethod = exports.mapMukuruSourceCountry = void 0;
const canonical_1 = require("../../../../shared/normalize/canonical");
const SOURCE_COUNTRY_ALIASES = {
    US: 'AA', // Mukuru uses AA for "International" which is USD-based.
};
const mapMukuruSourceCountry = (code) => {
    const normalized = code.trim().toUpperCase();
    return SOURCE_COUNTRY_ALIASES[normalized] ?? normalized;
};
exports.mapMukuruSourceCountry = mapMukuruSourceCountry;
const mapMukuruPayinMethod = (method) => {
    const normalized = (0, canonical_1.toCanonicalPayinMethod)(method);
    if (normalized === 'bank_transfer')
        return normalized;
    if (normalized === 'debit_card' || normalized === 'credit_card')
        return normalized;
    return 'bank_transfer';
};
exports.mapMukuruPayinMethod = mapMukuruPayinMethod;
const mapMukuruPayoutMethod = (label) => {
    if (!label)
        return 'other';
    const normalized = label.toLowerCase();
    if (normalized.includes('cash'))
        return 'cash_pickup';
    if (normalized.includes('bank'))
        return 'bank_deposit';
    if (normalized.includes('wallet'))
        return 'mobile_wallet';
    if (normalized.includes('airtime'))
        return 'airtime';
    if (normalized.includes('m-pesa') || normalized.includes('mpesa'))
        return 'mobile_wallet';
    if (normalized.includes('top-up') || normalized.includes('topup'))
        return 'mobile_wallet';
    return (0, canonical_1.toCanonicalPayoutMethod)(label);
};
exports.mapMukuruPayoutMethod = mapMukuruPayoutMethod;
