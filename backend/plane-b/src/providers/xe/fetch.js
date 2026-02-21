"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchXeQuote = void 0;
const node_crypto_1 = require("node:crypto");
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const user_agent_1 = require("../../collectors/user-agent");
const quotesEndpoint = 'https://launchpad-api.xe.com/v2/quotes';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const fetchXeQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const payload = {
        sellCcy: mapCurrency(sourceCurrency),
        buyCcy: mapCurrency(destCurrency),
        userCountry: mapCountry(sourceCountry),
        amount: request.send_amount,
        fixedCcy: mapCurrency(sourceCurrency),
        countryTo: mapCountry(destCountry),
    };
    const response = await (0, http_client_1.httpRequest)({
        url: quotesEndpoint,
        method: 'POST',
        headers: {
            accept: '*/*',
            'content-type': 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            origin: 'https://www.xe.com',
            referer: 'https://www.xe.com/',
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            'x-correlation-id': `XECOM-${(0, node_crypto_1.randomUUID)()}`,
            deviceid: (0, node_crypto_1.randomUUID)(),
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
exports.fetchXeQuote = fetchXeQuote;
