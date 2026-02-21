"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBossMoneyPayload = exports.extractBossMoneyMethodPairs = void 0;
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
const isEntryEnabled = (entry) => {
    if (!entry)
        return false;
    const status = entry.status?.toLowerCase();
    if (status && status !== 'available')
        return false;
    if (entry.is_enabled === false)
        return false;
    return true;
};
const resolveMethodFee = (entries, payinMethod) => {
    if (!entries || entries.length === 0) {
        return { fee: Number.NaN, matched: false };
    }
    const matching = entries.filter((entry) => (0, code_map_1.mapPayinMethod)(entry.payment_method) === payinMethod);
    if (matching.length === 0) {
        return { fee: Number.NaN, matched: false };
    }
    const preferred = matching.find(isEntryEnabled) ?? matching[0];
    return { fee: parseNumber(preferred.fee), matched: true };
};
const extractBossMoneyMethodPairs = (payload) => {
    const pairs = new Map();
    const entries = payload?.pricing_fee?.fees_by_payment_method ?? [];
    for (const entry of entries) {
        const payin = (0, code_map_1.mapPayinMethod)(entry.payment_method);
        if (payin === 'other')
            continue;
        const payout = 'bank_deposit';
        pairs.set(`${payin}:${payout}`, { payin_method: payin, payout_method: payout });
    }
    if (pairs.size === 0) {
        pairs.set('bank_transfer:bank_deposit', {
            payin_method: 'bank_transfer',
            payout_method: 'bank_deposit',
        });
    }
    return Array.from(pairs.values());
};
exports.extractBossMoneyMethodPairs = extractBossMoneyMethodPairs;
const parseBossMoneyPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(payload.amounts?.sender);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const receiveAmountRaw = parseNumber(payload.amounts?.recipient);
    const promotionalRateRaw = parseNumber(payload.fx_rates?.sell_rate);
    const baseRateRaw = parseNumber(payload.fx_rates?.base_sell_rate);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(promotionalRateRaw)
            ? sendAmount * promotionalRateRaw
            : Number.isFinite(baseRateRaw)
                ? sendAmount * baseRateRaw
                : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    if (!Number.isFinite(promotionalRateRaw) && !Number.isFinite(baseRateRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const requestedPayin = (0, code_map_1.mapPayinMethod)(request.payin_method);
    const payinMethod = requestedPayin !== 'other' ? requestedPayin : 'bank_transfer';
    if (requestedPayin === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    const requestedPayout = (0, code_map_1.mapPayoutMethod)(request.payout_method);
    const payoutMethod = requestedPayout !== 'other' ? requestedPayout : 'bank_deposit';
    if (requestedPayout === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    const { fee: methodFee, matched } = resolveMethodFee(payload.pricing_fee?.fees_by_payment_method, payinMethod);
    if (!matched) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const baseFeeRaw = Number.isFinite(methodFee)
        ? methodFee
        : parseNumber(payload.pricing_fee?.fee);
    const actualFeeRaw = Number.isFinite(parseNumber(payload.fee?.fee))
        ? parseNumber(payload.fee?.fee)
        : Number.isFinite(methodFee)
            ? methodFee
            : parseNumber(payload.pricing_fee?.fee);
    if (!Number.isFinite(actualFeeRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const promotionalFeeAmount = Number.isFinite(baseFeeRaw)
        && Number.isFinite(actualFeeRaw)
        && baseFeeRaw > actualFeeRaw
        ? actualFeeRaw
        : null;
    const feeCurrency = payload.pricing_fee?.currency_code
        ?? payload.fee?.currency_code
        ?? sourceCurrency;
    const promoCapRaw = parseNumber(payload.free_transaction?.max_amount);
    const promotionalCapAmount = Number.isFinite(promoCapRaw) ? promoCapRaw : null;
    return {
        send_amount: Number.isFinite(sendAmount) ? sendAmount : 0,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(actualFeeRaw) ? actualFeeRaw : 0,
        total_debit_amount: Number.isFinite(actualFeeRaw)
            ? sendAmount + actualFeeRaw
            : sendAmount,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: feeCurrency ?? sourceCurrency,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
        base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
        promotional_cap_amount: promotionalCapAmount,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'bossmoney_promo_calc_v1',
        parse_flags: flags,
    };
};
exports.parseBossMoneyPayload = parseBossMoneyPayload;
