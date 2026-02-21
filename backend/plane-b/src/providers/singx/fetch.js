"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSingxQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const supported_corridors_1 = require("./supported-corridors");
const singxEndpoint = 'https://api.singx.co/central/landing/fx/SG/exchange';
const formatAmount = (value) => {
    if (!Number.isFinite(value))
        return '0.00';
    return value.toFixed(2);
};
const fetchSingxQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const normalizedSourceCurrency = sourceCurrency.toUpperCase();
    const normalizedDestCurrency = destCurrency.toUpperCase();
    const expectedSourceCountry = supported_corridors_1.SINGX_SOURCE_COUNTRY_BY_CURRENCY[normalizedSourceCurrency];
    const allowedDestCurrencies = supported_corridors_1.SINGX_DESTINATION_CURRENCIES_BY_SOURCE[normalizedSourceCurrency] ?? [];
    const expectedDestCountry = supported_corridors_1.SINGX_DESTINATION_COUNTRY_BY_CURRENCY[normalizedDestCurrency];
    if (!expectedSourceCountry) {
        throw new Error(`unsupported singx source currency: ${normalizedSourceCurrency}`);
    }
    if (expectedSourceCountry !== sourceCountry.toUpperCase()) {
        throw new Error(`singx corridor source mismatch: ${request.corridor_id} expects ${expectedSourceCountry}`);
    }
    if (!allowedDestCurrencies.includes(normalizedDestCurrency)) {
        throw new Error(`singx unsupported destination currency: ${normalizedDestCurrency} for ${normalizedSourceCurrency}`);
    }
    if (!expectedDestCountry || expectedDestCountry !== destCountry.toUpperCase()) {
        throw new Error(`singx corridor destination mismatch: ${request.corridor_id} expects ${expectedDestCountry ?? 'unknown'}`);
    }
    const body = {
        fromCurrency: normalizedSourceCurrency,
        toCurrency: normalizedDestCurrency,
        amount: formatAmount(request.send_amount),
        type: 'Send',
        swift: false,
        cashPickup: false,
        wallet: false,
        business: false,
    };
    const locale = request.locale || 'en-US';
    const response = await (0, http_client_1.httpRequest)({
        url: singxEndpoint,
        method: 'POST',
        headers: {
            accept: 'application/json, text/plain, */*',
            'content-type': 'application/json',
            origin: 'https://www.singx.co',
            referer: 'https://www.singx.co/',
            'accept-language': locale,
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        },
        body,
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    return {
        status: response.status,
        bodyText: response.bodyText,
        payload: response.json ?? response.bodyText,
    };
};
exports.fetchSingxQuote = fetchSingxQuote;
