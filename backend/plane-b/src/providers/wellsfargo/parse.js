"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWellsFargoPayload = void 0;
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
const parseFormattedAmount = (formatted) => {
    if (!formatted)
        return Number.NaN;
    const cleaned = formatted.replace(/[^\d.-]/g, '');
    return parseNumber(cleaned);
};
const parseFxRateFromString = (rateString) => {
    if (!rateString)
        return Number.NaN;
    const match = rateString.match(/(\d+\.?\d*)/);
    if (!match)
        return Number.NaN;
    return parseNumber(match[1]);
};
const findFxRateForAmount = (fxRateMap, amount) => {
    if (!fxRateMap || typeof fxRateMap !== 'object')
        return null;
    for (const [range, rateString] of Object.entries(fxRateMap)) {
        const match = range.match(/\$?([\d,]+\.?\d*)\s*-\s*\$?([\d,]+\.?\d*)/);
        if (!match)
            continue;
        const min = parseNumber(match[1].replace(/,/g, ''));
        const max = parseNumber(match[2].replace(/,/g, ''));
        if (Number.isFinite(min) && Number.isFinite(max) && amount >= min && amount <= max) {
            return parseFxRateFromString(rateString);
        }
    }
    return null;
};
const findFeeForAmount = (transferFeesMap, amount) => {
    if (!transferFeesMap || typeof transferFeesMap !== 'object')
        return null;
    for (const [range, feeString] of Object.entries(transferFeesMap)) {
        const match = range.match(/\$?([\d,]+\.?\d*)\s*-\s*\$?([\d,]+\.?\d*)/);
        if (!match)
            continue;
        const min = parseNumber(match[1].replace(/,/g, ''));
        const max = parseNumber(match[2].replace(/,/g, ''));
        if (Number.isFinite(min) && Number.isFinite(max) && amount >= min && amount <= max) {
            return parseFormattedAmount(feeString);
        }
    }
    return null;
};
const mapPayin = (code) => {
    if (!code)
        return 'other';
    return code_map_1.payinMethodMap[code] ?? 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'other';
    return code_map_1.payoutMethodMap[code] ?? 'other';
};
const parseWellsFargoPayload = (payload) => {
    const flags = [];
    if (payload.responseCode !== 'success') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        if (payload.errorMessage) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
        }
    }
    if (payload.errorMessage) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    const sendAmount = parseNumber(payload.requestedRawAmount ?? payload.requestedAmount);
    const receiveAmount = parseFormattedAmount(payload.formattedDeliveyAmount);
    let feeAmount = parseFormattedAmount(payload.formattedTransferFeeString);
    if (!Number.isFinite(feeAmount) && sendAmount) {
        const feeFromMap = findFeeForAmount(payload.transferFeesMap, sendAmount);
        if (feeFromMap !== null && Number.isFinite(feeFromMap)) {
            feeAmount = feeFromMap;
        }
    }
    let fxRate = parseFxRateFromString(payload.formattedFxRate);
    if (!Number.isFinite(fxRate) && sendAmount) {
        const rateFromMap = findFxRateForAmount(payload.fxRateMap, sendAmount);
        if (rateFromMap !== null && Number.isFinite(rateFromMap)) {
            fxRate = rateFromMap;
        }
    }
    const payin = mapPayin(payload.paymentMethodCode);
    const payout = mapPayout(payload.paymentMethodCode);
    const feeCurrency = payload.transferFeeCurrency ?? 'USD';
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    if (payin === 'other' || payout === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    const totalDebitAmount = Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
        ? sendAmount + feeAmount
        : sendAmount;
    const deliveryTime = {
        min: 1440,
        max: 4320,
    };
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: totalDebitAmount,
        payin_method: payin,
        payout_method: payout,
        fee_currency: feeCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(fxRate) ? fxRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryTime.min,
        delivery_time_max_minutes: deliveryTime.max,
        collected_at: new Date().toISOString(),
        parser_version: 'wellsfargo_v1',
        parse_flags: flags,
    };
};
exports.parseWellsFargoPayload = parseWellsFargoPayload;
