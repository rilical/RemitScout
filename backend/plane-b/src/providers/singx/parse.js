"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSingxPayload = exports.extractSingxMethodPairs = void 0;
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
const extractSingxMethodPairs = () => {
    return [{ payin_method: 'bank_transfer', payout_method: 'bank_deposit' }];
};
exports.extractSingxMethodPairs = extractSingxMethodPairs;
const hasErrors = (payload) => {
    const errors = payload.errors;
    return Array.isArray(errors) && errors.length > 0;
};
const parseSingxPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (hasErrors(payload)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(payload.sendAmount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const rate = parseNumber(payload.exchangeRate);
    const receiveAmountRaw = parseNumber(payload.receiveAmount);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(rate)
            ? sendAmount * rate
            : Number.NaN;
    const feeAmountRaw = parseNumber(payload.singxFee);
    const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN;
    if (!Number.isFinite(rate) || !Number.isFinite(receiveAmount) || !Number.isFinite(sendAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payin = (0, code_map_1.mapPayinMethod)(request.payin_method ?? 'bank_transfer');
    const payout = (0, code_map_1.mapPayoutMethod)(request.payout_method ?? 'bank_deposit');
    const feeValue = Number.isFinite(feeAmount) ? feeAmount : 0;
    return {
        send_amount: sendAmount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: feeValue,
        total_debit_amount: sendAmount + feeValue,
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency ?? null,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(rate) ? rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'singx_quote_v1',
        parse_flags: flags,
    };
};
exports.parseSingxPayload = parseSingxPayload;
