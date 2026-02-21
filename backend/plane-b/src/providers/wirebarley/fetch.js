"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWireBarleyQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const wirebarleyBaseUrl = 'https://www.wirebarley.com/kr/remittance/api/v1/exrate';
const buildHeaders = (request) => {
    const locale = request.locale || 'en-US';
    const language = locale.split('-')[0] || 'en';
    return {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'accept-language': locale,
        'device-type': 'WEB',
        'device-model': 'Chrome',
        'device-version': '143.0.0.0',
        lang: language,
        origin: 'https://www.wirebarley.com',
        referer: 'https://www.wirebarley.com/',
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
    };
};
const fetchWireBarleyQuote = async (request, options = {}) => {
    const { sourceCountry, sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const url = `${wirebarleyBaseUrl}/${sourceCountry}/${sourceCurrency}`;
    const response = await (0, http_client_1.httpRequest)({
        url,
        headers: buildHeaders(request),
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
exports.fetchWireBarleyQuote = fetchWireBarleyQuote;
