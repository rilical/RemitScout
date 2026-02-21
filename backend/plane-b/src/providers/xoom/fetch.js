"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchXoomQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const user_agent_1 = require("../../collectors/user-agent");
const logger = (0, logger_1.createLogger)('plane-b.xoom.fetch');
const baseUrl = 'https://www.xoom.com';
const formatLocale = (value) => {
    if (!value)
        return 'en-us';
    return value.replace(/_/g, '-').toLowerCase();
};
const formatSendAmount = (value) => {
    if (!Number.isFinite(value))
        return '0.00';
    return value.toFixed(2);
};
const extractRemittanceFromHtml = (html) => {
    const marker = '\\"remittance\\":';
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1)
        return null;
    const start = html.indexOf('{', markerIndex);
    if (start === -1)
        return null;
    let depth = 0;
    let end = -1;
    for (let i = start; i < html.length; i += 1) {
        const char = html[i];
        if (char === '{')
            depth += 1;
        if (char === '}')
            depth -= 1;
        if (depth === 0 && i > start) {
            end = i;
            break;
        }
    }
    if (end === -1)
        return null;
    const raw = html.slice(start, end + 1);
    const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    try {
        return JSON.parse(unescaped);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn('xoom_remittance_parse_failed', { error: message });
        return null;
    }
};
const fetchXoomQuote = async (request, options = {}) => {
    const { destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const locale = formatLocale(request.locale);
    const sendAmount = formatSendAmount(request.send_amount);
    const params = new URLSearchParams({
        countryCode: destCountry,
        sendAmount,
        destinationCurrencyCode: destCurrency,
    });
    const url = `${baseUrl}/${locale}/${sourceCurrency.toLowerCase()}/send-money/transfer?${params.toString()}`;
    const response = await (0, http_client_1.httpRequest)({
        url,
        headers: {
            accept: 'text/html,application/xhtml+xml',
            'accept-language': request.locale || 'en-US',
            'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
            referer: baseUrl,
        },
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    const remittance = extractRemittanceFromHtml(response.bodyText);
    return {
        status: response.status,
        bodyText: response.bodyText,
        payload: { remittance },
    };
};
exports.fetchXoomQuote = fetchXoomQuote;
