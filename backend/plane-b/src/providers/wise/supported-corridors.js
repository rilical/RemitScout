"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WISE_B2B_CORRIDORS = exports.WISE_SUPPORTED_CORRIDORS = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
const provider_currencies_1 = require("../../../../shared/provider-currencies");
// Wise uses provider-specific currency lists extracted from their currency selectors.
// This approach differs from other providers (Remitly, WorldRemit, etc.) which use
// BASE_SEND_CURRENCIES (USD/EUR/GBP) + local currencies.
const DEFAULT_COUNTRY_BY_CURRENCY = {
    USD: 'US',
    EUR: 'DE',
    GBP: 'GB',
    AUD: 'AU',
    CAD: 'CA',
    NZD: 'NZ',
    SGD: 'SG',
    HKD: 'HK',
};
const buildCurrencyCountryIndex = () => {
    const map = new Map();
    for (const country of countries_currencies_1.COUNTRIES) {
        const list = map.get(country.currency) ?? [];
        list.push(country.code);
        map.set(country.currency, list);
    }
    return map;
};
const currencyCountries = buildCurrencyCountryIndex();
const buildCountryCurrencyPairs = (currencies) => {
    const pairs = [];
    for (const currency of currencies) {
        const countries = currencyCountries.get(currency) ?? [];
        if (countries.length === 0) {
            const fallback = DEFAULT_COUNTRY_BY_CURRENCY[currency];
            if (fallback) {
                pairs.push([fallback, currency]);
            }
            continue;
        }
        for (const country of countries) {
            pairs.push([country, currency]);
        }
    }
    return pairs;
};
const FROM_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs(provider_currencies_1.WISE_SOURCE_CURRENCIES);
const TO_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs(provider_currencies_1.WISE_DESTINATION_CURRENCIES);
const buildSupportedCorridors = () => {
    const corridors = [];
    for (const [fromCountry, fromCurrency] of FROM_COUNTRIES_WITH_CURRENCIES) {
        for (const [toCountry, toCurrency] of TO_COUNTRIES_WITH_CURRENCIES) {
            if (fromCountry === toCountry)
                continue;
            corridors.push(`${fromCountry}-${toCountry}-${fromCurrency}-${toCurrency}`);
        }
    }
    return corridors;
};
exports.WISE_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.WISE_B2B_CORRIDORS = [...exports.WISE_SUPPORTED_CORRIDORS];
