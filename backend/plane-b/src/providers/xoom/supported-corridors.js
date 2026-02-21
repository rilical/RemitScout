"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XOOM_B2B_CORRIDORS = exports.XOOM_SUPPORTED_CORRIDORS = exports.XOOM_DESTINATION_COUNTRIES = exports.XOOM_SOURCE_CURRENCIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
exports.XOOM_SOURCE_CURRENCIES = ['USD', 'AUD', 'CAD', 'EUR', 'GBP'];
const DESTINATION_COUNTRY_NAMES = [
    'Mexico',
    'Philippines',
    'India',
    'United States',
    'Algeria',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahrain',
    'Bangladesh',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Costa Rica',
    'Croatia',
    'Cyprus',
    'Czech Republic',
    'Democratic Republic of the Congo',
    'Denmark',
    'Djibouti',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Eritrea',
    'Estonia',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'French Guiana',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hong Kong',
    'Hungary',
    'Iceland',
    'Indonesia',
    'Ireland',
    'Israel',
    'Italy',
    'Ivory Coast',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Liberia',
    'Lithuania',
    'Luxembourg',
    'Macedonia',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Mali',
    'Malta',
    'Martinique',
    'Mauritius',
    'Mayotte',
    'Moldova',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'Norway',
    'Oman',
    'Pakistan',
    'Panama',
    'Paraguay',
    'Peru',
    'Poland',
    'Portugal',
    'Puerto Rico',
    'Qatar',
    'Reunion',
    'Romania',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'South Africa',
    'South Korea',
    'Spain',
    'Sri Lanka',
    'Sweden',
    'Switzerland',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'Uruguay',
    'US Virgin Islands',
    'Uzbekistan',
    'Vietnam',
    'Zambia',
    'Zimbabwe',
];
const COUNTRY_NAME_ALIASES = {
    'Ivory Coast': "Cote d'Ivoire",
    'Macedonia': 'North Macedonia',
    'Democratic Republic of the Congo': 'Congo (DRC)',
};
const DEFAULT_COUNTRY_BY_CURRENCY = {
    USD: 'US',
    EUR: 'DE',
    GBP: 'GB',
    AUD: 'AU',
    CAD: 'CA',
};
const normalizeName = (value) => value.trim().toLowerCase();
const buildCountryNameIndex = () => {
    const map = new Map();
    for (const country of countries_currencies_1.COUNTRIES) {
        map.set(normalizeName(country.name), { code: country.code, currency: country.currency });
    }
    return map;
};
const countryByName = buildCountryNameIndex();
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const resolveCountry = (name) => {
    const alias = COUNTRY_NAME_ALIASES[name] ?? name;
    return countryByName.get(normalizeName(alias)) ?? null;
};
const buildDestinationCountries = () => {
    const codes = new Set();
    for (const name of DESTINATION_COUNTRY_NAMES) {
        const resolved = resolveCountry(name);
        if (!resolved)
            continue;
        codes.add(resolved.code);
    }
    return Array.from(codes);
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
const DESTINATION_COUNTRY_CODES = buildDestinationCountries();
const FROM_COUNTRIES_WITH_CURRENCIES = buildCountryCurrencyPairs([...exports.XOOM_SOURCE_CURRENCIES]);
const TO_COUNTRIES_WITH_CURRENCIES = DESTINATION_COUNTRY_CODES
    .map((code) => {
    const currency = currencyByCountry.get(code);
    if (!currency)
        return null;
    return [code, currency];
})
    .filter((pair) => Boolean(pair));
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
exports.XOOM_DESTINATION_COUNTRIES = DESTINATION_COUNTRY_CODES;
exports.XOOM_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.XOOM_B2B_CORRIDORS = [...exports.XOOM_SUPPORTED_CORRIDORS];
