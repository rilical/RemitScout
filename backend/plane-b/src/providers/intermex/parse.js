"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIntermexPayload = exports.extractIntermexMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(String(value).replace(/[^0-9.+-Ee]/g, ''));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const resolvePaymentMethod = (methods, requested, flags = []) => {
    if (!methods.length)
        return null;
    const requestedToken = (0, code_map_1.normalizeMethodToken)(requested);
    if (requestedToken) {
        const match = methods.find((method) => {
            const mapped = (0, code_map_1.mapPayinMethod)(method.senderPaymentMethodId ?? method.senderPaymentMethodName);
            return (0, code_map_1.normalizeMethodToken)(mapped) === requestedToken;
        });
        if (match)
            return match;
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return methods[0] ?? null;
};
const extractIntermexMethodPairs = (payload) => {
    const pairs = new Map();
    const methods = Array.isArray(payload.paymentMethods)
        ? payload.paymentMethods ?? []
        : [];
    const deliveryMethods = Array.isArray(payload.deliveryMethodsList)
        ? payload.deliveryMethodsList ?? []
        : [];
    const payins = new Set();
    for (const method of methods) {
        const mapped = (0, code_map_1.mapPayinMethod)(method.senderPaymentMethodId ?? method.senderPaymentMethodName);
        if (mapped !== 'other')
            payins.add(mapped);
    }
    if (payins.size === 0) {
        payins.add('debit_card');
    }
    const payouts = new Set();
    if (deliveryMethods.length) {
        for (const method of deliveryMethods) {
            const mapped = (0, code_map_1.mapPayoutMethod)(method.tranTypeId ?? method.tranTypeName ?? method.deliveryMethod);
            if (mapped !== 'other')
                payouts.add(mapped);
        }
    }
    if (payouts.size === 0) {
        payouts.add('bank_deposit');
        payouts.add('cash_pickup');
    }
    for (const payin of payins) {
        for (const payout of payouts) {
            const key = `${payin}:${payout}`;
            if (!pairs.has(key)) {
                pairs.set(key, { payin_method: payin, payout_method: payout });
            }
        }
    }
    return Array.from(pairs.values());
};
exports.extractIntermexMethodPairs = extractIntermexMethodPairs;
const parseIntermexPayload = (payload, request) => {
    const flags = [];
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(payload.origAmount ?? request.send_amount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    let receiveAmount = parseNumber(payload.destAmount);
    const exchangeRate = parseNumber(payload.rate);
    if (!Number.isFinite(receiveAmount) && Number.isFinite(exchangeRate)) {
        receiveAmount = sendAmount * exchangeRate;
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const paymentMethods = Array.isArray(payload.paymentMethods) ? payload.paymentMethods : [];
    const selectedPayment = resolvePaymentMethod(paymentMethods, request.payin_method, flags);
    let feeAmount = parseNumber(selectedPayment?.feeAmount ?? payload.feeAmount);
    const discountAmount = parseNumber(payload.discountAmount);
    let promotionalFeeAmount = null;
    if (Number.isFinite(feeAmount) && Number.isFinite(discountAmount) && discountAmount > 0) {
        promotionalFeeAmount = feeAmount;
        feeAmount = feeAmount + discountAmount;
    }
    if (!Number.isFinite(receiveAmount) || !Number.isFinite(exchangeRate) || !Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    if (!Number.isFinite(feeAmount)) {
        feeAmount = 0;
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const totalAmount = parseNumber(payload.totalAmount);
    const totalDebitAmount = Number.isFinite(totalAmount)
        ? totalAmount
        : sendAmount + (promotionalFeeAmount ?? feeAmount);
    const payin = selectedPayment
        ? (0, code_map_1.mapPayinMethod)(selectedPayment.senderPaymentMethodId ?? selectedPayment.senderPaymentMethodName)
        : (request.payin_method ?? 'other');
    const payout = request.payout_method ?? 'other';
    if (payin === 'other' || payout === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    return {
        send_amount: sendAmount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(totalDebitAmount) ? totalDebitAmount : sendAmount,
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency ?? null,
        exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: null,
        base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'intermex_v1',
        parse_flags: flags,
    };
};
exports.parseIntermexPayload = parseIntermexPayload;
