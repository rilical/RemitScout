"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchIntermexQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const intermexEndpoint = 'https://api.imxi.com/pricing/api/v3/feesrates';
const buildHeaders = (request) => {
    const locale = request.locale || 'en-US';
    return {
        accept: 'application/json, text/plain, */*',
        'accept-language': locale,
        channelid: '1',
        languageid: '1',
        partnerid: '1',
        'ocp-apim-subscription-key': '2162a586e2164623a1cd9b6b2d300b4c',
        origin: 'https://www.intermexonline.com',
        referer: 'https://www.intermexonline.com/',
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
    };
};
const fetchIntermexQuote = async (request, options = {}) => {
    const { destCountry, destCurrency, sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const destCode = (0, code_map_1.resolveIntermexDestinationCode)(destCountry, destCurrency);
    if (!destCode) {
        throw new Error(`Unsupported Intermex destination: ${destCountry}-${destCurrency}`);
    }
    const params = new URLSearchParams({
        DestCountryAbbr: destCode,
        DestCurrency: destCurrency,
        OriCountryAbbr: code_map_1.DEFAULT_INTERMEX_ORIGIN_COUNTRY,
        OriStateAbbr: code_map_1.DEFAULT_INTERMEX_ORIGIN_STATE,
        StyleId: String(code_map_1.DEFAULT_INTERMEX_STYLE_ID),
        TranTypeId: String((0, code_map_1.resolveTranTypeId)(request.payout_method)),
        DeliveryType: code_map_1.DEFAULT_INTERMEX_DELIVERY_TYPE,
        OriCurrency: sourceCurrency ?? 'USD',
        ChannelId: '1',
        OriAmount: String(request.send_amount),
        DestAmount: '0',
        SenderPaymentMethodId: String((0, code_map_1.resolvePayinMethodId)(request.payin_method)),
    });
    const url = `${intermexEndpoint}?${params.toString()}`;
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
exports.fetchIntermexQuote = fetchIntermexQuote;
