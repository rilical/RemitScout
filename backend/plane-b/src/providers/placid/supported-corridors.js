"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLACID_B2B_CORRIDORS = exports.PLACID_SUPPORTED_CORRIDORS = exports.PLACID_SOURCE_COUNTRIES = exports.PLACID_DESTINATION_CURRENCY_BY_COUNTRY = exports.PLACID_DESTINATION_COUNTRY_BY_CURRENCY = exports.PLACID_DESTINATION_BY_CODE = exports.PLACID_DESTINATION_BY_COUNTRY = exports.PLACID_CODE_BY_COUNTRY = exports.PLACID_DESTINATION_CURRENCIES = exports.PLACID_DESTINATION_COUNTRIES = exports.PLACID_DESTINATIONS = exports.PLACID_SOURCE_CURRENCIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
const normalizeCountry = (value) => value.trim().toUpperCase();
exports.PLACID_SOURCE_CURRENCIES = ['USD'];
exports.PLACID_DESTINATIONS = [
    { placidCode: 'BAN', country: 'BD', currency: 'BDT', name: 'Bangladesh' },
    { placidCode: 'GHA', country: 'GH', currency: 'GHS', name: 'Ghana' },
    { placidCode: 'IND', country: 'IN', currency: 'INR', name: 'India' },
    { placidCode: 'KEN', country: 'KE', currency: 'KES', name: 'Kenya' },
    { placidCode: 'NEP', country: 'NP', currency: 'NPR', name: 'Nepal' },
    { placidCode: 'PAK', country: 'PK', currency: 'PKR', name: 'Pakistan' },
    { placidCode: 'PHX', country: 'PH', currency: 'PHP', name: 'Philippines' },
    { placidCode: 'SEN', country: 'SN', currency: 'XOF', name: 'Senegal' },
    { placidCode: 'SLK', country: 'LK', currency: 'LKR', name: 'Sri Lanka' },
    { placidCode: 'THA', country: 'TH', currency: 'THB', name: 'Thailand' },
    { placidCode: 'VNM', country: 'VN', currency: 'VND', name: 'Vietnam' },
];
exports.PLACID_DESTINATION_COUNTRIES = exports.PLACID_DESTINATIONS
    .map((entry) => entry.country)
    .sort();
exports.PLACID_DESTINATION_CURRENCIES = exports.PLACID_DESTINATIONS
    .map((entry) => entry.currency)
    .sort();
exports.PLACID_CODE_BY_COUNTRY = Object.fromEntries(exports.PLACID_DESTINATIONS.map((entry) => [entry.country, entry.placidCode]));
exports.PLACID_DESTINATION_BY_COUNTRY = Object.fromEntries(exports.PLACID_DESTINATIONS.map((entry) => [entry.country, entry]));
exports.PLACID_DESTINATION_BY_CODE = Object.fromEntries(exports.PLACID_DESTINATIONS.map((entry) => [entry.placidCode, entry]));
exports.PLACID_DESTINATION_COUNTRY_BY_CURRENCY = Object.fromEntries(exports.PLACID_DESTINATIONS.map((entry) => [entry.currency, entry.country]));
exports.PLACID_DESTINATION_CURRENCY_BY_COUNTRY = Object.fromEntries(exports.PLACID_DESTINATIONS.map((entry) => [entry.country, entry.currency]));
const buildSourceCountries = () => {
    const countries = new Set();
    for (const entry of countries_currencies_1.COUNTRIES) {
        const code = normalizeCountry(entry.code);
        if (code.length === 2) {
            countries.add(code);
        }
    }
    return Array.from(countries).sort();
};
exports.PLACID_SOURCE_COUNTRIES = buildSourceCountries();
const buildSupportedCorridors = () => {
    const corridors = new Set();
    const sourceCurrency = exports.PLACID_SOURCE_CURRENCIES[0];
    for (const sourceCountry of exports.PLACID_SOURCE_COUNTRIES) {
        for (const destination of exports.PLACID_DESTINATIONS) {
            if (sourceCountry === destination.country)
                continue;
            corridors.add(`${sourceCountry}-${destination.country}-${sourceCurrency}-${destination.currency}`);
        }
    }
    return Array.from(corridors);
};
exports.PLACID_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.PLACID_B2B_CORRIDORS = exports.PLACID_SUPPORTED_CORRIDORS;
