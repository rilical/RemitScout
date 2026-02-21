"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorldRemitPayload = exports.extractWorldRemitMethodPairs = void 0;
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
const normalizeToken = (value) => value.trim().toLowerCase().replace(/\s+/g, '_');
const mapPayout = (code) => {
    if (!code)
        return 'other';
    return code_map_1.payoutMethodMap[code] ?? 'other';
};
const mapPayin = (method) => {
    if (!method)
        return 'other';
    const parts = [method.transferRedirectionType, method.name, method.id].filter(Boolean).join(' ');
    const token = normalizeToken(parts);
    const mapped = code_map_1.payinMethodMap[method.transferRedirectionType] ??
        code_map_1.payinMethodMap[method.name] ??
        code_map_1.payinMethodMap[method.id] ??
        code_map_1.payinMethodMap[token] ??
        null;
    if (mapped)
        return mapped;
    if (token.includes('bank') || token.includes('transfer'))
        return 'bank_transfer';
    if (token.includes('debit'))
        return 'debit_card';
    if (token.includes('credit'))
        return 'credit_card';
    if (token.includes('card'))
        return 'debit_card';
    if (token.includes('cash'))
        return 'cash';
    if (token.includes('apple'))
        return 'apple_pay';
    if (token.includes('google'))
        return 'google_pay';
    return 'other';
};
const parseDeliveryTime = (estimate) => {
    if (!estimate)
        return { min: null, max: null };
    if (estimate.includes('Within 5 minutes') || estimate.includes('⚡ Within 5 minutes')) {
        return { min: 0, max: 5 };
    }
    if (estimate.includes('Same day')) {
        return { min: 0, max: 1440 };
    }
    // Handle ranges like "1-3 days", "2-4 hours", etc.
    if (estimate.includes('-')) {
        const rangeMatch = estimate.match(/(\d+)\s*-\s*(\d+)\s*(days?|hours?|minutes?)/i);
        if (rangeMatch) {
            const minVal = parseInt(rangeMatch[1], 10);
            const maxVal = parseInt(rangeMatch[2], 10);
            const unit = rangeMatch[3].toLowerCase();
            if (unit.startsWith('day')) {
                return { min: minVal * 24 * 60, max: maxVal * 24 * 60 };
            }
            else if (unit.startsWith('hour')) {
                return { min: minVal * 60, max: maxVal * 60 };
            }
            else if (unit.startsWith('minute')) {
                return { min: minVal, max: maxVal };
            }
        }
    }
    if (estimate.includes('minutes')) {
        const match = estimate.match(/(\d+)\s*minutes?/i);
        if (match) {
            const minutes = parseInt(match[1], 10);
            return { min: minutes, max: minutes };
        }
    }
    if (estimate.includes('hours') || estimate.includes('hour')) {
        const match = estimate.match(/(\d+)\s*hours?/i);
        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = hours * 60;
            return { min: minutes, max: minutes };
        }
    }
    if (estimate.includes('days') || estimate.includes('day')) {
        const match = estimate.match(/(\d+)\s*days?/i);
        if (match) {
            const days = parseInt(match[1], 10);
            const minutes = days * 24 * 60;
            return { min: minutes, max: minutes };
        }
    }
    return { min: null, max: null };
};
const extractWorldRemitMethodPairs = (payload) => {
    const pairs = [];
    if (!payload.calculation?.createCalculation?.calculation) {
        return pairs;
    }
    const calculation = payload.calculation.createCalculation.calculation;
    const payoutMethod = payload.selectedPayoutMethod?.code
        ? mapPayout(payload.selectedPayoutMethod.code)
        : payload.mappedPayoutMethod ?? 'other';
    if (calculation.payInMethodsCalculations && calculation.payInMethodsCalculations.length > 0) {
        for (const payInCalc of calculation.payInMethodsCalculations) {
            const payinMethod = mapPayin(payInCalc.payInMethod);
            pairs.push({
                payin_method: payinMethod,
                payout_method: payoutMethod,
            });
        }
    }
    else {
        pairs.push({
            payin_method: 'other',
            payout_method: payoutMethod,
        });
    }
    return pairs;
};
exports.extractWorldRemitMethodPairs = extractWorldRemitMethodPairs;
const getCalculationFromPayload = (payload) => {
    if (!payload.calculation?.createCalculation?.calculation) {
        return null;
    }
    return payload.calculation.createCalculation.calculation;
};
const selectPayinOption = (calculation, request, flags) => {
    const payInCalculations = calculation.payInMethodsCalculations ?? [];
    if (!payInCalculations.length) {
        return { payin_method: 'other', total_to_pay: Number.NaN };
    }
    const options = payInCalculations.map((calc) => ({
        payin_method: mapPayin(calc.payInMethod),
        total_to_pay: parseNumber(calc.totalToPay?.amount),
    }));
    const requested = request.payin_method;
    const match = requested && requested !== 'other'
        ? options.find(option => option.payin_method === requested)
        : null;
    if (match) {
        return match;
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return options[0];
};
const parseWorldRemitPayload = (payload, request) => {
    const flags = [];
    const calculation = getCalculationFromPayload(payload);
    if (!calculation) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const createCalculationResult = payload.calculation?.createCalculation;
    if (createCalculationResult?.errors && createCalculationResult.errors.length > 0) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const sendAmount = parseNumber(calculation.send?.amount);
    const receiveAmount = parseNumber(calculation.receive?.amount);
    const summaryTotalToPay = parseNumber(calculation.informativeSummary?.totalToPay?.amount);
    const feeAmountRaw = parseNumber(calculation.informativeSummary?.fee?.value?.amount);
    const discountAmount = parseNumber(calculation.informativeSummary?.discount?.value?.amount);
    const exchangeRateValue = parseNumber(calculation.exchangeRate?.value);
    const exchangeRateCrossedOut = parseNumber(calculation.exchangeRate?.crossedOutValue);
    const selectedPayin = selectPayinOption(calculation, request, flags);
    const payinMethod = selectedPayin.payin_method;
    const selectedTotalToPay = Number.isFinite(selectedPayin.total_to_pay)
        ? selectedPayin.total_to_pay
        : summaryTotalToPay;
    const feeFromTotal = Number.isFinite(selectedTotalToPay) && Number.isFinite(sendAmount)
        ? selectedTotalToPay - sendAmount
        : Number.NaN;
    const feeDelta = Number.isFinite(feeAmountRaw) && Number.isFinite(feeFromTotal)
        ? Math.abs(feeFromTotal - feeAmountRaw)
        : Number.NaN;
    const feeFromTotalDiscounted = Number.isFinite(feeAmountRaw)
        && Number.isFinite(feeFromTotal)
        && feeFromTotal < feeAmountRaw - 0.005;
    const payinOverridesSummary = Number.isFinite(selectedPayin.total_to_pay)
        && Number.isFinite(summaryTotalToPay)
        && Math.abs(selectedPayin.total_to_pay - summaryTotalToPay) > 0.0001;
    const feeAmount = payinOverridesSummary && Number.isFinite(feeFromTotal)
        ? feeFromTotal
        : Number.isFinite(feeAmountRaw)
            ? feeAmountRaw
            : Number.isFinite(feeFromTotal)
                ? feeFromTotal
                : Number.NaN;
    const payoutMethodCode = payload.selectedPayoutMethod?.code ??
        payload.payoutMethods?.payOutMethods?.[0]?.code;
    const payoutMethod = payoutMethodCode ? mapPayout(payoutMethodCode) : payload.mappedPayoutMethod ?? 'other';
    const feeCurrency = calculation.informativeSummary?.fee?.value?.currency ?? null;
    const deliveryTimeEstimate = payload.selectedPayoutMethod?.payOutTimeEstimate ??
        payload.payoutMethods?.payOutMethods?.[0]?.payOutTimeEstimate;
    let { min: deliveryTimeMin, max: deliveryTimeMax } = parseDeliveryTime(deliveryTimeEstimate);
    // If delivery time is unknown and payout method is bank deposit, default to 1-3 days
    if (deliveryTimeMin === null && deliveryTimeMax === null) {
        const isBankDeposit = payoutMethod === 'bank' || payoutMethod === 'bank_deposit';
        if (isBankDeposit) {
            deliveryTimeMin = 1440; // 1 day in minutes
            deliveryTimeMax = 4320; // 3 days in minutes
            flags.push(quality_flags_1.qualityFlags.partial_data); // Flag as partial data since we're using a default
        }
    }
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(exchangeRateValue)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const baseRate = Number.isFinite(exchangeRateValue)
        ? Number.isFinite(exchangeRateCrossedOut) && exchangeRateCrossedOut > 0 && exchangeRateCrossedOut !== exchangeRateValue
            ? exchangeRateCrossedOut
            : exchangeRateValue
        : null;
    const promotionalRate = Number.isFinite(exchangeRateValue) &&
        Number.isFinite(exchangeRateCrossedOut) &&
        exchangeRateCrossedOut > 0 &&
        exchangeRateCrossedOut !== exchangeRateValue
        ? exchangeRateValue
        : null;
    const promotionalFeeAmount = !payinOverridesSummary
        && Number.isFinite(feeAmountRaw)
        && Number.isFinite(discountAmount)
        && discountAmount > 0
        ? Math.max(feeAmountRaw - discountAmount, 0)
        : !payinOverridesSummary
            && Number.isFinite(feeAmountRaw)
            && Number.isFinite(feeFromTotal)
            && feeFromTotal >= 0
            && feeFromTotalDiscounted
            && !(Number.isFinite(feeDelta) && feeDelta <= 0.005)
            ? feeFromTotal
            : null;
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(selectedTotalToPay)
            ? selectedTotalToPay
            : Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
                ? sendAmount + feeAmount
                : sendAmount,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: feeCurrency,
        exchange_rate: Number.isFinite(exchangeRateValue) ? exchangeRateValue : null,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: promotionalRate,
        base_rate: baseRate,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryTimeMin,
        delivery_time_max_minutes: deliveryTimeMax,
        collected_at: new Date().toISOString(),
        parser_version: 'worldremit_v1',
        parse_flags: flags,
    };
};
exports.parseWorldRemitPayload = parseWorldRemitPayload;
