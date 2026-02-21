"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWesternUnionQuote = void 0;
const node_crypto_1 = require("node:crypto");
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const code_map_1 = require("./code-map");
const user_agent_1 = require("../../collectors/user-agent");
const catalogEndpoint = 'https://www.westernunion.com/wuconnect/prices/catalog';
const startPageUrl = 'https://www.westernunion.com/us/en/web/send-money/start';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const fetchWesternUnionQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const paymentCode = (0, code_map_1.getPaymentCodeForPayin)(request.payin_method);
    const fundsIn = options.forceAllPayins ? '*' : paymentCode ?? '*';
    const payload = {
        header_request: { version: '0.5', request_type: 'PRICECATALOG' },
        sender: {
            client: 'WUCOM',
            channel: 'WWEB',
            funds_in: fundsIn,
            curr_iso3: mapCurrency(sourceCurrency),
            cty_iso2_ext: mapCountry(sourceCountry),
            send_amount: String(request.send_amount),
        },
        receiver: {
            curr_iso3: mapCurrency(destCurrency),
            cty_iso2_ext: mapCountry(destCountry),
            cty_iso2: mapCountry(destCountry),
        },
    };
    const response = await (0, http_client_1.httpRequest)({
        url: catalogEndpoint,
        method: 'POST',
        headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            origin: 'https://www.westernunion.com',
            referer: startPageUrl,
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            'x-wu-correlation-id': (0, node_crypto_1.randomUUID)(),
            'x-wu-transaction-id': (0, node_crypto_1.randomUUID)(),
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
exports.fetchWesternUnionQuote = fetchWesternUnionQuote;
