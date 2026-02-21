"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMITBEE_B2B_CORRIDORS = exports.REMITBEE_SUPPORTED_CORRIDORS = exports.REMITBEE_DESTINATION_COUNTRIES = exports.REMITBEE_DESTINATION_CURRENCY_OPTIONS = exports.REMITBEE_SOURCE_COUNTRIES = void 0;
const code_map_1 = require("./code-map");
const normalizeIso2 = (value) => value.trim().toUpperCase();
exports.REMITBEE_SOURCE_COUNTRIES = ['CA'];
exports.REMITBEE_DESTINATION_CURRENCY_OPTIONS = {
    IN: ['INR'],
    PH: ['PHP'],
    LK: ['LKR'],
    AR: ['ARS'],
    BJ: ['XOF'],
    BW: ['BWP'],
    CM: ['XAF'],
    CL: ['CLP'],
    CO: ['COP'],
    CR: ['CRC', 'USD'],
    CI: ['XOF'],
    DO: ['DOP', 'USD'],
    EC: ['USD'],
    SV: ['USD'],
    GH: ['GHS'],
    GT: ['GTQ', 'USD'],
    HT: ['USD'],
    HN: ['HNL', 'USD'],
    ID: ['IDR'],
    JM: ['JMD', 'USD'],
    JO: ['JOD'],
    KE: ['KES'],
    PE: ['PEN', 'USD'],
    RO: ['RON'],
    SN: ['XOF'],
    KR: ['KRW'],
    TG: ['XOF'],
    UG: ['UGX'],
    UA: ['UAH', 'USD'],
    UY: ['USD', 'UYU'],
    ZM: ['ZMW'],
};
exports.REMITBEE_DESTINATION_COUNTRIES = Object.keys(exports.REMITBEE_DESTINATION_CURRENCY_OPTIONS)
    .map(normalizeIso2)
    .filter((value) => value !== 'CA' && code_map_1.remitbeeCountryByIso2.has(value))
    .sort();
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const destination of exports.REMITBEE_DESTINATION_COUNTRIES) {
        if (!code_map_1.remitbeeCountryByIso2.has(destination))
            continue;
        const currencies = exports.REMITBEE_DESTINATION_CURRENCY_OPTIONS[destination] ?? [];
        for (const currency of currencies) {
            corridorSet.add(`CA-${destination}-CAD-${currency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.REMITBEE_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.REMITBEE_B2B_CORRIDORS = exports.REMITBEE_SUPPORTED_CORRIDORS;
