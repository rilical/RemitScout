"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOrbitRemitPayload = exports.extractOrbitRemitMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const getRateAttributes = (payload) => {
    if (!payload?.rate || typeof payload.rate !== 'object')
        return null;
    const rate = payload.rate;
    if (rate.type && rate.type !== 'success')
        return null;
    const attributes = rate.data?.data?.attributes ?? null;
    return attributes && typeof attributes === 'object' ? attributes : null;
};
const getFeeData = (payload) => {
    if (!payload?.fee || typeof payload.fee !== 'object')
        return null;
    const fee = payload.fee;
    if (fee.status && fee.status !== 'success')
        return null;
    const data = fee.data ?? null;
    return data && typeof data === 'object' ? data : null;
};
const resolveDestCurrency = (payload, request) => {
    const attributes = getRateAttributes(payload);
    const feeData = getFeeData(payload);
    return (attributes?.payout_currency
        ?? feeData?.payout_currency
        ?? (request ? (0, corridor_1.requireCorridorId)(request.corridor_id).destCurrency : null));
};
const extractOrbitRemitMethodPairs = (payload, request) => {
    const pairs = new Map();
    const destCurrency = resolveDestCurrency(payload, request);
    const recipientTypes = (0, code_map_1.getRecipientTypesForCurrency)(destCurrency ?? undefined);
    const payinMethod = 'bank_transfer';
    const addPair = (recipientType) => {
        const payout = (0, code_map_1.mapRecipientTypeToPayoutMethod)(recipientType);
        if (!payout || payout === 'other')
            return;
        const key = `${payinMethod}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payinMethod, payout_method: payout });
        }
    };
    if (recipientTypes.length > 0) {
        for (const recipientType of recipientTypes) {
            addPair(recipientType);
        }
    }
    else {
        const feeData = getFeeData(payload);
        addPair(feeData?.recipient_type ?? payload.meta?.recipientType ?? null);
    }
    if (pairs.size === 0) {
        addPair(payload.meta?.requestedRecipientType ?? null);
    }
    return Array.from(pairs.values());
};
exports.extractOrbitRemitMethodPairs = extractOrbitRemitMethodPairs;
const parseOrbitRemitPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const rateAttributes = getRateAttributes(payload);
    if (!rateAttributes) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendCurrency = rateAttributes.send_currency ?? sourceCurrency;
    const sendAmountRaw = parseNumber(rateAttributes.send_amount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const rateRaw = parseNumber(rateAttributes.rate);
    const promotionalRateRaw = parseNumber(rateAttributes.promotion_rate ?? rateAttributes.rate);
    const baseRateRaw = parseNumber(rateAttributes.standard_rate);
    const receiveAmountRaw = parseNumber(rateAttributes.payout_amount);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(promotionalRateRaw)
            ? sendAmount * promotionalRateRaw
            : Number.isFinite(baseRateRaw)
                ? sendAmount * baseRateRaw
                : Number.isFinite(rateRaw)
                    ? sendAmount * rateRaw
                    : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(promotionalRateRaw) && !Number.isFinite(baseRateRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const feeData = getFeeData(payload);
    const feeAmountRaw = parseNumber(feeData?.fee);
    if (!Number.isFinite(feeAmountRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const requestedPayin = (0, code_map_1.mapPayinMethod)(request.payin_method);
    const payinMethod = requestedPayin !== 'other'
        ? requestedPayin
        : 'bank_transfer';
    if (requestedPayin !== 'other' && requestedPayin !== payinMethod) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const recipientType = feeData?.recipient_type
        ?? payload.meta?.recipientType
        ?? payload.meta?.requestedRecipientType;
    const payoutMethodRaw = (0, code_map_1.mapRecipientTypeToPayoutMethod)(recipientType);
    const payoutMethod = payoutMethodRaw !== 'other'
        ? payoutMethodRaw
        : request.payout_method || 'bank_deposit';
    if (request.payout_method && payoutMethod !== request.payout_method) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const availableRecipientTypes = payload.meta?.availableRecipientTypes
        ?? (0, code_map_1.getRecipientTypesForCurrency)(destCurrency);
    if (recipientType
        && Array.isArray(availableRecipientTypes)
        && availableRecipientTypes.length > 0
        && !availableRecipientTypes.includes(recipientType)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const promotionalCapRaw = parseNumber(rateAttributes.promotion_threshold);
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmountRaw) ? feeAmountRaw : 0,
        total_debit_amount: sendAmount + (Number.isFinite(feeAmountRaw) ? feeAmountRaw : 0),
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sendCurrency ?? sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
        base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
        promotional_cap_amount: Number.isFinite(promotionalCapRaw) ? promotionalCapRaw : null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'orbitremit_estimates_v1',
        parse_flags: flags,
    };
};
exports.parseOrbitRemitPayload = parseOrbitRemitPayload;
