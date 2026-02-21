"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPayoutMethod = exports.defaultPayinMethod = exports.payoutMethods = exports.payinMethods = exports.amountBuckets = exports.codeMaps = exports.corridorSource = exports.corridors = void 0;
const amount_bucket_1 = require("../../../../shared/amount-bucket");
const code_map_1 = require("./code-map");
const supported_corridors_1 = require("./supported-corridors");
exports.corridors = supported_corridors_1.PAYSEND_SUPPORTED_CORRIDORS;
exports.corridorSource = 'provider_corridor_capability';
exports.codeMaps = {
    countryCodeMap: code_map_1.countryCodeMap,
    currencyCodeMap: code_map_1.currencyCodeMap,
    payinMethodMap: code_map_1.payinMethodMap,
    payoutMethodMap: code_map_1.payoutMethodMap,
};
exports.amountBuckets = amount_bucket_1.DEFAULT_AMOUNT_BUCKETS;
exports.payinMethods = ['debit_card', 'credit_card', 'bank_transfer'];
exports.payoutMethods = ['bank_deposit', 'debit_card'];
exports.defaultPayinMethod = 'debit_card';
exports.defaultPayoutMethod = 'bank_deposit';
