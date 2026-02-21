"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOSSMONEY_B2B_CORRIDORS = exports.BOSSMONEY_SUPPORTED_CORRIDORS = exports.BOSSMONEY_DESTINATION_CURRENCY_OPTIONS = exports.BOSSMONEY_DESTINATION_COUNTRIES = exports.BOSSMONEY_SOURCE_COUNTRIES = exports.BOSSMONEY_DESTINATION_PAIRS = exports.BOSSMONEY_SOURCE_PAIRS = void 0;
exports.BOSSMONEY_SOURCE_PAIRS = [
    ['US', 'USD'],
    ['CA', 'CAD'],
    ['AU', 'AUD'],
];
exports.BOSSMONEY_DESTINATION_PAIRS = [
    ['GN', 'GNF'],
    ['BD', 'BDT'],
    ['BJ', 'XOF'],
    ['BO', 'BOB'],
    ['BO', 'USD'],
    ['BR', 'BRL'],
    ['BF', 'XOF'],
    ['CM', 'XAF'],
    ['CO', 'COP'],
    ['CR', 'CRC'],
    ['CR', 'USD'],
    ['CD', 'USD'],
    ['DO', 'DOP'],
    ['DO', 'USD'],
    ['EC', 'USD'],
    ['SV', 'USD'],
    ['ER', 'ERN'],
    ['ET', 'ETB'],
    ['FR', 'EUR'],
    ['DE', 'EUR'],
    ['GH', 'GHS'],
    ['GM', 'GMD'],
    ['GR', 'EUR'],
    ['GT', 'GTQ'],
    ['GT', 'USD'],
    ['HT', 'HTG'],
    ['HT', 'USD'],
    ['HN', 'HNL'],
    ['HN', 'USD'],
    ['IN', 'INR'],
    ['IE', 'EUR'],
    ['IT', 'EUR'],
    ['CI', 'XOF'],
    ['JM', 'JMD'],
    ['KE', 'KES'],
    ['LR', 'USD'],
    ['MG', 'MGA'],
    ['MW', 'MWK'],
    ['MX', 'MXN'],
    ['MZ', 'MZN'],
    ['NP', 'NPR'],
    ['NL', 'EUR'],
    ['NI', 'USD'],
    ['NG', 'NGN'],
    ['PA', 'USD'],
    ['PE', 'PEN'],
    ['PE', 'USD'],
    ['PH', 'PHP'],
    ['PK', 'PKR'],
    ['PT', 'EUR'],
    ['RW', 'RWF'],
    ['SN', 'XOF'],
    ['SL', 'SLE'],
    ['ES', 'EUR'],
    ['TG', 'XOF'],
    ['UG', 'UGX'],
    ['GB', 'GBP'],
    ['VE', 'VES'],
    ['ZW', 'USD'],
];
exports.BOSSMONEY_SOURCE_COUNTRIES = Array.from(new Set(exports.BOSSMONEY_SOURCE_PAIRS.map(([country]) => country))).sort();
exports.BOSSMONEY_DESTINATION_COUNTRIES = Array.from(new Set(exports.BOSSMONEY_DESTINATION_PAIRS.map(([country]) => country))).sort();
exports.BOSSMONEY_DESTINATION_CURRENCY_OPTIONS = exports.BOSSMONEY_DESTINATION_PAIRS
    .reduce((acc, [country, currency]) => {
    if (!acc[country]) {
        acc[country] = [];
    }
    if (!acc[country].includes(currency)) {
        acc[country].push(currency);
    }
    return acc;
}, {});
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const [sourceCountry, sourceCurrency] of exports.BOSSMONEY_SOURCE_PAIRS) {
        for (const [destCountry, destCurrency] of exports.BOSSMONEY_DESTINATION_PAIRS) {
            if (sourceCountry === destCountry)
                continue;
            corridorSet.add(`${sourceCountry}-${destCountry}-${sourceCurrency}-${destCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.BOSSMONEY_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.BOSSMONEY_B2B_CORRIDORS = [...exports.BOSSMONEY_SUPPORTED_CORRIDORS];
