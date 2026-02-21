"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRemitbeePayload = exports.extractRemitbeeMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_');
const mapPayin = (code, label) => {
    const candidates = [code, label].filter((value) => Boolean(value));
    for (const candidate of candidates) {
        const token = normalizeToken(candidate);
        if (code_map_1.payinMethodMap[candidate])
            return code_map_1.payinMethodMap[candidate];
        if (code_map_1.payinMethodMap[token])
            return code_map_1.payinMethodMap[token];
        if (token.includes('debit'))
            return 'debit_card';
        if (token.includes('credit'))
            return 'credit_card';
        if (token.includes('interac') || token.includes('transfer') || token.includes('bank')) {
            return 'bank_transfer';
        }
        if (token.includes('card'))
            return 'debit_card';
    }
    return 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'bank_deposit';
    const token = normalizeToken(code);
    if (code_map_1.payoutMethodMap[code])
        return code_map_1.payoutMethodMap[code];
    if (code_map_1.payoutMethodMap[token])
        return code_map_1.payoutMethodMap[token];
    if (token.includes('cash'))
        return 'cash_pickup';
    if (token.includes('wallet'))
        return 'mobile_wallet';
    return 'bank_deposit';
};
const getPaymentTypes = (payload) => {
    return Array.isArray(payload.payment_types) ? payload.payment_types : [];
};
const extractRemitbeeMethodPairs = (payload) => {
    const pairs = new Map();
    const paymentTypes = getPaymentTypes(payload);
    for (const paymentType of paymentTypes) {
        const payin = mapPayin(paymentType.payment_type, paymentType.label);
        const payout = mapPayout(null);
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    if (!pairs.size) {
        pairs.set('debit_card:bank_deposit', {
            payin_method: 'debit_card',
            payout_method: 'bank_deposit',
        });
    }
    return Array.from(pairs.values());
};
exports.extractRemitbeeMethodPairs = extractRemitbeeMethodPairs;
const selectPaymentType = (paymentTypes, request, flags) => {
    if (!paymentTypes.length) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
        return {
            payin: request.payin_method || 'debit_card',
            payout: request.payout_method || 'bank_deposit',
            payment: null,
        };
    }
    const mapped = paymentTypes.map((payment) => ({
        payment,
        payin: mapPayin(payment.payment_type, payment.label),
        payout: mapPayout(null),
    }));
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    if (requestedPayin && requestedPayout) {
        const match = mapped.find((item) => item.payin === requestedPayin && item.payout === requestedPayout);
        if (match) {
            return { payin: match.payin, payout: match.payout, payment: match.payment };
        }
    }
    if (requestedPayin) {
        const match = mapped.find((item) => item.payin === requestedPayin);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { payin: match.payin, payout: match.payout, payment: match.payment };
        }
    }
    if (requestedPayout) {
        const match = mapped.find((item) => item.payout === requestedPayout);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { payin: match.payin, payout: match.payout, payment: match.payment };
        }
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    const fallback = mapped[0];
    return { payin: fallback.payin, payout: fallback.payout, payment: fallback.payment };
};
const parseRemitbeePayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(payload.transfer_amount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const receiveAmountRaw = parseNumber(payload.receiving_amount);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    let baseRate = parseNumber(payload.rate);
    if (!Number.isFinite(baseRate)) {
        baseRate = parseNumber(payload.cumulative_rate);
    }
    if (!Number.isFinite(baseRate)) {
        baseRate = parseNumber(payload.spot_rate);
    }
    const promotionalRate = parseNumber(payload.special_rate);
    const promotionalCap = parseNumber(payload.special_rate_transfer_amount_limit);
    const { payin, payout, payment } = selectPaymentType(getPaymentTypes(payload), request, flags);
    const feeAmountRaw = parseNumber(payment?.fees);
    const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN;
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const deliveryMinutesRaw = parseNumber(payment?.timeline?.settlement_timeline?.predicted_minutes);
    const deliveryMinutes = Number.isFinite(deliveryMinutesRaw) ? deliveryMinutesRaw : null;
    const feeValue = Number.isFinite(feeAmount) ? feeAmount : 0;
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: feeValue,
        total_debit_amount: sendAmount + feeValue,
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency ?? null,
        promotional_fee_amount: null,
        promotional_rate: Number.isFinite(promotionalRate) ? promotionalRate : null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: Number.isFinite(promotionalCap) ? promotionalCap : null,
        delivery_time_min_minutes: deliveryMinutes,
        delivery_time_max_minutes: deliveryMinutes,
        collected_at: new Date().toISOString(),
        parser_version: 'remitbee_v1',
        parse_flags: flags,
    };
};
exports.parseRemitbeePayload = parseRemitbeePayload;
