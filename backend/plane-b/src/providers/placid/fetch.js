"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPlacidQuote = exports.fetchPlacidSessionCookie = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const supported_corridors_1 = require("./supported-corridors");
const parse_1 = require("./parse");
const placidEndpoint = 'https://www.placid.net/rates-fees.php';
const placidSessionWarmupUrl = 'https://www.placid.net/';
const buildCookieHeader = (cookies) => {
    if (!cookies || cookies.length === 0)
        return null;
    const parts = cookies
        .map((cookie) => cookie.split(';')[0]?.trim())
        .filter(Boolean);
    return parts.length ? parts.join('; ') : null;
};
const fetchPlacidSessionCookie = async (input) => {
    const url = input.warmupUrl || placidSessionWarmupUrl;
    if (!url)
        return null;
    const response = await (0, http_client_1.httpRequest)({
        url,
        method: 'GET',
        headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': input.locale,
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(input.corridorId),
            referer: placidSessionWarmupUrl,
        },
        proxyTier: input.proxyTier,
        corridorId: input.corridorId,
    });
    return buildCookieHeader(response.setCookie);
};
exports.fetchPlacidSessionCookie = fetchPlacidSessionCookie;
const fetchPlacidQuote = async (request, options = {}) => {
    const { sourceCurrency, destCountry, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const normalizedSource = sourceCurrency.toUpperCase();
    const normalizedDestCurrency = destCurrency.toUpperCase();
    if (normalizedSource !== 'USD') {
        throw new Error(`placid only supports USD as source currency: ${request.corridor_id}`);
    }
    const expectedCurrency = supported_corridors_1.PLACID_DESTINATION_CURRENCY_BY_COUNTRY[destCountry.toUpperCase()];
    if (!expectedCurrency) {
        throw new Error(`placid unsupported destination country: ${destCountry}`);
    }
    if (expectedCurrency !== normalizedDestCurrency) {
        throw new Error(`placid corridor currency mismatch: ${destCountry} expects ${expectedCurrency} but got ${normalizedDestCurrency}`);
    }
    const headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': request.locale || 'en-US',
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        origin: 'https://www.placid.net',
        referer: 'https://www.placid.net/',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
    };
    if (options.extraHeaders) {
        for (const [key, value] of Object.entries(options.extraHeaders)) {
            if (value) {
                headers[key] = value;
            }
        }
    }
    if (options.cookie) {
        headers.cookie = options.cookie;
    }
    const response = await (0, http_client_1.httpRequest)({
        url: placidEndpoint,
        method: 'GET',
        headers,
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    const payload = (0, parse_1.parsePlacidHtml)(response.bodyText);
    return {
        status: response.status,
        bodyText: response.bodyText,
        payload,
    };
};
exports.fetchPlacidQuote = fetchPlacidQuote;
