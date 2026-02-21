"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PANGEA_B2B_CORRIDORS = exports.PANGEA_SUPPORTED_CORRIDORS = exports.PANGEA_SOURCE_COUNTRIES = exports.PANGEA_DESTINATION_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
const PANGEA_DESTINATION_PAIRS = [
    ['MX', 'MXN'],
    ['PH', 'PHP'],
    ['GT', 'GTQ'],
    ['HN', 'HNL'],
    ['CO', 'COP'],
    ['SV', 'USD'],
    ['BD', 'BDT'],
    ['BF', 'XOF'],
    ['CI', 'XOF'],
    ['DO', 'DOP'],
    ['FR', 'EUR'],
    ['DE', 'EUR'],
    ['GH', 'GHS'],
    ['IN', 'INR'],
    ['ID', 'IDR'],
    ['IT', 'EUR'],
    ['KE', 'KES'],
    ['MY', 'MYR'],
    ['NP', 'NPR'],
    ['SN', 'XOF'],
    ['SG', 'SGD'],
    ['TH', 'THB'],
    ['UG', 'UGX'],
    ['VN', 'VND'],
];
exports.PANGEA_DESTINATION_COUNTRIES = Array.from(new Set(PANGEA_DESTINATION_PAIRS.map(([country]) => country)));
const USD_SOURCE_COUNTRIES = countries_currencies_1.COUNTRIES
    .filter(country => country.currency === 'USD')
    .map(country => country.code);
exports.PANGEA_SOURCE_COUNTRIES = Array.from(new Set(USD_SOURCE_COUNTRIES)).sort();
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.PANGEA_SOURCE_COUNTRIES) {
        for (const [destCountry, destCurrency] of PANGEA_DESTINATION_PAIRS) {
            if (source === destCountry)
                continue;
            corridorSet.add(`${source}-${destCountry}-USD-${destCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.PANGEA_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.PANGEA_B2B_CORRIDORS = [...exports.PANGEA_SUPPORTED_CORRIDORS];
