"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXePayload = exports.extractXeMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.xe.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const normalizeToken = (value) => value.trim().toLowerCase().replace(/\s+/g, '_');
const mapPayin = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    return code_map_1.payinMethodMap[code] ?? code_map_1.payinMethodMap[token] ?? 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    return code_map_1.payoutMethodMap[code] ?? code_map_1.payoutMethodMap[token] ?? 'other';
};
const parseDeliveryWindow = (value) => {
    if (!value)
        return { min: null, max: null };
    const text = value.toLowerCase();
    const dayRange = text.match(/(\d+)\s*-\s*(\d+)\s*day/);
    if (dayRange) {
        const min = Number(dayRange[1]) * 1440;
        const max = Number(dayRange[2]) * 1440;
        return { min, max };
    }
    const hourRange = text.match(/(\d+)\s*-\s*(\d+)\s*hour/);
    if (hourRange) {
        const min = Number(hourRange[1]) * 60;
        const max = Number(hourRange[2]) * 60;
        return { min, max };
    }
    const daySingle = text.match(/(\d+)\s*(?:business\s*)?day/);
    if (daySingle) {
        const minutes = Number(daySingle[1]) * 1440;
        return { min: minutes, max: minutes };
    }
    const hourSingle = text.match(/(\d+)\s*hour/);
    if (hourSingle) {
        const minutes = Number(hourSingle[1]) * 60;
        return { min: minutes, max: minutes };
    }
    const minuteSingle = text.match(/(\d+)\s*minute/);
    if (minuteSingle) {
        const minutes = Number(minuteSingle[1]);
        return { min: minutes, max: minutes };
    }
    if (text.includes('within 24 hours') || text.includes('same day')) {
        return { min: 60, max: 1440 };
    }
    if (text.includes('instant') || text.includes('minutes')) {
        return { min: 15, max: 60 };
    }
    return { min: null, max: null };
};
const getQuotes = (payload) => {
    return payload.quote?.individualQuotes ?? [];
};
const extractXeMethodPairs = (payload) => {
    const pairs = new Map();
    for (const quote of getQuotes(payload)) {
        const payout = mapPayout(quote.deliveryMethod ?? 'bank_deposit');
        const payin = mapPayin('bank_transfer');
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractXeMethodPairs = extractXeMethodPairs;
const selectQuote = (quotes, request) => {
    const flags = [];
    if (!quotes.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { quote: null, parse_flags: flags };
    }
    const requestedPayout = request.payout_method;
    if (requestedPayout) {
        const match = quotes.find((item) => mapPayout(item.deliveryMethod ?? '') === requestedPayout);
        if (match)
            return { quote: match, parse_flags: flags };
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { quote: quotes[0] ?? null, parse_flags: flags };
};
const parseXePayload = (payload, request) => {
    if (payload.errorMessages && Object.keys(payload.errorMessages).length > 0) {
        logger.warn('xe_parse_error_messages', {
            corridor_id: request.corridor_id,
            error_messages: payload.errorMessages,
        });
        return null;
    }
    const { quote, parse_flags } = selectQuote(getQuotes(payload), request);
    if (!quote)
        return null;
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = request.send_amount;
    const rate = parseNumber(quote.rate);
    const receiveAmountValue = parseNumber(quote.buyAmount);
    const feeAmount = parseNumber(quote.transferFee);
    const payout = mapPayout(quote.deliveryMethod ?? 'bank_deposit');
    const payin = mapPayin('bank_transfer');
    const deliveryWindow = parseDeliveryWindow(quote.leadTime);
    const receiveAmount = Number.isFinite(receiveAmountValue)
        ? receiveAmountValue
        : Number.isFinite(rate)
            ? sendAmount * rate
            : Number.NaN;
    if (!Number.isFinite(rate) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    return {
        send_amount: sendAmount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(rate) ? rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryWindow.min,
        delivery_time_max_minutes: deliveryWindow.max,
        collected_at: new Date().toISOString(),
        parser_version: 'xe_quote_v1',
        parse_flags,
    };
};
exports.parseXePayload = parseXePayload;
