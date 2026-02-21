"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDahabshiilQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const DAHABSHIIL_ENDPOINT = 'https://apigw-us.dahabshiil.com/remit/transaction/get-charges-anonymous';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const formatAmount = (amount) => {
    if (!Number.isFinite(amount))
        return '0.00';
    return amount.toFixed(2);
};
const fetchDahabshiilQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const params = new URLSearchParams({
        source_country_code: mapCountry(sourceCountry),
        destination_country_iso2: mapCountry(destCountry),
        amount_type: 'SOURCE',
        amount: formatAmount(request.send_amount),
        destination_currency: mapCurrency(destCurrency),
        type: (0, code_map_1.getPayoutTypeForMethod)(request.payout_method),
    });
    const response = await (0, http_client_1.httpRequest)({
        url: `${DAHABSHIIL_ENDPOINT}?${params.toString()}`,
        method: 'GET',
        headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': request.locale || 'en-US',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            origin: 'https://www.dahabshiil.com',
            referer: 'https://www.dahabshiil.com/',
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        },
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
exports.fetchDahabshiilQuote = fetchDahabshiilQuote;
