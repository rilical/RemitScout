"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransferGoQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const quotesEndpoint = 'https://my.transfergo.com/api/booking/quotes';
const fetchTransferGoQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const params = new URLSearchParams({
        fromCurrencyCode: sourceCurrency,
        toCurrencyCode: destCurrency,
        fromCountryCode: sourceCountry,
        toCountryCode: destCountry,
        amount: String(request.send_amount),
        calculationBase: 'sendAmount',
        business: '0',
    });
    const response = await (0, http_client_1.httpRequest)({
        url: `${quotesEndpoint}?${params.toString()}`,
        method: 'GET',
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            origin: 'https://www.transfergo.com',
            referer: 'https://www.transfergo.com/',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
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
exports.fetchTransferGoQuote = fetchTransferGoQuote;
