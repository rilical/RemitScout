"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SINGX_B2B_CORRIDORS = exports.SINGX_SUPPORTED_CORRIDORS = exports.SINGX_DESTINATION_COUNTRIES = exports.SINGX_SOURCE_COUNTRIES = exports.SINGX_DESTINATION_COUNTRY_BY_CURRENCY = exports.SINGX_DESTINATION_CURRENCIES_BY_SOURCE = exports.SINGX_SOURCE_COUNTRY_BY_CURRENCY = exports.SINGX_SOURCE_CURRENCIES = void 0;
const normalizeCurrency = (value) => value.trim().toUpperCase();
exports.SINGX_SOURCE_CURRENCIES = ['SGD', 'USD'];
exports.SINGX_SOURCE_COUNTRY_BY_CURRENCY = {
    SGD: 'SG',
    USD: 'US',
};
exports.SINGX_DESTINATION_CURRENCIES_BY_SOURCE = {
    SGD: [
        'PLN',
        'PKR',
        'UGX',
        'RWF',
        'BDT',
        'GBP',
        'BHD',
        'USD',
        'XAF',
        'EUR',
        'LKR',
        'DKK',
        'THB',
        'SEK',
        'ETB',
        'EGP',
        'MMK',
        'NPR',
        'NOK',
        'CHF',
        'ZMW',
        'IDR',
        'ZAR',
        'VND',
        'CAD',
        'KRW',
        'HKD',
        'TRY',
        'CZK',
        'AED',
        'NGN',
        'KES',
        'CNY',
        'SGD',
        'AUD',
        'MYR',
        'SLE',
        'SAR',
        'NZD',
        'KWD',
        'XOF',
        'JPY',
        'PHP',
        'MWK',
        'OMR',
        'QAR',
        'TWD',
        'HUF',
        'ILS',
        'INR',
        'RON',
    ],
    USD: [
        'PLN',
        'PKR',
        'UGX',
        'BDT',
        'GBP',
        'BHD',
        'USD',
        'XAF',
        'LKR',
        'EUR',
        'DKK',
        'THB',
        'SEK',
        'ETB',
        'EGP',
        'MMK',
        'NPR',
        'NOK',
        'CHF',
        'IDR',
        'ZAR',
        'VND',
        'CAD',
        'KRW',
        'HKD',
        'TRY',
        'CZK',
        'AED',
        'NGN',
        'KES',
        'CNY',
        'SGD',
        'AUD',
        'MYR',
        'SLE',
        'SAR',
        'NZD',
        'KWD',
        'XOF',
        'JPY',
        'PHP',
        'MWK',
        'OMR',
        'QAR',
        'TWD',
        'HUF',
        'ILS',
        'INR',
        'RON',
    ],
};
exports.SINGX_DESTINATION_COUNTRY_BY_CURRENCY = {
    PLN: 'PL',
    PKR: 'PK',
    UGX: 'UG',
    RWF: 'RW',
    BDT: 'BD',
    GBP: 'GB',
    BHD: 'BH',
    USD: 'US',
    XAF: 'CM',
    EUR: 'DE',
    LKR: 'LK',
    DKK: 'DK',
    THB: 'TH',
    SEK: 'SE',
    ETB: 'ET',
    EGP: 'EG',
    MMK: 'MM',
    NPR: 'NP',
    NOK: 'NO',
    CHF: 'CH',
    ZMW: 'ZM',
    IDR: 'ID',
    ZAR: 'ZA',
    VND: 'VN',
    CAD: 'CA',
    KRW: 'KR',
    HKD: 'HK',
    TRY: 'TR',
    CZK: 'CZ',
    AED: 'AE',
    NGN: 'NG',
    KES: 'KE',
    CNY: 'CN',
    SGD: 'SG',
    AUD: 'AU',
    MYR: 'MY',
    SLE: 'SL',
    SAR: 'SA',
    NZD: 'NZ',
    KWD: 'KW',
    XOF: 'SN',
    JPY: 'JP',
    PHP: 'PH',
    MWK: 'MW',
    OMR: 'OM',
    QAR: 'QA',
    TWD: 'TW',
    HUF: 'HU',
    ILS: 'IL',
    INR: 'IN',
    RON: 'RO',
};
const buildDestinationCurrencySet = () => {
    const currencies = new Set();
    for (const list of Object.values(exports.SINGX_DESTINATION_CURRENCIES_BY_SOURCE)) {
        for (const currency of list) {
            currencies.add(normalizeCurrency(currency));
        }
    }
    return currencies;
};
const buildDestinationCountries = () => {
    const countries = new Set();
    for (const currency of buildDestinationCurrencySet()) {
        const country = exports.SINGX_DESTINATION_COUNTRY_BY_CURRENCY[currency];
        if (country)
            countries.add(country);
    }
    return Array.from(countries).sort();
};
exports.SINGX_SOURCE_COUNTRIES = Object.values(exports.SINGX_SOURCE_COUNTRY_BY_CURRENCY)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length === 2);
exports.SINGX_DESTINATION_COUNTRIES = buildDestinationCountries();
const buildSupportedCorridors = () => {
    const corridors = new Set();
    for (const [sourceCurrency, destinations] of Object.entries(exports.SINGX_DESTINATION_CURRENCIES_BY_SOURCE)) {
        const normalizedSourceCurrency = normalizeCurrency(sourceCurrency);
        const sourceCountry = exports.SINGX_SOURCE_COUNTRY_BY_CURRENCY[normalizedSourceCurrency];
        if (!sourceCountry)
            continue;
        for (const destinationCurrency of destinations) {
            const normalizedDestCurrency = normalizeCurrency(destinationCurrency);
            const destCountry = exports.SINGX_DESTINATION_COUNTRY_BY_CURRENCY[normalizedDestCurrency];
            if (!destCountry)
                continue;
            if (destCountry === sourceCountry)
                continue;
            corridors.add(`${sourceCountry}-${destCountry}-${normalizedSourceCurrency}-${normalizedDestCurrency}`);
        }
    }
    return Array.from(corridors);
};
exports.SINGX_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.SINGX_B2B_CORRIDORS = exports.SINGX_SUPPORTED_CORRIDORS;
