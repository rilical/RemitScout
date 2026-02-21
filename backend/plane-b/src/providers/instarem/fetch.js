"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchInstaremQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const instaremBaseUrl = 'https://www.instarem.com/api';
const paymentMethodPath = '/v1/public/payment-method/fee';
const computedValuePath = '/v1/public/transaction/computed-value';
const buildHeaders = (corridorId) => ({
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    origin: 'https://www.instarem.com',
    referer: 'https://www.instarem.com/',
    'user-agent': (0, user_agent_1.getUserAgentForCorridor)(corridorId),
});
const extractPaymentMethods = (payload) => {
    if (!payload || typeof payload !== 'object')
        return [];
    const data = payload.data;
    if (Array.isArray(data))
        return data;
    if (Array.isArray(payload))
        return payload;
    return [];
};
const methodDescriptor = (method) => [method.text, method.code, method.icon_url].filter(Boolean).join(' ');
const selectPaymentMethod = (methods, requestedPayin) => {
    if (!methods.length)
        return null;
    const desired = (0, code_map_1.normalizeMethodToken)(requestedPayin);
    if (!desired || desired === 'other')
        return methods[0];
    const matches = methods.filter((method) => {
        const mapped = (0, code_map_1.mapPayinMethod)(methodDescriptor(method));
        return mapped === requestedPayin;
    });
    if (matches.length === 0)
        return methods[0];
    if (matches.length === 1)
        return matches[0];
    const priority = (method) => {
        const token = (0, code_map_1.normalizeMethodToken)(methodDescriptor(method));
        if (requestedPayin === 'bank_transfer') {
            if (token.includes('bank') || token.includes('transfer') || token.includes('wire') || token.includes('ach')) {
                return 2;
            }
            if (token.includes('paynow'))
                return 1;
            return 0;
        }
        if (requestedPayin === 'debit_card' && token.includes('debit'))
            return 2;
        if (requestedPayin === 'credit_card' && token.includes('credit'))
            return 2;
        if (requestedPayin === 'apple_pay' && token.includes('apple'))
            return 2;
        if (requestedPayin === 'google_pay' && token.includes('google'))
            return 2;
        return 1;
    };
    return matches.sort((a, b) => priority(b) - priority(a))[0] ?? matches[0];
};
const resolveBankAccountId = (method) => {
    if (!method)
        return null;
    const key = method.key ?? method.value;
    if (key === null || key === undefined)
        return null;
    return String(key);
};
const fetchInstaremQuote = async (request, options = {}) => {
    const { sourceCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const headers = buildHeaders(request.corridor_id);
    const paymentMethodParams = new URLSearchParams({
        source_currency: sourceCurrency,
        source_amount: String(request.send_amount),
        destination_currency: destCurrency,
        country_code: sourceCountry,
    });
    const paymentMethodUrl = `${instaremBaseUrl}${paymentMethodPath}?${paymentMethodParams.toString()}`;
    const paymentMethodResponse = await (0, http_client_1.httpRequest)({
        url: paymentMethodUrl,
        headers,
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    const paymentMethods = extractPaymentMethods(paymentMethodResponse.json ?? paymentMethodResponse.bodyText);
    if (paymentMethodResponse.status >= 400 || paymentMethods.length === 0) {
        return {
            status: paymentMethodResponse.status,
            bodyText: paymentMethodResponse.bodyText,
            payload: paymentMethodResponse.json ?? paymentMethodResponse.bodyText,
        };
    }
    const selectedMethod = selectPaymentMethod(paymentMethods, request.payin_method);
    const bankAccountId = resolveBankAccountId(selectedMethod);
    if (!bankAccountId) {
        return {
            status: 400,
            bodyText: paymentMethodResponse.bodyText,
            payload: {
                error: 'missing_bank_account_id',
                payment_methods: paymentMethods,
            },
        };
    }
    const quoteParams = new URLSearchParams({
        source_currency: sourceCurrency,
        destination_currency: destCurrency,
        instarem_bank_account_id: bankAccountId,
        country_code: sourceCountry,
        source_amount: String(request.send_amount),
    });
    const quoteUrl = `${instaremBaseUrl}${computedValuePath}?${quoteParams.toString()}`;
    const quoteResponse = await (0, http_client_1.httpRequest)({
        url: quoteUrl,
        headers,
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    const payload = {
        payment_methods: paymentMethods,
        selected_payment_method: selectedMethod,
        quote: quoteResponse.json?.data ?? quoteResponse.json ?? null,
    };
    return {
        status: quoteResponse.status,
        bodyText: quoteResponse.bodyText,
        payload,
    };
};
exports.fetchInstaremQuote = fetchInstaremQuote;
