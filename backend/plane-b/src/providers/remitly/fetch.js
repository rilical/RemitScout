"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRemitlyQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const user_agent_1 = require("../../collectors/user-agent");
const remitlyEndpoint = 'https://api.remitly.io/v3/calculator/estimate';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const fetchRemitlyQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const conduit = `${mapCountry(sourceCountry)}:${mapCurrency(sourceCurrency)}-${mapCountry(destCountry)}:${mapCurrency(destCurrency)}`;
    const params = new URLSearchParams({
        conduit,
        anchor: 'SEND',
        amount: String(request.send_amount),
        purpose: 'OTHER',
        customer_segment: 'UNRECOGNIZED',
        strict_promo: 'false',
    });
    const url = `${remitlyEndpoint}?${params.toString()}`;
    const response = await (0, http_client_1.httpRequest)({
        url,
        headers: {
            accept: 'application/json',
            origin: 'https://www.remitly.com',
            referer: 'https://www.remitly.com/',
            'accept-language': 'en',
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
exports.fetchRemitlyQuote = fetchRemitlyQuote;
