"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePangeaPayload = exports.extractPangeaMethodPairs = void 0;
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
const normalizeToken = (value) => value.trim().toLowerCase().replace(/\s+/g, '_');
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
const extractPangeaMethodPairs = () => {
    return [
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
    ];
};
exports.extractPangeaMethodPairs = extractPangeaMethodPairs;
const parsePangeaPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(payload.SendingAmount?.Amount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const receiveAmountRaw = parseNumber(payload.ReceivingAmount?.Amount);
    const promotionalRateRaw = parseNumber(payload.PromotionalRate?.Rate);
    const baseRateRaw = parseNumber(payload.StandardRate?.Rate);
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
    if (!Number.isFinite(baseRateRaw) && !Number.isFinite(promotionalRateRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const sendCurrency = payload.SendingAmount?.Currency ?? sourceCurrency;
    const receiveCurrency = payload.ReceivingAmount?.Currency ?? destCurrency;
    if (sendCurrency && sendCurrency.toUpperCase() !== sourceCurrency.toUpperCase()) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (receiveCurrency && receiveCurrency.toUpperCase() !== destCurrency.toUpperCase()) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payinMethod = mapPayin('bank_transfer');
    const payoutMethod = mapPayout('bank_deposit');
    const feeAmount = 0;
    const totalDebitAmount = Number.isFinite(sendAmount) ? sendAmount + feeAmount : 0;
    return {
        send_amount: Number.isFinite(sendAmount) ? sendAmount : 0,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: feeAmount,
        total_debit_amount: totalDebitAmount,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sendCurrency ?? sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: Number.isFinite(promotionalRateRaw) ? promotionalRateRaw : null,
        base_rate: Number.isFinite(baseRateRaw) ? baseRateRaw : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'pangea_fx_calc_v1',
        parse_flags: flags,
    };
};
exports.parsePangeaPayload = parsePangeaPayload;
