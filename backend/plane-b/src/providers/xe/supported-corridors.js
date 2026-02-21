"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XE_B2B_CORRIDORS = exports.XE_SUPPORTED_CORRIDORS = void 0;
const code_map_1 = require("./code-map");
const DESTINATION_COUNTRIES = Object.keys(code_map_1.XE_COUNTRY_TO_CURRENCY);
const buildSupportedCorridors = () => {
    const corridorSet = new Set();
    for (const sourceCurrency of code_map_1.XE_COMMON_SOURCE_CURRENCIES) {
        const sourceCountry = (0, code_map_1.getSourceCountryForCurrency)(sourceCurrency);
        if (!sourceCountry)
            continue;
        for (const destination of DESTINATION_COUNTRIES) {
            if (sourceCountry === destination)
                continue;
            if (!(0, code_map_1.isXeCorridorSupported)(sourceCurrency, destination))
                continue;
            const destinationCurrency = (0, code_map_1.getXeCurrencyForCountry)(destination);
            if (!destinationCurrency)
                continue;
            corridorSet.add(`${sourceCountry}-${destination}-${sourceCurrency}-${destinationCurrency}`);
        }
    }
    return Array.from(corridorSet);
};
exports.XE_SUPPORTED_CORRIDORS = buildSupportedCorridors();
exports.XE_B2B_CORRIDORS = [...exports.XE_SUPPORTED_CORRIDORS];
