"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMITLY_B2B_CORRIDORS = exports.REMITLY_SUPPORTED_CORRIDORS = exports.REMITLY_SOURCE_COUNTRIES = exports.REMITLY_DESTINATION_COUNTRIES = void 0;
const countries_currencies_1 = require("../../../../shared/countries-currencies");
exports.REMITLY_DESTINATION_COUNTRIES = [
    'AD',
    'AE',
    'AG',
    'AI',
    'AL',
    'AM',
    'AO',
    'AR',
    'AT',
    'AU',
    'AZ',
    'BA',
    'BB',
    'BD',
    'BE',
    'BF',
    'BG',
    'BH',
    'BI',
    'BJ',
    'BM',
    'BN',
    'BO',
    'BR',
    'BS',
    'BT',
    'BW',
    'BZ',
    'CA',
    'CD',
    'CG',
    'CH',
    'CI',
    'CL',
    'CM',
    'CN',
    'CO',
    'CR',
    'CV',
    'CZ',
    'DE',
    'DJ',
    'DM',
    'DO',
    'DZ',
    'EC',
    'EE',
    'EG',
    'ER',
    'ES',
    'ET',
    'FI',
    'FJ',
    'FR',
    'GA',
    'GE',
    'GH',
    'GI',
    'GM',
    'GN',
    'GQ',
    'GR',
    'GT',
    'GW',
    'GY',
    'HK',
    'HN',
    'HR',
    'HT',
    'HU',
    'ID',
    'IE',
    'IL',
    'IN',
    'IS',
    'IT',
    'JM',
    'JO',
    'JP',
    'KE',
    'KG',
    'KH',
    'KI',
    'KM',
    'KN',
    'KR',
    'KW',
    'KY',
    'KZ',
    'LA',
    'LB',
    'LC',
    'LI',
    'LK',
    'LR',
    'LS',
    'LT',
    'LU',
    'LV',
    'MA',
    'MC',
    'MD',
    'ME',
    'MG',
    'MK',
    'ML',
    'MM',
    'MN',
    'MO',
    'MR',
    'MT',
    'MU',
    'MV',
    'MW',
    'MX',
    'MY',
    'MZ',
    'NA',
    'NE',
    'NG',
    'NI',
    'NL',
    'NP',
    'OM',
    'PA',
    'PE',
    'PG',
    'PH',
    'PK',
    'PL',
    'PR',
    'PT',
    'PY',
    'QA',
    'RO',
    'RS',
    'RW',
    'SA',
    'SB',
    'SC',
    'SG',
    'SI',
    'SK',
    'SL',
    'SM',
    'SN',
    'SO',
    'SR',
    'SS',
    'SV',
    'TC',
    'TG',
    'TH',
    'TJ',
    'TL',
    'TM',
    'TN',
    'TO',
    'TR',
    'TT',
    'TZ',
    'UA',
    'UG',
    'GB',
    'US',
    'UY',
    'UZ',
    'VE',
    'VN',
    'VU',
    'WS',
    'XK',
    'ZA',
    'ZM',
    'ZW',
];
exports.REMITLY_SOURCE_COUNTRIES = [
    'AE',
    'AT',
    'AU',
    'BE',
    'CA',
    'CY',
    'CZ',
    'DE',
    'DK',
    'ES',
    'FI',
    'FR',
    'GB',
    'GR',
    'IE',
    'IT',
    'LI',
    'LT',
    'LV',
    'MT',
    'NL',
    'NO',
    'NZ',
    'PL',
    'PT',
    'RO',
    'SE',
    'SG',
    'SK',
    'US',
];
const currencyByCountry = new Map(countries_currencies_1.COUNTRIES.map(country => [country.code, country.currency]));
const BASE_SEND_CURRENCIES = ['USD', 'EUR', 'GBP'];
const buildCorridorIds = (source, destination) => {
    if (source === destination)
        return [];
    const sourceCurrency = currencyByCountry.get(source);
    const destinationCurrency = currencyByCountry.get(destination);
    if (!sourceCurrency || !destinationCurrency)
        return [];
    const sendCurrencies = new Set([sourceCurrency, ...BASE_SEND_CURRENCIES]);
    const corridorIds = [];
    for (const sendCurrency of sendCurrencies) {
        corridorIds.push(`${source}-${destination}-${sendCurrency}-${destinationCurrency}`);
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
    for (const source of exports.REMITLY_SOURCE_COUNTRIES) {
        for (const destination of exports.REMITLY_DESTINATION_COUNTRIES) {
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
    for (const source of exports.REMITLY_SOURCE_COUNTRIES) {
        for (const destination of exports.REMITLY_DESTINATION_COUNTRIES) {
            const corridorId = buildLocalCurrencyCorridorId(source, destination);
            if (corridorId) {
                corridorSet.add(corridorId);
            }
        }
    }
    return Array.from(corridorSet);
};
exports.REMITLY_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.REMITLY_B2B_CORRIDORS = buildB2bCorridors();
