"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWisePayload = exports.extractWiseMethodPairs = void 0;
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const normalizeToken = (value) => value.trim().toLowerCase().replace(/\s+/g, '_');
const mapPayin = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    return code_map_1.payinMethodMap[token.toUpperCase()] ?? code_map_1.payinMethodMap[token] ?? 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    return code_map_1.payoutMethodMap[token.toUpperCase()] ?? code_map_1.payoutMethodMap[token] ?? 'other';
};
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const parseDeliveryMinutes = (estimated, reference, formatted) => {
    const parsedEstimated = estimated ? Date.parse(estimated) : Number.NaN;
    const parsedReference = reference ? Date.parse(reference) : Number.NaN;
    if (Number.isFinite(parsedEstimated) && Number.isFinite(parsedReference)) {
        const diffMinutes = Math.max(0, Math.round((parsedEstimated - parsedReference) / 60000));
        return { min: diffMinutes, max: diffMinutes };
    }
    if (formatted) {
        const lower = formatted.toLowerCase();
        if (lower.includes('in seconds')) {
            return { min: 0, max: 1 };
        }
        const minutesMatch = lower.match(/in\s+(\d+)\s+minutes?/);
        if (minutesMatch) {
            const minutes = Number(minutesMatch[1]);
            return { min: minutes, max: minutes };
        }
        const hoursMatch = lower.match(/in\s+(\d+)\s+hours?/);
        if (hoursMatch) {
            const minutes = Number(hoursMatch[1]) * 60;
            return { min: minutes, max: minutes };
        }
    }
    return { min: null, max: null };
};
const extractWiseMethodPairs = (payload) => {
    const options = payload.paymentOptions ?? [];
    return options
        .filter(option => !option.disabled)
        .map(option => ({
        payin_method: mapPayin(option.payIn),
        payout_method: mapPayout(option.payOut),
    }));
};
exports.extractWiseMethodPairs = extractWiseMethodPairs;
const selectPaymentOption = (payload, request, flags) => {
    const options = (payload.paymentOptions ?? []).filter(option => !option.disabled);
    if (!options.length)
        return null;
    const desiredPayin = request.payin_method && request.payin_method !== 'other'
        ? request.payin_method
        : null;
    const desiredPayout = request.payout_method && request.payout_method !== 'other'
        ? request.payout_method
        : null;
    const match = options.find(option => {
        const payin = mapPayin(option.payIn);
        const payout = mapPayout(option.payOut);
        return (!desiredPayin || payin === desiredPayin) && (!desiredPayout || payout === desiredPayout);
    });
    if (match)
        return match;
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return options[0];
};
const parseWisePayload = (payload, request) => {
    const flags = [];
    if (!payload || payload.error || payload.errorCode) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const selected = selectPaymentOption(payload, request, flags);
    if (!selected) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const sendAmount = parseNumber(selected.sourceAmount);
    const receiveAmount = parseNumber(selected.targetAmount);
    const feeTotal = parseNumber(selected.fee?.total ?? selected.price?.total?.value?.amount);
    const feeDiscount = parseNumber(selected.fee?.discount);
    const baseRate = parseNumber(payload.rate);
    const feeCurrency = selected.price?.total?.value?.currency ?? selected.sourceCurrency ?? null;
    const { min: deliveryMin, max: deliveryMax } = parseDeliveryMinutes(selected.estimatedDelivery ?? null, payload.createdTime ?? payload.rateTimestamp ?? null, selected.formattedEstimatedDelivery ?? null);
    const hasDiscount = Number.isFinite(feeDiscount) && feeDiscount > 0;
    const feeAmount = Number.isFinite(feeTotal)
        ? hasDiscount
            ? feeTotal + feeDiscount
            : feeTotal
        : Number.NaN;
    const promotionalFeeAmount = Number.isFinite(feeTotal) && hasDiscount ? feeTotal : null;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: sendAmount + (promotionalFeeAmount ?? (Number.isFinite(feeAmount) ? feeAmount : 0)),
        payin_method: mapPayin(selected.payIn),
        payout_method: mapPayout(selected.payOut),
        fee_currency: feeCurrency,
        exchange_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryMin,
        delivery_time_max_minutes: deliveryMax,
        collected_at: new Date().toISOString(),
        parser_version: 'wise_v1',
        parse_flags: flags,
    };
};
exports.parseWisePayload = parseWisePayload;
