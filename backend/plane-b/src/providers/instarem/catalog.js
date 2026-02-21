"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethods = exports.payinMethods = exports.codeMaps = exports.corridorSource = exports.corridors = exports.defaultPayoutMethod = exports.defaultPayinMethod = exports.amountBuckets = exports.sourceCountries = exports.destinationCountries = void 0;
const amount_bucket_1 = require("../../../../shared/amount-bucket");
const supported_corridors_1 = require("./supported-corridors");
const code_map_1 = require("./code-map");
exports.destinationCountries = supported_corridors_1.INSTAREM_DESTINATION_COUNTRIES;
exports.sourceCountries = supported_corridors_1.INSTAREM_SOURCE_COUNTRIES;
exports.amountBuckets = amount_bucket_1.DEFAULT_AMOUNT_BUCKETS;
exports.defaultPayinMethod = 'bank_transfer';
exports.defaultPayoutMethod = 'bank_deposit';
exports.corridors = supported_corridors_1.INSTAREM_SUPPORTED_CORRIDORS;
exports.corridorSource = 'provider_corridor_capability';
exports.codeMaps = {
    payinMethodMap: code_map_1.payinMethodMap,
    payoutMethodMap: code_map_1.payoutMethodMap,
};
exports.payinMethods = [
    'bank_transfer',
    'debit_card',
    'credit_card',
    'apple_pay',
    'google_pay',
];
exports.payoutMethods = [
    'bank_deposit',
];
