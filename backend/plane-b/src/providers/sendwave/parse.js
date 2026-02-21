"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSendwavePayload = exports.extractSendwaveMethodPairs = exports.getSendwaveErrorMessages = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.sendwave.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const extractErrors = (value) => {
    if (!value)
        return [];
    if (typeof value === 'string')
        return [value];
    if (typeof value !== 'object')
        return [];
    const record = value;
    const messages = [];
    if (typeof record.message === 'string') {
        messages.push(record.message);
    }
    if (typeof record.error === 'string') {
        messages.push(record.error);
    }
    if (Array.isArray(record.errors)) {
        for (const entry of record.errors) {
            if (typeof entry === 'string') {
                messages.push(entry);
            }
            else if (entry && typeof entry === 'object' && typeof entry.message === 'string') {
                messages.push(entry.message);
            }
        }
    }
    for (const entry of Object.values(record)) {
        if (Array.isArray(entry) && entry.every(item => typeof item === 'string')) {
            messages.push(...entry);
        }
    }
    return messages;
};
const getSendwaveErrorMessages = (payload) => {
    const messages = new Set();
    for (const message of extractErrors(payload?.segments)) {
        if (message)
            messages.add(message);
    }
    for (const message of extractErrors(payload?.pricing)) {
        if (message)
            messages.add(message);
    }
    return Array.from(messages);
};
exports.getSendwaveErrorMessages = getSendwaveErrorMessages;
const resolvePayoutGroups = (payload) => {
    if (!payload?.segments || typeof payload.segments !== 'object')
        return [];
    const segments = payload.segments;
    return Array.isArray(segments.payoutMethodsAndPrices) ? segments.payoutMethodsAndPrices : [];
};
const extractSendwaveMethodPairs = (payload) => {
    const pairs = new Map();
    const groups = resolvePayoutGroups(payload);
    for (const group of groups) {
        const payout = (0, code_map_1.mapSendwavePayoutMethod)(group.payoutMethod
            ?? group.label
            ?? group.bestPricedSegmentName
            ?? group.segments?.[0]?.segmentName);
        const payin = 'debit_card';
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractSendwaveMethodPairs = extractSendwaveMethodPairs;
const parseSendwavePayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const errors = (0, exports.getSendwaveErrorMessages)(payload);
    if (errors.length > 0) {
        logger.warn('sendwave_parse_error_messages', {
            corridor_id: request.corridor_id,
            errors,
        });
        return null;
    }
    if (!payload.pricing || typeof payload.pricing !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const pricing = payload.pricing;
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(pricing.effectiveSendAmount ?? pricing.baseSendAmount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const promotionalRate = parseNumber(pricing.effectiveExchangeRate);
    const baseRate = parseNumber(pricing.baseExchangeRate);
    const receiveAmountRaw = parseNumber(pricing.receiveAmount);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(promotionalRate)
            ? sendAmount * promotionalRate
            : Number.isFinite(baseRate)
                ? sendAmount * baseRate
                : Number.NaN;
    const feeAmountRaw = parseNumber(pricing.effectiveFeeAmount ?? pricing.baseFeeAmount);
    const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN;
    const totalDebitRaw = parseNumber(pricing.payAmount);
    const totalDebit = Number.isFinite(totalDebitRaw)
        ? totalDebitRaw
        : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
            ? sendAmount + feeAmount
            : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmountRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(promotionalRate) && !Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const requestedPayin = (0, code_map_1.mapSendwavePayinMethod)(request.payin_method);
    const payinMethod = requestedPayin === 'debit_card' || requestedPayin === 'credit_card'
        ? requestedPayin
        : 'debit_card';
    if (requestedPayin !== 'other' && requestedPayin !== payinMethod) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const selectedPayout = (0, code_map_1.mapSendwavePayoutMethod)(payload.payoutMethod
        ?? payload.segmentName);
    const payoutMethod = selectedPayout !== 'other'
        ? selectedPayout
        : request.payout_method || 'bank_deposit';
    if (request.payout_method && payoutMethod !== request.payout_method) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(totalDebit)
            ? totalDebit
            : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'sendwave_quote_v1',
        parse_flags: flags,
    };
};
exports.parseSendwavePayload = parseSendwavePayload;
