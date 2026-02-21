"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORLDREMIT_B2B_CORRIDORS = exports.WORLDREMIT_SUPPORTED_CORRIDORS = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const ALL_COUNTRIES = countries_currencies_1.COUNTRIES.map((country) => country.code);
const BASE_SEND_CURRENCIES = ['USD', 'EUR', 'GBP'];
const BASE_RECEIVE_CURRENCIES = ['USD', 'EUR', 'GBP'];
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
    for (const source of ALL_COUNTRIES) {
        for (const destination of ALL_COUNTRIES) {
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
    for (const source of ALL_COUNTRIES) {
        for (const destination of ALL_COUNTRIES) {
            const corridorId = buildLocalCurrencyCorridorId(source, destination);
            if (corridorId) {
                corridorSet.add(corridorId);
            }
        }
    }
    return Array.from(corridorSet);
};
exports.WORLDREMIT_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.WORLDREMIT_B2B_CORRIDORS = buildB2bCorridors();
