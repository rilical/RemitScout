"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutMethods = exports.payinMethods = exports.codeMaps = exports.corridorSource = exports.corridors = exports.defaultPayoutMethod = exports.defaultPayinMethod = exports.amountBuckets = exports.sourceCountries = exports.destinationCountries = void 0;
const amount_bucket_1 = require("../../../../shared/amount-bucket");
const supported_corridors_1 = require("./supported-corridors");
const code_map_1 = require("./code-map");
exports.destinationCountries = supported_corridors_1.ALANSARI_DESTINATION_COUNTRIES;
exports.sourceCountries = supported_corridors_1.ALANSARI_SOURCE_COUNTRIES;
exports.amountBuckets = amount_bucket_1.DEFAULT_AMOUNT_BUCKETS;
exports.defaultPayinMethod = 'bank_transfer';
exports.defaultPayoutMethod = 'bank_deposit';
exports.corridors = supported_corridors_1.ALANSARI_SUPPORTED_CORRIDORS;
exports.corridorSource = 'provider_corridor_capability';
exports.codeMaps = {
    payinMethodMap: code_map_1.mapPayinMethod,
    payoutMethodMap: code_map_1.mapPayoutMethod,
};
exports.payinMethods = [
    'bank_transfer',
];
exports.payoutMethods = [
    'bank_deposit',
    'cash_pickup',
];
