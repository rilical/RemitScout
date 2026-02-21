"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAlansariPayload = exports.extractAlansariMethodPairs = void 0;
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
const isSuccess = (payload) => {
    return payload.status_msg?.toUpperCase() === 'SUCCESS';
};
const extractAlansariMethodPairs = (_payload, request) => {
    const payin = (0, code_map_1.mapPayinMethod)(request?.payin_method ?? 'bank_transfer');
    const payout = (0, code_map_1.mapPayoutMethod)(request?.payout_method ?? 'bank_deposit');
    return [{ payin_method: payin, payout_method: payout }];
};
exports.extractAlansariMethodPairs = extractAlansariMethodPairs;
const parseAlansariPayload = (payload, request) => {
    if (!payload || typeof payload !== 'object')
        return null;
    if (!isSuccess(payload))
        return null;
    const flags = [];
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = request.send_amount;
    const exchangeRate = parseNumber(payload.get_rate);
    let receiveAmount = parseNumber(payload.amount);
    if (!Number.isFinite(receiveAmount) && Number.isFinite(exchangeRate)) {
        receiveAmount = sendAmount * exchangeRate;
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(receiveAmount) || !Number.isFinite(exchangeRate)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    const payin = (0, code_map_1.mapPayinMethod)(request.payin_method ?? 'bank_transfer');
    const payout = (0, code_map_1.mapPayoutMethod)(request.payout_method ?? 'bank_deposit');
    if (payin === 'other' || payout === 'other') {
        flags.push(quality_flags_1.qualityFlags.unknown_method);
    }
    return {
        send_amount: sendAmount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: 0,
        total_debit_amount: sendAmount,
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency ?? null,
        exchange_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'alansari_quote_v1',
        parse_flags: flags,
    };
};
exports.parseAlansariPayload = parseAlansariPayload;
