"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMukuruPayload = exports.getMukuruErrorMessages = exports.extractMukuruMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.mukuru.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const parseRate = (value) => {
    if (!value)
        return Number.NaN;
    const match = value.match(/:([^\s]+)/);
    if (!match)
        return Number.NaN;
    return parseNumber(match[1]);
};
const findBreakdownAmount = (breakdown, matcher) => {
    if (!breakdown || typeof breakdown !== 'object')
        return Number.NaN;
    for (const [key, entry] of Object.entries(breakdown)) {
        if (!matcher(key))
            continue;
        if (entry && typeof entry === 'object' && 'amount' in entry) {
            return parseNumber(entry.amount);
        }
    }
    return Number.NaN;
};
const getQuoteError = (quote) => {
    if (!quote)
        return 'Missing quote response';
    if (typeof quote === 'string')
        return quote;
    if (quote.status && quote.status !== 'success') {
        return quote.message ?? 'Mukuru quote returned error';
    }
    return null;
};
const resolveProducts = (payload) => {
    if (!payload?.products)
        return [];
    return Array.isArray(payload.products) ? payload.products : [];
};
const extractMukuruMethodPairs = (payload) => {
    const pairs = new Map();
    const products = resolveProducts(payload);
    const payin = 'bank_transfer';
    for (const product of products) {
        const payout = (0, code_map_1.mapMukuruPayoutMethod)(product.title);
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractMukuruMethodPairs = extractMukuruMethodPairs;
const getMukuruErrorMessages = (payload) => {
    const messages = [];
    if (!payload)
        return ['Missing payload'];
    if (!payload.products || payload.products.length === 0) {
        messages.push('No products returned');
    }
    const quote = payload.quote;
    if (!quote) {
        messages.push('Missing quote response');
        return messages;
    }
    if (typeof quote === 'string') {
        messages.push(quote);
        return messages;
    }
    if (quote.status && quote.status !== 'success') {
        if (quote.message) {
            messages.push(quote.message);
        }
        else {
            messages.push(`Quote status: ${quote.status}`);
        }
    }
    return messages;
};
exports.getMukuruErrorMessages = getMukuruErrorMessages;
const parseMukuruPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const quote = payload.quote;
    const error = getQuoteError(quote);
    if (error) {
        logger.warn('mukuru_parse_error', {
            corridor_id: request.corridor_id,
            error,
        });
        return null;
    }
    if (!quote || typeof quote !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const data = quote.data;
    if (!data) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = parseNumber(data.payin_amount);
    const receiveAmount = parseNumber(data.payout_amount);
    const rate = parseRate(data.rate_message);
    const feeFromMessage = parseNumber(data.charge_message);
    const payinBreakdown = data.breakdown?.payin;
    const feeFromBreakdown = findBreakdownAmount(payinBreakdown, key => key.toLowerCase().includes('charge'));
    const totalFromBreakdown = findBreakdownAmount(payinBreakdown, key => key.toLowerCase().includes('total'));
    const feeAmount = Number.isFinite(feeFromBreakdown)
        ? feeFromBreakdown
        : Number.isFinite(feeFromMessage)
            ? feeFromMessage
            : Number.NaN;
    const totalDebit = Number.isFinite(totalFromBreakdown)
        ? totalFromBreakdown
        : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
            ? sendAmount + feeAmount
            : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(rate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (payload.sourceCurrency && payload.sourceCurrency !== sourceCurrency) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payinMethod = (0, code_map_1.mapMukuruPayinMethod)(request.payin_method);
    const selectedPayout = payload.payoutMethod || (0, code_map_1.mapMukuruPayoutMethod)(request.payout_method);
    const payoutMethod = selectedPayout !== 'other' ? selectedPayout : request.payout_method;
    if (request.payout_method && payoutMethod !== request.payout_method) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(totalDebit) ? totalDebit : sendAmount,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(rate) ? rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'mukuru_quote_v1',
        parse_flags: flags,
    };
};
exports.parseMukuruPayload = parseMukuruPayload;
