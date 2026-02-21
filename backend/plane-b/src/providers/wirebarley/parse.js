"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWireBarleyPayload = exports.extractWireBarleyMethodPairs = void 0;
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
const getExRates = (payload) => {
    if (!payload || typeof payload !== 'object')
        return [];
    if (Array.isArray(payload.data?.exRates)) {
        return payload.data?.exRates ?? [];
    }
    if (Array.isArray(payload.exRates)) {
        return payload.exRates ?? [];
    }
    return [];
};
const isAmountWithin = (fee, amount) => {
    const min = parseNumber(fee.min);
    const max = parseNumber(fee.max);
    const aboveMin = Number.isFinite(min) ? amount >= min : true;
    const belowMax = Number.isFinite(max) ? amount <= max : true;
    return aboveMin && belowMax;
};
const selectTierFee = (fee, amount, useDiscount) => {
    const fee1 = parseNumber(useDiscount ? fee.discountFee1 : fee.fee1);
    const fee2 = parseNumber(useDiscount ? fee.discountFee2 : fee.fee2);
    const fee3 = parseNumber(useDiscount ? fee.discountFee3 : fee.fee3);
    const threshold1 = parseNumber(fee.threshold1);
    const threshold2 = parseNumber(fee.threshold2);
    if (!Number.isFinite(threshold1)) {
        return Number.isFinite(fee1) ? fee1 : Number.NaN;
    }
    if (amount <= threshold1) {
        return Number.isFinite(fee1) ? fee1 : Number.NaN;
    }
    if (!Number.isFinite(threshold2)) {
        return Number.isFinite(fee2) ? fee2 : Number.isFinite(fee1) ? fee1 : Number.NaN;
    }
    if (amount <= threshold2) {
        return Number.isFinite(fee2) ? fee2 : Number.isFinite(fee1) ? fee1 : Number.NaN;
    }
    if (Number.isFinite(fee3))
        return fee3;
    if (Number.isFinite(fee2))
        return fee2;
    return Number.isFinite(fee1) ? fee1 : Number.NaN;
};
const resolveFeeForEntry = (fee, amount) => {
    const regularFee = selectTierFee(fee, amount, false);
    const discountFee = selectTierFee(fee, amount, true);
    const useDiscount = Boolean(fee.useDiscountFee);
    const actualFee = useDiscount && Number.isFinite(discountFee) ? discountFee : regularFee;
    return {
        regular: regularFee,
        actual: actualFee,
    };
};
const selectBestFee = (fees, requestedMethod, mapper, amount) => {
    if (!fees.length)
        return null;
    const matches = fees.filter((entry) => mapper(entry.option) === requestedMethod);
    const candidates = matches.length ? matches : fees;
    const applicable = candidates.filter((entry) => isAmountWithin(entry, amount));
    const scoped = applicable.length ? applicable : candidates;
    let best = null;
    let bestFee = Number.POSITIVE_INFINITY;
    for (const entry of scoped) {
        const { actual } = resolveFeeForEntry(entry, amount);
        if (Number.isFinite(actual) && actual < bestFee) {
            best = entry;
            bestFee = actual;
        }
    }
    return best ?? scoped[0] ?? null;
};
const buildRateTiers = (rateData, fallbackRate) => {
    const tiers = [];
    const pushTier = (thresholdValue, rateValue) => {
        const rate = parseNumber(rateValue);
        if (!Number.isFinite(rate))
            return;
        const threshold = parseNumber(thresholdValue);
        if (!Number.isFinite(threshold))
            return;
        tiers.push({ threshold, rate });
    };
    if (rateData) {
        pushTier(rateData.threshold, rateData.wbRate);
        pushTier(rateData.threshold1, rateData.wbRate1);
        pushTier(rateData.threshold2, rateData.wbRate2);
        pushTier(rateData.threshold3, rateData.wbRate3);
        pushTier(rateData.threshold4, rateData.wbRate4);
        pushTier(rateData.threshold5, rateData.wbRate5);
        pushTier(rateData.threshold6, rateData.wbRate6);
        pushTier(rateData.threshold7, rateData.wbRate7);
        pushTier(rateData.threshold8, rateData.wbRate8);
        pushTier(null, rateData.wbRate9);
    }
    if (!tiers.length && Number.isFinite(fallbackRate)) {
        tiers.push({ threshold: 0, rate: fallbackRate });
    }
    return tiers.sort((a, b) => a.threshold - b.threshold);
};
const resolveRate = (rateData, fallbackRate, amount, flags) => {
    const tiers = buildRateTiers(rateData, fallbackRate);
    if (!tiers.length) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
        return Number.NaN;
    }
    let selected = tiers[0];
    for (const tier of tiers) {
        if (amount >= tier.threshold) {
            selected = tier;
        }
    }
    return selected.rate;
};
const resolvePayinMethod = (entry, request, flags) => {
    const mapped = entry ? (0, code_map_1.mapPayinMethod)(entry.option) : 'other';
    if (mapped !== 'other')
        return mapped;
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return request.payin_method || 'other';
};
const resolvePayoutMethod = (entry, request, flags) => {
    const mapped = entry ? (0, code_map_1.mapPayoutMethod)(entry.option) : 'other';
    if (mapped !== 'other')
        return mapped;
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return request.payout_method || 'other';
};
const extractWireBarleyMethodPairs = (payload) => {
    const pairs = new Map();
    const exRates = getExRates(payload);
    for (const rate of exRates) {
        const payins = new Set();
        const payouts = new Set();
        for (const fee of rate.paymentFees ?? []) {
            const mapped = (0, code_map_1.mapPayinMethod)(fee.option);
            if (mapped && mapped !== 'other')
                payins.add(mapped);
        }
        for (const fee of rate.transferFees ?? []) {
            const mapped = (0, code_map_1.mapPayoutMethod)(fee.option);
            if (mapped && mapped !== 'other')
                payouts.add(mapped);
        }
        if (payins.size === 0)
            payins.add('bank_transfer');
        if (payouts.size === 0)
            payouts.add('bank_deposit');
        for (const payin of payins) {
            for (const payout of payouts) {
                const key = `${payin}:${payout}`;
                if (!pairs.has(key)) {
                    pairs.set(key, { payin_method: payin, payout_method: payout });
                }
            }
        }
    }
    return Array.from(pairs.values());
};
exports.extractWireBarleyMethodPairs = extractWireBarleyMethodPairs;
const parseWireBarleyPayload = (payload, request) => {
    const flags = [];
    const { destCountry, destCurrency, sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const exRates = getExRates(payload);
    const selectedRate = exRates.find((rate) => rate.country?.toUpperCase() === destCountry && rate.currency?.toUpperCase() === destCurrency);
    if (!selectedRate) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const sendAmount = request.send_amount;
    const baseRate = parseNumber(selectedRate.baseRate);
    const fallbackRate = parseNumber(selectedRate.wbRate);
    const exchangeRate = resolveRate(selectedRate.wbRateData ?? null, fallbackRate, sendAmount, flags);
    if (!Number.isFinite(exchangeRate)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const receiveAmount = sendAmount * exchangeRate;
    if (!Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const payinEntry = selectBestFee(selectedRate.paymentFees ?? [], request.payin_method, code_map_1.mapPayinMethod, sendAmount);
    const payoutEntry = selectBestFee(selectedRate.transferFees ?? [], request.payout_method, code_map_1.mapPayoutMethod, sendAmount);
    const payinFee = payinEntry ? resolveFeeForEntry(payinEntry, sendAmount) : { regular: Number.NaN, actual: Number.NaN };
    const payoutFee = payoutEntry ? resolveFeeForEntry(payoutEntry, sendAmount) : { regular: Number.NaN, actual: Number.NaN };
    const regularFee = Number.isFinite(payinFee.regular) || Number.isFinite(payoutFee.regular)
        ? (Number.isFinite(payinFee.regular) ? payinFee.regular : 0)
            + (Number.isFinite(payoutFee.regular) ? payoutFee.regular : 0)
        : Number.NaN;
    const actualFee = Number.isFinite(payinFee.actual) || Number.isFinite(payoutFee.actual)
        ? (Number.isFinite(payinFee.actual) ? payinFee.actual : 0)
            + (Number.isFinite(payoutFee.actual) ? payoutFee.actual : 0)
        : Number.NaN;
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
    const payinMethod = resolvePayinMethod(payinEntry, request, flags);
    const payoutMethod = resolvePayoutMethod(payoutEntry, request, flags);
    if (payinMethod === 'other' || payoutMethod === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    const promotionalRate = Number.isFinite(baseRate) && Number.isFinite(exchangeRate) && exchangeRate !== baseRate
        ? exchangeRate
        : null;
    if (!Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: feeAmount,
        total_debit_amount: sendAmount + (promotionalFeeAmount ?? feeAmount),
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sourceCurrency ?? null,
        exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: promotionalRate,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'wirebarley_v1',
        parse_flags: flags,
    };
};
exports.parseWireBarleyPayload = parseWireBarleyPayload;
