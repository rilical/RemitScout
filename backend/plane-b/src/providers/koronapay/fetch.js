"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchKoronaPayQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const tariffsEndpoint = 'https://koronapay.com/api/transfers/tariffs';
const tariffsInfoEndpoint = 'https://koronapay.com/api/transfers/tariffs/info';
const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
const getMinorUnits = (currency) => {
    const key = currency.toUpperCase();
    return code_map_1.currencyMinorUnits[key] ?? 2;
};
const toMinorUnits = (amount, currency) => {
    const factor = Math.pow(10, getMinorUnits(currency));
    return Math.round(amount * factor);
};
const fetchKoronaPayQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const paymentMethod = (0, code_map_1.getPaymentMethodForPayin)(request.payin_method);
    const receivingMethod = (0, code_map_1.getReceivingMethodForPayout)(request.payout_method);
    const sendingAmount = toMinorUnits(request.send_amount, sourceCurrency);
    const quoteParams = new URLSearchParams({
        sendingCountryId: mapCountry(sourceCountry),
        receivingCountryId: mapCountry(destCountry),
        sendingCurrencyId: mapCurrency(sourceCurrency),
        receivingCurrencyId: mapCurrency(destCurrency),
        sendingAmount: String(sendingAmount),
        paymentMethod,
        receivingMethod,
        paidNotificationEnabled: 'false',
    });
    const infoParams = new URLSearchParams({
        sendingCountryId: mapCountry(sourceCountry),
        receivingCountryId: mapCountry(destCountry),
        forTransferRepeat: 'false',
        paymentMethod,
    });
    const headers = {
        accept: 'application/vnd.cft-data.v2.152+json',
        pragma: 'no-cache',
        'cache-control': 'no-cache',
        'accept-language': request.locale || 'en',
        referer: 'https://koronapay.com/transfers/europe/en/',
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        'x-application': 'Qpay-Web/3.0',
    };
    const [quoteResponse, infoResponse] = await Promise.all([
        (0, http_client_1.httpRequest)({
            url: `${tariffsEndpoint}?${quoteParams.toString()}`,
            headers,
            jitterMs: options.jitterMs,
            proxyTier: options.proxyTier,
            corridorId: request.corridor_id,
        }),
        (0, http_client_1.httpRequest)({
            url: `${tariffsInfoEndpoint}?${infoParams.toString()}`,
            headers,
            jitterMs: options.jitterMs,
            proxyTier: options.proxyTier,
            corridorId: request.corridor_id,
        }),
    ]);
    return {
        status: quoteResponse.status,
        bodyText: quoteResponse.bodyText,
        payload: {
            tariffs: quoteResponse.json ?? quoteResponse.bodyText,
            tariffInfo: infoResponse.json ?? infoResponse.bodyText,
        },
    };
};
exports.fetchKoronaPayQuote = fetchKoronaPayQuote;
