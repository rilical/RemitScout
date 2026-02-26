"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRemitlyPayload = exports.extractRemitlyMethodPairs = void 0;
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const mapPayin = (code) => {
    if (!code)
        return 'other';
    return code_map_1.payinMethodMap[code] ?? 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'bank_deposit';
    const normalized = code.trim();
    if (!normalized)
        return 'bank_deposit';
    return code_map_1.payoutMethodMap[normalized] ?? 'other';
};
/**
 * Determines delivery time based on payment method (heuristic mapping):
 * - Bank transfers: 1-3 days (1440-4320 minutes)
 * - Card payments (debit/credit): In minutes (15-60 minutes)
 */
const getDeliveryTimeForPayinMethod = (payinMethod) => {
    if (payinMethod === 'bank_transfer') {
        // Bank transfers: 1-3 days
        return { min: 1440, max: 4320 };
    }
    if (payinMethod === 'debit_card' || payinMethod === 'credit_card') {
        // Card payments: In minutes (typically 15-60 minutes)
        return { min: 15, max: 60 };
    }
    // Default: unknown delivery time
    return { min: null, max: null };
};
const getEstimates = (payload) => {
    const list = payload.pay_out_price_estimates?.estimates;
    const estimates = Array.isArray(list) && list.length > 0
        ? [...list]
        : [];
    if (payload.estimate) {
        estimates.push(payload.estimate);
    }
    return estimates;
};
const extractRemitlyMethodPairs = (payload) => {
    const pairs = new Map();
    for (const estimate of getEstimates(payload)) {
        const payin = mapPayin(estimate.pay_in_method);
        const payout = mapPayout(estimate.pay_out_method);
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractRemitlyMethodPairs = extractRemitlyMethodPairs;
const selectEstimate = (estimates, request) => {
    const flags = [];
    if (!estimates.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { estimate: null, parse_flags: flags };
    }
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    if (requestedPayin && requestedPayout) {
        const match = estimates.find((item) => {
            const payin = mapPayin(item.pay_in_method);
            const payout = mapPayout(item.pay_out_method);
            return payin === requestedPayin && payout === requestedPayout;
        });
        if (match)
            return { estimate: match, parse_flags: flags };
    }
    if (requestedPayout) {
        const match = estimates.find((item) => {
            const payout = mapPayout(item.pay_out_method);
            return payout === requestedPayout;
        });
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { estimate: match, parse_flags: flags };
        }
    }
    if (requestedPayin) {
        const match = estimates.find((item) => {
            const payin = mapPayin(item.pay_in_method);
            return payin === requestedPayin;
        });
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { estimate: match, parse_flags: flags };
        }
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { estimate: estimates[0], parse_flags: flags };
};
const parseRemitlyPayload = (payload, request) => {
    const estimates = getEstimates(payload);
    const { estimate, parse_flags } = selectEstimate(estimates, request);
    if (!estimate)
        return null;
    const sendAmount = parseNumber(estimate.send_amount);
    const receiveAmount = parseNumber(estimate.receive_amount);
    const feeAmount = parseNumber(estimate.fee?.total_fee_amount);
    const totalChargeAmount = parseNumber(estimate.total_charge_amount);
    const promotionalRate = parseNumber(estimate.exchange_rate?.promotional_exchange_rate);
    const baseRate = parseNumber(estimate.exchange_rate?.base_rate);
    const promotionalCapAmount = parseNumber(estimate.exchange_rate?.capped_promotional_exchange_rate_amount);
    const feeDiscountAmount = parseNumber(estimate.discount?.fee_discount_amount);
    const payin = mapPayin(estimate.pay_in_method);
    const payout = mapPayout(estimate.pay_out_method);
    const feeCurrency = estimate.conduit?.source_currency?.alpha3 ?? null;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    const promotionalFeeAmount = Number.isFinite(feeDiscountAmount) && feeDiscountAmount > 0
        ? feeDiscountAmount
        : null;
    // Determine delivery time based on payment method heuristic
    const deliveryTime = getDeliveryTimeForPayinMethod(payin);
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(totalChargeAmount)
            ? totalChargeAmount
            : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
                ? sendAmount + feeAmount
                : sendAmount,
        payin_method: payin,
        payout_method: payout,
        fee_currency: feeCurrency,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: Number.isFinite(promotionalCapAmount) ? promotionalCapAmount : null,
        delivery_time_min_minutes: deliveryTime.min,
        delivery_time_max_minutes: deliveryTime.max,
        collected_at: new Date().toISOString(),
        parser_version: 'remitly_estimate_v2', // Updated version to reflect new logic
        parse_flags,
    };
};
exports.parseRemitlyPayload = parseRemitlyPayload;
