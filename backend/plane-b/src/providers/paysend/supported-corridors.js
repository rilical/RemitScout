"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYSEND_B2B_CORRIDORS = exports.PAYSEND_SUPPORTED_CORRIDORS = exports.PAYSEND_DESTINATION_COUNTRIES = exports.PAYSEND_SOURCE_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
const uniqPairs = (pairs) => {
    const map = new Map();
    for (const pair of pairs) {
        map.set(`${pair[0]}:${pair[1]}`, pair);
    }
    return Array.from(map.values());
};
const SOURCE_COUNTRY_CODES = [
    'AD',
    'AU',
    'AT',
    'BE',
    'BR',
    'BG',
    'CA',
    'CL',
    'CO',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IS',
    'IE',
    'IL',
    'IT',
    'KZ',
    'KW',
    'LV',
    'LI',
    'LT',
    'LU',
    'MT',
    'MX',
    'MD',
    'ME',
    'NL',
    'MK',
    'NO',
    'PE',
    'PL',
    'PT',
    'RO',
    'SM',
    'RS',
    'SK',
    'SI',
    'ES',
    'SE',
    'CH',
    'GB',
    'US',
    'UZ',
];
const DESTINATION_COUNTRY_CODES = [
    'US',
    'MX',
    'GB',
    'UK',
    'CA',
    'DE',
    'FR',
    'ES',
    'IT',
    'AD',
    'JM',
    'AU',
    'AT',
    'BE',
    'BR',
    'BG',
    'CL',
    'CO',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'GR',
    'HU',
    'IS',
    'IE',
    'IL',
    'KZ',
    'KW',
    'LV',
    'LI',
    'LT',
    'LU',
    'MT',
    'MD',
    'ME',
    'NL',
    'MK',
    'NO',
    'PE',
    'PL',
    'PT',
    'RO',
    'SM',
    'RS',
    'SK',
    'SI',
    'SE',
    'CH',
    'UZ',
    'DZ',
    'AR',
    'AM',
    'AZ',
    'BD',
    'BZ',
    'BJ',
    'BT',
    'BO',
    'BW',
    'BI',
    'CM',
    'CV',
    'CN',
    'CR',
    'DJ',
    'DM',
    'DO',
    'EC',
    'EG',
    'SV',
    'FJ',
    'GM',
    'GE',
    'GH',
    'GT',
    'GN',
    'GY',
    'HN',
    'HK',
    'IN',
    'ID',
    'JP',
    'JO',
    'KE',
    'KG',
    'MG',
    'MY',
    'MR',
    'MU',
    'MN',
    'MA',
    'MZ',
    'NA',
    'NP',
    'NZ',
    'NG',
    'PK',
    'PY',
    'PH',
    'QA',
    'RW',
    'SA',
    'SN',
    'SL',
    'SG',
    'ZA',
    'KR',
    'LK',
    'TJ',
    'TZ',
    'TH',
    'TG',
    'TR',
    'AE',
    'UG',
    'UA',
    'UY',
    'VN',
    'ZM',
];
const COUNTRY_CODE_ALIASES = {
    UK: 'GB',
};
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const normalizeCountryCode = (code) => {
    const normalized = code.trim().toUpperCase();
    return COUNTRY_CODE_ALIASES[normalized] ?? normalized;
};
const buildPairs = (codes) => {
    const pairs = [];
    for (const code of codes) {
        const normalized = normalizeCountryCode(code);
        const currency = currencyByCountry.get(normalized);
        if (!currency)
            continue;
        pairs.push([normalized, currency]);
    }
    return uniqPairs(pairs);
};
const SOURCE_PAIRS = buildPairs(SOURCE_COUNTRY_CODES);
const DESTINATION_PAIRS = buildPairs(DESTINATION_COUNTRY_CODES);
const buildSupportedCorridors = () => {
    const corridors = [];
    for (const [fromCountry, fromCurrency] of SOURCE_PAIRS) {
        for (const [toCountry, toCurrency] of DESTINATION_PAIRS) {
            if (fromCountry === toCountry)
                continue;
            corridors.push(`${fromCountry}-${toCountry}-${fromCurrency}-${toCurrency}`);
        }
    }
    return corridors;
};
exports.PAYSEND_SOURCE_COUNTRIES = SOURCE_PAIRS.map(([code]) => code);
exports.PAYSEND_DESTINATION_COUNTRIES = DESTINATION_PAIRS.map(([code]) => code);
exports.PAYSEND_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.PAYSEND_B2B_CORRIDORS = [...exports.PAYSEND_SUPPORTED_CORRIDORS];
