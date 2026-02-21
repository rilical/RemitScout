"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWellsFargoQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const wellsFargoEndpoint = 'https://www.wellsfargo.com/as/grs/country/rnm/paymentMethod/amount';
const fetchWellsFargoQuote = async (request, options = {}) => {
    const { destCountry } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    if (destCountry !== 'MX') {
        throw new Error(`Wells Fargo only supports Mexico (MX) as destination country, got: ${destCountry}`);
    }
    const formData = new URLSearchParams({
        country: 'MX',
        location: '9',
        method: 'ACCT_TO_ACCT',
        sendAmount: String(request.send_amount),
        lang: 'en',
    });
    const response = await (0, http_client_1.httpRequest)({
        url: wellsFargoEndpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Origin': 'https://www.wellsfargo.com',
            'Referer': 'https://www.wellsfargo.com/international-remittances/cost-estimator/',
            'User-Agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        body: formData.toString(),
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
exports.fetchWellsFargoQuote = fetchWellsFargoQuote;
