"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInstaremPayload = exports.extractInstaremMethodPairs = void 0;
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
const sumNumbers = (values) => {
    let total = 0;
    let hasValue = false;
    for (const value of values) {
        const parsed = parseNumber(value ?? null);
        if (Number.isFinite(parsed)) {
            total += parsed;
            hasValue = true;
        }
    }
    return hasValue ? total : Number.NaN;
};
const extractPaymentMethods = (payload) => {
    if (Array.isArray(payload.payment_methods))
        return payload.payment_methods;
    if (Array.isArray(payload.data)) {
        return payload.data;
    }
    return [];
};
const methodDescriptor = (method) => method ? [method.text, method.code, method.icon_url].filter(Boolean).join(' ') : '';
const resolvePayinMethod = (payload, request, flags) => {
    const selected = payload.selected_payment_method;
    if (selected) {
        const mapped = (0, code_map_1.mapPayinMethod)(methodDescriptor(selected));
        if (mapped !== 'other')
            return mapped;
    }
    const methods = extractPaymentMethods(payload);
    const desired = (0, code_map_1.normalizeMethodToken)(request.payin_method);
    if (desired) {
        const match = methods.find((method) => (0, code_map_1.mapPayinMethod)(methodDescriptor(method)) === request.payin_method);
        if (match)
            return (0, code_map_1.mapPayinMethod)(methodDescriptor(match));
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return request.payin_method || 'other';
};
const resolvePayoutMethod = (payload, flags) => {
    const quote = payload.quote;
    const explicitValue = quote?.payout_method ?? quote?.payout_method_code ?? quote?.payout_method_type ?? null;
    const explicit = (0, code_map_1.mapPayoutMethod)(explicitValue ? String(explicitValue) : null);
    if (explicit && explicit !== 'other')
        return explicit;
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return 'bank_deposit';
};
const extractInstaremMethodPairs = (payload) => {
    const methods = extractPaymentMethods(payload);
    if (!methods.length)
        return [];
    return methods.map((method) => ({
        payin_method: (0, code_map_1.mapPayinMethod)(methodDescriptor(method)),
        payout_method: 'bank_deposit',
    }));
};
exports.extractInstaremMethodPairs = extractInstaremMethodPairs;
const getQuoteData = (payload) => {
    if (payload.quote && typeof payload.quote === 'object')
        return payload.quote;
    if (payload.data && typeof payload.data === 'object')
        return payload.data;
    return null;
};
const resolveFeeCurrency = (quote, request) => {
    const currency = quote.source_currency ?? quote.transaction_config?.source_currency;
    if (currency && typeof currency === 'string')
        return currency;
    const corridorCurrency = request.corridor_id.split('-')[2];
    return corridorCurrency ? corridorCurrency.toUpperCase() : null;
};
const parseInstaremPayload = (payload, request) => {
    const flags = [];
    const quote = getQuoteData(payload);
    if (!quote) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const sendAmount = [quote.gross_source_amount, quote.net_source_amount, quote.net_of_fee_amount]
        .map(value => parseNumber(value))
        .find(value => Number.isFinite(value)) ?? Number(request.send_amount);
    const receiveAmount = parseNumber(quote.destination_amount);
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const taxAmount = Number.isFinite(parseNumber(quote.net_tax_amount))
        ? parseNumber(quote.net_tax_amount)
        : sumNumbers([quote.tax_amount_1, quote.tax_amount_2, quote.tax_amount_3]);
    const actualFeeFallback = parseNumber(quote.transaction_config?.total_fee_amount);
    const actualFeeParts = sumNumbers([
        quote.transaction_fee_amount,
        quote.payment_method_fee_amount,
        quote.payout_method_fee_amount,
    ]);
    const actualFee = Number.isFinite(actualFeeParts)
        ? actualFeeParts + (Number.isFinite(taxAmount) ? taxAmount : 0)
        : actualFeeFallback;
    const regularFeeFallback = parseNumber(quote.transaction_config?.regular_total_fee_amount);
    const regularFeeParts = sumNumbers([
        quote.regular_transaction_fee_amount,
        quote.regular_payment_method_fee_amount,
        quote.regular_payout_method_fee_amount,
    ]);
    const regularFee = Number.isFinite(regularFeeParts)
        ? regularFeeParts + (Number.isFinite(taxAmount) ? taxAmount : 0)
        : regularFeeFallback;
    let feeAmount = Number.isFinite(actualFee) ? actualFee : Number.NaN;
    let promotionalFeeAmount = null;
    if (Number.isFinite(regularFee) && Number.isFinite(actualFee) && regularFee > actualFee) {
        feeAmount = regularFee;
        promotionalFeeAmount = actualFee;
    }
    if (!Number.isFinite(feeAmount)) {
        feeAmount = 0;
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const appliedRate = parseNumber(quote.instarem_fx_rate) || parseNumber(quote.fx_rate);
    const baseRate = parseNumber(quote.regular_instarem_fx_rate) || parseNumber(quote.fx_rate);
    const promoRate = Number.isFinite(baseRate) && Number.isFinite(appliedRate) && appliedRate !== baseRate
        ? appliedRate
        : null;
    if (!Number.isFinite(appliedRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payinMethod = resolvePayinMethod(payload, request, flags);
    const payoutMethod = resolvePayoutMethod(payload, flags);
    if (payinMethod === 'other' || payoutMethod === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: feeAmount,
        total_debit_amount: sendAmount + (promotionalFeeAmount ?? feeAmount),
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: resolveFeeCurrency(quote, request),
        exchange_rate: Number.isFinite(appliedRate) ? appliedRate : null,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: promoRate,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'instarem_v1',
        parse_flags: flags,
    };
};
exports.parseInstaremPayload = parseInstaremPayload;
