"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRiaQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const riaEndpoint = 'https://public.riamoneytransfer.com/MoneyTransferCalculator/Calculate';
const fetchRiaQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const locale = request.locale || 'en-US';
    const mapCountry = (code) => code_map_1.countryCodeMap[code] ?? code;
    const mapCurrency = (code) => code_map_1.currencyCodeMap[code] ?? code;
    const headers = {
        accept: '*/*',
        'content-type': 'application/json',
        pragma: 'no-cache',
        'cache-control': 'no-cache',
        origin: 'https://www.riamoneytransfer.com',
        referer: 'https://www.riamoneytransfer.com/',
        'accept-language': locale,
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
        'client-type': 'PublicSite',
        culturecode: locale,
        appversion: '4.0',
    };
    const buildBody = (localeValue) => ({
        selections: {
            countryFrom: mapCountry(sourceCountry),
            countryTo: mapCountry(destCountry),
            currencyFrom: mapCurrency(sourceCurrency),
            currencyTo: mapCurrency(destCurrency),
            amountFrom: request.send_amount,
            paymentMethod: (0, code_map_1.getPaymentMethodForPayin)(request.payin_method),
            deliveryMethod: (0, code_map_1.getDeliveryMethodForPayout)(request.payout_method),
            promoId: 0,
            shouldCalcAmountFrom: false,
            shouldCalcVariableRates: true,
            locale: localeValue,
        },
    });
    const execute = async (localeValue) => (0, http_client_1.httpRequest)({
        url: riaEndpoint,
        method: 'POST',
        headers,
        body: buildBody(localeValue),
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    let response;
    try {
        response = await execute(locale.toLowerCase());
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('HTTP 500') && locale.toLowerCase() !== locale) {
            response = await execute(locale);
        }
        else {
            throw error;
        }
    }
    return {
        status: response.status,
        bodyText: response.bodyText,
        parseError: response.parseError,
        payload: response.json ?? response.bodyText,
    };
};
exports.fetchRiaQuote = fetchRiaQuote;
