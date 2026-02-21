"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENDWAVE_B2B_CORRIDORS = exports.SENDWAVE_SUPPORTED_CORRIDORS = exports.SENDWAVE_DESTINATION_COUNTRIES = exports.SENDWAVE_SOURCE_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
exports.SENDWAVE_SOURCE_COUNTRIES = [
    'BE',
    'CA',
    'FR',
    'DE',
    'IE',
    'IT',
    'PT',
    'ES',
    'GB',
    'US',
];
const SENDWAVE_DESTINATION_PAIRS = [
    ['BD', 'BDT'],
    ['BJ', 'XOF'],
    ['BF', 'XOF'],
    ['CM', 'XAF'],
    ['CO', 'COP'],
    ['CD', 'USD'],
    ['CG', 'XAF'],
    ['CI', 'XOF'],
    ['DO', 'DOP'],
    ['DO', 'USD'],
    ['SV', 'USD'],
    ['FJ', 'FJD'],
    ['GM', 'GMD'],
    ['GH', 'GHS'],
    ['GT', 'GTQ'],
    ['GN', 'GNF'],
    ['HT', 'HTG'],
    ['HT', 'USD'],
    ['IN', 'INR'],
    ['ID', 'IDR'],
    ['KE', 'KES'],
    ['LB', 'USD'],
    ['MG', 'MGA'],
    ['MW', 'MWK'],
    ['MY', 'MYR'],
    ['ML', 'XOF'],
    ['MX', 'MXN'],
    ['MA', 'MAD'],
    ['MZ', 'MZN'],
    ['NP', 'NPR'],
    ['NI', 'USD'],
    ['NG', 'NGN'],
    ['PK', 'PKR'],
    ['PE', 'USD'],
    ['PH', 'PHP'],
    ['RW', 'RWF'],
    ['SN', 'XOF'],
    ['ZA', 'ZAR'],
    ['TZ', 'TZS'],
    ['TH', 'THB'],
    ['TG', 'XOF'],
    ['TN', 'TND'],
    ['UG', 'UGX'],
    ['VN', 'VND'],
    ['VN', 'USD'],
    ['ZM', 'ZMW'],
    ['ZW', 'USD'],
];
exports.SENDWAVE_DESTINATION_COUNTRIES = Array.from(new Set(SENDWAVE_DESTINATION_PAIRS.map(([country]) => country)));
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.SENDWAVE_SOURCE_COUNTRIES) {
        const sourceCurrency = currencyByCountry.get(source);
        if (!sourceCurrency)
            continue;
        for (const [destCountry, destCurrency] of SENDWAVE_DESTINATION_PAIRS) {
            if (source === destCountry)
                continue;
            corridorSet.add(`${source}-${destCountry}-${sourceCurrency}-${destCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.SENDWAVE_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.SENDWAVE_B2B_CORRIDORS = [...exports.SENDWAVE_SUPPORTED_CORRIDORS];
