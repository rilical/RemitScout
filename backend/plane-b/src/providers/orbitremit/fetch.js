"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrbitRemitQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const ratesEndpoint = 'https://www.orbitremit.com/api/rates';
const feesEndpoint = 'https://www.orbitremit.com/api/fees';
const SUPPORTED_SOURCE_COUNTRIES = new Set(['AU', 'NZ']);
const SUPPORTED_SOURCE_CURRENCIES = new Set(['AUD', 'NZD']);
const formatAmount = (amount) => amount.toFixed(2);
const resolveRecipientType = (payoutMethod, destCurrency) => {
    const available = (0, code_map_1.getRecipientTypesForCurrency)(destCurrency);
    const requested = (0, code_map_1.mapPayoutMethodToRecipientType)(payoutMethod, destCurrency);
    if (requested && available.includes(requested)) {
        return { recipientType: requested, requestedRecipientType: requested };
    }
    if (available.length > 0) {
        return { recipientType: available[0], requestedRecipientType: requested };
    }
    return { recipientType: requested ?? 'bank_account', requestedRecipientType: requested };
};
const fetchOrbitRemitQuote = async (request, options = {}) => {
    const { sourceCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sourceCountryCode = sourceCountry.toUpperCase();
    const sourceCurrencyCode = sourceCurrency.toUpperCase();
    const destCurrencyCode = destCurrency.toUpperCase();
    if (!SUPPORTED_SOURCE_COUNTRIES.has(sourceCountryCode)) {
        return {
            status: 400,
            bodyText: `Unsupported source country for OrbitRemit: ${sourceCountryCode}`,
            payload: {
                error: 'unsupported_source_country',
                message: 'OrbitRemit quotes are only available for AU/NZ send corridors.',
                sourceCountry: sourceCountryCode,
            },
        };
    }
    if (!SUPPORTED_SOURCE_CURRENCIES.has(sourceCurrencyCode)) {
        return {
            status: 400,
            bodyText: `Unsupported source currency for OrbitRemit: ${sourceCurrencyCode}`,
            payload: {
                error: 'unsupported_source_currency',
                message: 'OrbitRemit quotes are only available for AUD/NZD send amounts.',
                sourceCurrency: sourceCurrencyCode,
            },
        };
    }
    const { recipientType, requestedRecipientType } = resolveRecipientType(request.payout_method, destCurrencyCode);
    const headers = {
        accept: '*/*',
        'accept-language': request.locale ?? 'en-US',
        origin: 'https://www.orbitremit.com',
        referer: 'https://www.orbitremit.com',
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
    };
    const amount = formatAmount(request.send_amount);
    const ratePayload = {
        sendCurrency: sourceCurrencyCode,
        payoutCurrency: destCurrencyCode,
        amount,
        recipientType,
        focus: 'send',
    };
    const feeParams = new URLSearchParams({
        send: sourceCurrencyCode,
        payout: destCurrencyCode,
        amount,
        type: recipientType,
    });
    const [rateResponse, feeResponse] = await Promise.all([
        (0, http_client_1.httpRequest)({
            url: ratesEndpoint,
            method: 'POST',
            headers: {
                ...headers,
                'content-type': 'application/json',
            },
            body: ratePayload,
            jitterMs: options.jitterMs,
            proxyTier: options.proxyTier,
            corridorId: request.corridor_id,
        }),
        (0, http_client_1.httpRequest)({
            url: `${feesEndpoint}?${feeParams.toString()}`,
            method: 'GET',
            headers,
            jitterMs: options.jitterMs,
            proxyTier: options.proxyTier,
            corridorId: request.corridor_id,
        }),
    ]);
    return {
        status: rateResponse.status,
        bodyText: rateResponse.bodyText,
        payload: {
            rate: rateResponse.json ?? rateResponse.bodyText,
            fee: feeResponse.json ?? feeResponse.bodyText,
            meta: {
                recipientType,
                requestedRecipientType,
                availableRecipientTypes: (0, code_map_1.getRecipientTypesForCurrency)(destCurrencyCode),
            },
        },
    };
};
exports.fetchOrbitRemitQuote = fetchOrbitRemitQuote;
