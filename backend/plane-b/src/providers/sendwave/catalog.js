"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethods = exports.payinMethods = exports.codeMaps = exports.defaultPayoutMethod = exports.defaultPayinMethod = exports.amountBuckets = exports.corridorSource = exports.corridors = exports.sourceCountries = void 0;
const amount_bucket_1 = require("../../../../shared/amount-bucket");
const supported_corridors_1 = require("./supported-corridors");
const code_map_1 = require("./code-map");
exports.sourceCountries = supported_corridors_1.SENDWAVE_SOURCE_COUNTRIES;
exports.corridors = supported_corridors_1.SENDWAVE_SUPPORTED_CORRIDORS;
exports.corridorSource = 'provider_corridor_capability';
exports.amountBuckets = amount_bucket_1.DEFAULT_AMOUNT_BUCKETS;
exports.defaultPayinMethod = 'debit_card';
exports.defaultPayoutMethod = 'bank_deposit';
exports.codeMaps = {
    countryCodeMap: code_map_1.countryCodeMap,
    currencyCodeMap: code_map_1.currencyCodeMap,
    payinMethodMap: code_map_1.payinMethodMap,
    payoutMethodMap: code_map_1.payoutMethodMap,
};
exports.payinMethods = [
    'debit_card',
];
exports.payoutMethods = [
    'bank_deposit',
    'cash_pickup',
    'mobile_wallet',
];
