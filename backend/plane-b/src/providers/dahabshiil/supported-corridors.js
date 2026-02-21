"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAHABSHIIL_B2B_CORRIDORS = exports.DAHABSHIIL_SUPPORTED_CORRIDORS = exports.DAHABSHIIL_SOURCE_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
exports.DAHABSHIIL_SOURCE_COUNTRIES = [
    'US',
    'GB',
    'HR',
    'GR',
    'AT',
    'BG',
    'FI',
    'ES',
    'BE',
    'NL',
    'DE',
    'NO',
    'DK',
    'SE',
    'IT',
    'IE',
    'FR',
    'CH',
    'PT',
    'CA',
];
const DAHABSHIIL_DESTINATION_COUNTRIES = [
    'SO',
    'KE',
    'AU',
    'BH',
    'CA',
    'DJ',
    'EG',
    'ER',
    'FI',
    'FR',
    'IE',
    'IT',
    'KW',
    'MY',
    'MR',
    'NP',
    'NZ',
    'QA',
    'RW',
    'SA',
    'SS',
    'SD',
    'SE',
    'TR',
    'AE',
    'UG',
    'GB',
    'YE',
    'CD',
    'NL',
    'BI',
    'GM',
    'MA',
];
const DAHABSHIIL_DESTINATION_OVERRIDES = [
    ['KE', 'USD'],
    ['SO', 'USD'],
    ['SD', 'USD'],
    ['DJ', 'USD'],
    ['UG', 'USD'],
];
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const buildDestinationPairs = () => {
    const pairs = new Map();
    for (const country of DAHABSHIIL_DESTINATION_COUNTRIES) {
        const currency = currencyByCountry.get(country);
        if (!currency)
            continue;
        pairs.set(`${country}:${currency}`, [country, currency]);
    }
    for (const [country, currency] of DAHABSHIIL_DESTINATION_OVERRIDES) {
        pairs.set(`${country}:${currency}`, [country, currency]);
    }
    return Array.from(pairs.values());
};
const DAHABSHIIL_DESTINATION_PAIRS = buildDestinationPairs();
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.DAHABSHIIL_SOURCE_COUNTRIES) {
        const sourceCurrency = currencyByCountry.get(source);
        if (!sourceCurrency)
            continue;
        for (const [destCountry, destCurrency] of DAHABSHIIL_DESTINATION_PAIRS) {
            if (source === destCountry)
                continue;
            corridorSet.add(`${source}-${destCountry}-${sourceCurrency}-${destCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.DAHABSHIIL_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.DAHABSHIIL_B2B_CORRIDORS = [...exports.DAHABSHIIL_SUPPORTED_CORRIDORS];
