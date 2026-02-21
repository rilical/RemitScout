"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRemitbeeQuote = exports.fetchRemitbeeSessionCookie = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const user_agent_1 = require("../../collectors/user-agent");
const supported_corridors_1 = require("./supported-corridors");
const remitbeeEndpoint = 'https://api.remitbee.com/public-services/compressed/calculate-money-transfer';
const remitbeeSessionWarmupUrl = 'https://www.remitbee.com/';
const formatAmount = (value) => {
    if (!Number.isFinite(value))
        return '0.00';
    return value.toFixed(2);
};
const buildCookieHeader = (cookies) => {
    if (!cookies || cookies.length === 0)
        return null;
    const parts = cookies
        .map((cookie) => cookie.split(';')[0]?.trim())
        .filter(Boolean);
    return parts.length ? parts.join('; ') : null;
};
const fetchRemitbeeSessionCookie = async (input) => {
    const url = input.warmupUrl || remitbeeSessionWarmupUrl;
    if (!url)
        return null;
    const response = await (0, http_client_1.httpRequest)({
        url,
        method: 'GET',
        headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': input.locale,
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(input.corridorId),
            referer: remitbeeSessionWarmupUrl,
        },
        proxyTier: input.proxyTier,
        corridorId: input.corridorId,
    });
    return buildCookieHeader(response.setCookie);
};
exports.fetchRemitbeeSessionCookie = fetchRemitbeeSessionCookie;
const fetchRemitbeeQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const normalizedDestCountry = destCountry.toUpperCase();
    const countryId = (0, code_map_1.getCountryIdForIso2)(normalizedDestCountry);
    const allowedCurrencies = supported_corridors_1.REMITBEE_DESTINATION_CURRENCY_OPTIONS[normalizedDestCountry] ?? [];
    const normalizedDestCurrency = destCurrency.toUpperCase();
    if (!countryId || !allowedCurrencies.length) {
        throw new Error(`unsupported remitbee corridor: ${request.corridor_id}`);
    }
    if (!allowedCurrencies.includes(normalizedDestCurrency)) {
        throw new Error(`remitbee corridor currency mismatch: ${destCountry} expects ${allowedCurrencies.join(', ')} but got ${destCurrency}`);
    }
    if (sourceCountry.toUpperCase() !== 'CA' || sourceCurrency.toUpperCase() !== 'CAD') {
        throw new Error(`remitbee only supports CA/CAD as source: ${request.corridor_id}`);
    }
    const body = {
        transfer_amount: formatAmount(request.send_amount),
        country_id: countryId,
        currency_code: normalizedDestCurrency,
        include_timeline: true,
        is_special_rate: true,
    };
    const locale = request.locale || 'en-US';
    const headers = {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        origin: 'https://www.remitbee.com',
        referer: 'https://www.remitbee.com/',
        'accept-language': locale,
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
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
        url: remitbeeEndpoint,
        method: 'POST',
        headers,
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
exports.fetchRemitbeeQuote = fetchRemitbeeQuote;
