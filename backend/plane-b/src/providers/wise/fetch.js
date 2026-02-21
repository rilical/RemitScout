"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWiseQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const user_agent_1 = require("../../collectors/user-agent");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const quotesEndpoint = 'https://wise.com/gateway/v3/quotes';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const fetchWiseQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const payload = {
        sourceCurrency: mapCurrency(sourceCurrency),
        targetCurrency: mapCurrency(destCurrency),
        sourceAmount: request.send_amount,
        profile: 'personal',
        targetAmount: null,
        rateType: 'FIXED',
        sourceCountry: mapCountry(sourceCountry),
        targetCountry: mapCountry(destCountry),
    };
    const response = await (0, http_client_1.httpRequest)({
        url: quotesEndpoint,
        method: 'POST',
        headers: {
            accept: 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            origin: 'https://wise.com',
            referer: 'https://wise.com/',
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        },
        body: payload,
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
exports.fetchWiseQuote = fetchWiseQuote;
