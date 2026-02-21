"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSendwaveQuote = void 0;
const http_client_1 = require("../../collectors/http-client");
const corridor_1 = require("../../../../shared/corridor");
const user_agent_1 = require("../../collectors/user-agent");
const code_map_1 = require("./code-map");
const SENDWAVE_BASE_URL = 'https://app.sendwave.com/v2';
const SEGMENTS_ENDPOINT = `${SENDWAVE_BASE_URL}/pricing-segments`;
const PRICING_ENDPOINT = `${SENDWAVE_BASE_URL}/pricing-public`;
const normalizeLocale = (value) => value || 'en-US';
const formatAmount = (amount) => {
    if (!Number.isFinite(amount))
        return '0';
    return amount.toFixed(2);
};
const resolvePayoutGroups = (payload) => {
    if (!payload || typeof payload !== 'object')
        return [];
    const record = payload;
    return Array.isArray(record.payoutMethodsAndPrices) ? record.payoutMethodsAndPrices : [];
};
const resolveSegmentName = (group) => {
    if (!group)
        return null;
    if (group.bestPricedSegmentName)
        return group.bestPricedSegmentName;
    const firstSegment = group.segments?.find(segment => Boolean(segment?.segmentName));
    return firstSegment?.segmentName ?? null;
};
const selectSegment = (payload, requestedPayout) => {
    const groups = resolvePayoutGroups(payload);
    if (!groups.length)
        return { segmentName: null, payoutMethod: null };
    const normalizedRequest = requestedPayout?.trim().toLowerCase() || '';
    const mappedGroups = groups.map((group) => {
        const payout = (0, code_map_1.mapSendwavePayoutMethod)(group.payoutMethod
            ?? group.label
            ?? group.bestPricedSegmentName
            ?? group.segments?.[0]?.segmentName);
        return { group, payout };
    });
    const requestedGroup = normalizedRequest
        ? mappedGroups.find(entry => entry.payout === normalizedRequest)
        : undefined;
    const bestPricedGroup = mappedGroups.find(entry => entry.group.isBestPricedPayoutMethod);
    const fallbackGroup = requestedGroup
        || bestPricedGroup
        || mappedGroups.find(entry => resolveSegmentName(entry.group))
        || mappedGroups[0];
    return {
        segmentName: resolveSegmentName(fallbackGroup?.group) ?? null,
        payoutMethod: fallbackGroup?.payout ?? null,
    };
};
const fetchSendwaveQuote = async (request, options = {}) => {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const locale = normalizeLocale(request.locale);
    const segmentParams = new URLSearchParams({
        sendCountryIso2: sourceCountry.toLowerCase(),
        sendCurrency: sourceCurrency,
        receiveCountryIso2: destCountry.toLowerCase(),
        receiveCurrency: destCurrency,
    });
    const headers = {
        accept: 'application/json, text/plain, */*',
        origin: 'https://www.sendwave.com',
        referer: 'https://www.sendwave.com/',
        'accept-language': locale,
        'user-agent': (0, user_agent_1.getUserAgentForCorridor)(request.corridor_id),
    };
    const segmentResponse = await (0, http_client_1.httpRequest)({
        url: `${SEGMENTS_ENDPOINT}?${segmentParams.toString()}`,
        method: 'GET',
        headers,
        jitterMs: options.jitterMs,
        proxyTier: options.proxyTier,
        corridorId: request.corridor_id,
    });
    const segmentsPayload = segmentResponse.json ?? segmentResponse.bodyText;
    const segmentSelection = selectSegment(segmentsPayload, request.payout_method);
    let pricingPayload = null;
    let status = segmentResponse.status;
    let bodyText = segmentResponse.bodyText;
    if (segmentSelection.segmentName && segmentResponse.status < 400) {
        const pricingParams = new URLSearchParams({
            amountType: 'SEND',
            receiveCurrency: destCurrency,
            segmentName: segmentSelection.segmentName,
            amount: formatAmount(request.send_amount),
            sendCurrency: sourceCurrency,
            sendCountryIso2: sourceCountry.toLowerCase(),
            receiveCountryIso2: destCountry.toLowerCase(),
        });
        const pricingResponse = await (0, http_client_1.httpRequest)({
            url: `${PRICING_ENDPOINT}?${pricingParams.toString()}`,
            method: 'GET',
            headers,
            jitterMs: options.jitterMs,
            proxyTier: options.proxyTier,
            corridorId: request.corridor_id,
        });
        pricingPayload = pricingResponse.json ?? pricingResponse.bodyText;
        status = pricingResponse.status;
        bodyText = pricingResponse.bodyText;
    }
    return {
        status,
        bodyText,
        payload: {
            segments: segmentsPayload,
            pricing: pricingPayload,
            segmentName: segmentSelection.segmentName,
            payoutMethod: segmentSelection.payoutMethod,
        },
    };
};
exports.fetchSendwaveQuote = fetchSendwaveQuote;
