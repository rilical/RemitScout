"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTransferGoPayload = exports.extractTransferGoMethodPairs = void 0;
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
const parseLabelTokens = (label) => {
    if (!label)
        return null;
    const tokens = normalizeToken(label).split('_').filter(Boolean);
    if (tokens.length >= 3 && tokens[0] === 'payinout') {
        return { payin: tokens[1], payout: tokens[2] };
    }
    return null;
};
const resolvePayinCode = (option) => {
    if (option.payIn?.code)
        return option.payIn.code;
    const labelTokens = parseLabelTokens(option.label);
    if (labelTokens?.payin)
        return labelTokens.payin;
    const codeTokens = option.code?.split('-').filter(Boolean) ?? [];
    return codeTokens[0] ?? null;
};
const resolvePayoutCode = (option) => {
    if (option.payOut?.code)
        return option.payOut.code;
    if (option.payOut?.visibility?.accountType)
        return option.payOut.visibility.accountType;
    const labelTokens = parseLabelTokens(option.label);
    if (labelTokens?.payout)
        return labelTokens.payout;
    const codeTokens = option.code?.split('-').filter(Boolean) ?? [];
    return codeTokens[1] ?? null;
};
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
const getEstimateLabel = (option) => {
    return option.visibility?.estimateLabel
        ?? option.visibility?.estimate?.label
        ?? option.payIn?.visibility?.estimateLabel
        ?? null;
};
const parseEstimateLabel = (value) => {
    if (!value)
        return { min: null, max: null };
    const normalized = normalizeToken(value);
    const matchDigits = normalized.match(/(\d+)_?(minute|minutes|hour|hours|day|days|business_day|working_day)/);
    if (matchDigits) {
        const quantity = Number(matchDigits[1]);
        const unit = matchDigits[2];
        if (Number.isFinite(quantity)) {
            if (unit.startsWith('minute'))
                return { min: quantity, max: quantity };
            if (unit.startsWith('hour'))
                return { min: quantity * 60, max: quantity * 60 };
            return { min: quantity * 1440, max: quantity * 1440 };
        }
    }
    const wordMatch = normalized.match(/(one|two|three|four|five)_?(minute|minutes|hour|hours|day|days|business_day|working_day)/);
    if (wordMatch) {
        const word = wordMatch[1];
        const unit = wordMatch[2];
        const wordToNumber = {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
        };
        const quantity = wordToNumber[word];
        if (unit.startsWith('minute'))
            return { min: quantity, max: quantity };
        if (unit.startsWith('hour'))
            return { min: quantity * 60, max: quantity * 60 };
        return { min: quantity * 1440, max: quantity * 1440 };
    }
    if (normalized.includes('same_day')) {
        return { min: 60, max: 1440 };
    }
    if (normalized.includes('instant')) {
        return { min: 5, max: 30 };
    }
    if (normalized.includes('minute')) {
        return { min: 15, max: 60 };
    }
    if (normalized.includes('hour')) {
        return { min: 60, max: 240 };
    }
    if (normalized.includes('business_day') || normalized.includes('working_day') || normalized.includes('day')) {
        return { min: 1440, max: 1440 };
    }
    return { min: null, max: null };
};
const getOptions = (payload) => {
    return Array.isArray(payload.options) ? payload.options : [];
};
const extractTransferGoMethodPairs = (payload) => {
    const pairs = new Map();
    for (const option of getOptions(payload)) {
        if (option.availability?.isAvailable === false)
            continue;
        const payin = mapPayin(resolvePayinCode(option));
        const payout = mapPayout(resolvePayoutCode(option));
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractTransferGoMethodPairs = extractTransferGoMethodPairs;
const selectOption = (options, request) => {
    const flags = [];
    if (!options.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { option: null, parse_flags: flags };
    }
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    if (requestedPayin && requestedPayout) {
        const match = options.find((item) => {
            const payin = mapPayin(resolvePayinCode(item));
            const payout = mapPayout(resolvePayoutCode(item));
            return payin === requestedPayin && payout === requestedPayout;
        });
        if (match)
            return { option: match, parse_flags: flags };
    }
    if (requestedPayout) {
        const match = options.find((item) => {
            const payout = mapPayout(resolvePayoutCode(item));
            return payout === requestedPayout;
        });
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { option: match, parse_flags: flags };
        }
    }
    if (requestedPayin) {
        const match = options.find((item) => {
            const payin = mapPayin(resolvePayinCode(item));
            return payin === requestedPayin;
        });
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { option: match, parse_flags: flags };
        }
    }
    const fallback = options.find(option => option.isDefault) ?? options[0];
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { option: fallback, parse_flags: flags };
};
const parseTransferGoPayload = (payload, request) => {
    const options = getOptions(payload);
    const availableOptions = options.filter(option => option.availability?.isAvailable !== false);
    const candidateOptions = availableOptions.length ? availableOptions : options;
    const { option, parse_flags } = selectOption(candidateOptions, request);
    if (!option)
        return null;
    if (option.availability?.isAvailable === false) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const sendingAmountValue = parseNumber(option.sendingAmount?.value);
    const sendAmount = Number.isFinite(sendingAmountValue) ? sendingAmountValue : request.send_amount;
    const rateValue = parseNumber(option.rate?.value);
    const receiveAmountValue = parseNumber(option.receivingAmount?.value);
    const receiveAmount = Number.isFinite(receiveAmountValue)
        ? receiveAmountValue
        : Number.isFinite(rateValue)
            ? sendAmount * rateValue
            : Number.NaN;
    const feeActual = parseNumber(option.fee?.value);
    const feeBase = parseNumber(option.fee?.valueBeforeDiscount);
    const feeAmount = Number.isFinite(feeBase)
        ? feeBase
        : Number.isFinite(feeActual)
            ? feeActual
            : Number.NaN;
    const promotionalFeeAmount = Number.isFinite(feeBase)
        && Number.isFinite(feeActual)
        && feeBase > feeActual
        ? feeActual
        : null;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    if (!Number.isFinite(feeAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (option.promotion?.isFxDiscountApplied) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payinMethod = mapPayin(resolvePayinCode(option));
    const payoutMethod = mapPayout(resolvePayoutCode(option));
    const feeCurrency = option.fee?.currency
        ?? option.sendingAmount?.currency
        ?? null;
    const deliveryEstimate = parseEstimateLabel(getEstimateLabel(option));
    const totalDebitAmount = Number.isFinite(feeActual)
        ? sendAmount + feeActual
        : Number.isFinite(feeAmount)
            ? sendAmount + feeAmount
            : sendAmount;
    return {
        send_amount: Number.isFinite(sendAmount) ? sendAmount : 0,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: totalDebitAmount,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: feeCurrency,
        promotional_fee_amount: promotionalFeeAmount,
        promotional_rate: null,
        base_rate: Number.isFinite(rateValue) ? rateValue : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryEstimate.min,
        delivery_time_max_minutes: deliveryEstimate.max,
        collected_at: new Date().toISOString(),
        parser_version: 'transfergo_v1',
        parse_flags,
    };
};
exports.parseTransferGoPayload = parseTransferGoPayload;
