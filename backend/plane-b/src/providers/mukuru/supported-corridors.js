"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUKURU_B2B_CORRIDORS = exports.MUKURU_SUPPORTED_CORRIDORS = exports.MUKURU_SOURCE_COUNTRIES = void 0;
// Mukuru uses "AA" for International (USD). We expose it as US to keep ISO codes.
exports.MUKURU_SOURCE_COUNTRIES = [
    { code: 'BW', currency: 'BWP' },
    { code: 'US', currency: 'USD' },
    { code: 'KE', currency: 'KES' },
    { code: 'LS', currency: 'LSL' },
    { code: 'MW', currency: 'MWK' },
    { code: 'RW', currency: 'RWF' },
    { code: 'ZA', currency: 'ZAR' },
    { code: 'UG', currency: 'UGX' },
    { code: 'GB', currency: 'GBP' },
    { code: 'ZM', currency: 'ZMW' },
    { code: 'ZW', currency: 'USD' },
];
const MUKURU_DESTINATION_PAIRS = [
    ['AO', 'AOA'],
    ['AT', 'EUR'],
    ['BD', 'BDT'],
    ['BE', 'EUR'],
    ['BG', 'EUR'],
    ['BI', 'BIF'],
    ['CM', 'XAF'],
    ['CA', 'CAD'],
    ['CN', 'CNY'],
    ['CI', 'XOF'],
    ['HR', 'EUR'],
    ['CY', 'EUR'],
    ['CZ', 'EUR'],
    ['CD', 'USD'],
    ['DK', 'EUR'],
    ['EE', 'EUR'],
    ['SZ', 'SZL'],
    ['ET', 'ETB'],
    ['FI', 'EUR'],
    ['FR', 'EUR'],
    ['DE', 'EUR'],
    ['GH', 'GHS'],
    ['GR', 'EUR'],
    ['HU', 'EUR'],
    ['IN', 'INR'],
    ['IE', 'EUR'],
    ['IT', 'EUR'],
    ['KE', 'KES'],
    ['LV', 'EUR'],
    ['LS', 'LSL'],
    ['LT', 'EUR'],
    ['LU', 'EUR'],
    ['MW', 'MWK'],
    ['MY', 'MYR'],
    ['MT', 'EUR'],
    ['MA', 'MAD'],
    ['MZ', 'MZN'],
    ['NL', 'EUR'],
    ['NG', 'NGN'],
    ['PK', 'PKR'],
    ['PH', 'PHP'],
    ['PL', 'EUR'],
    ['PT', 'EUR'],
    ['RO', 'EUR'],
    ['RW', 'RWF'],
    ['SK', 'EUR'],
    ['SI', 'EUR'],
    ['SO', 'USD'],
    ['ZA', 'ZAR'],
    ['ES', 'EUR'],
    ['SE', 'EUR'],
    ['TZ', 'TZS'],
    ['TH', 'THB'],
    ['TR', 'TRY'],
    ['UG', 'UGX'],
    ['AE', 'AED'],
    ['GB', 'GBP'],
    ['US', 'USD'],
    ['ZM', 'ZMW'],
    ['ZW', 'USD'],
    ['ZW', 'ZAR'],
];
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.MUKURU_SOURCE_COUNTRIES) {
        for (const [destCountry, destCurrency] of MUKURU_DESTINATION_PAIRS) {
            if (source.code === destCountry)
                continue;
            corridorSet.add(`${source.code}-${destCountry}-${source.currency}-${destCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.MUKURU_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.MUKURU_B2B_CORRIDORS = [...exports.MUKURU_SUPPORTED_CORRIDORS];
