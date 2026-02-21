"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KORONAPAY_B2B_CORRIDORS = exports.KORONAPAY_SUPPORTED_CORRIDORS = exports.KORONAPAY_DESTINATION_COUNTRIES = exports.KORONAPAY_SOURCE_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
exports.KORONAPAY_SOURCE_COUNTRIES = [
    'AT',
    'BE',
    'BG',
    'CY',
    'CZ',
    'DE',
    'DK',
    'EE',
    'ES',
    'FI',
    'FR',
    'GB',
    'GR',
    'HR',
    'HU',
    'IE',
    'IS',
    'IT',
    'LI',
    'LT',
    'LU',
    'LV',
    'MT',
    'NL',
    'NO',
    'PL',
    'PT',
    'RO',
    'SE',
    'SI',
    'SK',
];
exports.KORONAPAY_DESTINATION_COUNTRIES = [
    'AE',
    'AM',
    'AT',
    'AZ',
    'BD',
    'BG',
    'BH',
    'BR',
    'BY',
    'CN',
    'CY',
    'CZ',
    'DE',
    'DK',
    'DZ',
    'EC',
    'EE',
    'ES',
    'FI',
    'FR',
    'GB',
    'GE',
    'GR',
    'HK',
    'HR',
    'HU',
    'ID',
    'IE',
    'IL',
    'IN',
    'IS',
    'IT',
    'KG',
    'KR',
    'KZ',
    'LI',
    'LT',
    'LU',
    'LV',
    'MA',
    'MN',
    'MT',
    'MX',
    'MY',
    'NL',
    'NO',
    'OM',
    'PH',
    'PL',
    'PT',
    'QA',
    'RO',
    'RS',
    'SE',
    'SG',
    'SI',
    'SK',
    'TH',
    'TJ',
    'TN',
    'TR',
    'UZ',
    'VN',
];
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const BASE_SEND_CURRENCIES = ['EUR'];
const BASE_RECEIVE_CURRENCIES = ['USD', 'EUR'];
const buildCorridorIds = (source, destination) => {
    if (source === destination)
        return [];
    const sourceCurrency = currencyByCountry.get(source);
    const destinationCurrency = currencyByCountry.get(destination);
    if (!sourceCurrency || !destinationCurrency)
        return [];
    const sendCurrencies = new Set([sourceCurrency, ...BASE_SEND_CURRENCIES]);
    const receiveCurrencies = new Set([destinationCurrency, ...BASE_RECEIVE_CURRENCIES]);
    const corridorIds = [];
    for (const sendCurrency of sendCurrencies) {
        for (const receiveCurrency of receiveCurrencies) {
            corridorIds.push(`${source}-${destination}-${sendCurrency}-${receiveCurrency}`);
        }
    }
    return corridorIds;
};
const buildLocalCurrencyCorridorId = (source, destination) => {
    if (source === destination)
        return null;
    const sourceCurrency = currencyByCountry.get(source);
    const destinationCurrency = currencyByCountry.get(destination);
    if (!sourceCurrency || !destinationCurrency)
        return null;
    return `${source}-${destination}-${sourceCurrency}-${destinationCurrency}`;
};
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.KORONAPAY_SOURCE_COUNTRIES) {
        for (const destination of exports.KORONAPAY_DESTINATION_COUNTRIES) {
            const corridorIds = buildCorridorIds(source, destination);
            for (const corridorId of corridorIds) {
                corridorSet.add(corridorId);
            }
        }
    }
    return Array.from(corridorSet);
};
const buildB2bCorridors = () => {
    const corridorSet = new Set();
    for (const source of exports.KORONAPAY_SOURCE_COUNTRIES) {
        for (const destination of exports.KORONAPAY_DESTINATION_COUNTRIES) {
            const corridorId = buildLocalCurrencyCorridorId(source, destination);
            if (corridorId) {
                corridorSet.add(corridorId);
            }
        }
    }
    return Array.from(corridorSet);
};
exports.KORONAPAY_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.KORONAPAY_B2B_CORRIDORS = buildB2bCorridors();
