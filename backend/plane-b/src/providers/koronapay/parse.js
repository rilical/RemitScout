"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKoronaPayPayload = exports.extractKoronaPayMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const normalizeToken = (value) => value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .trim()
    .toLowerCase()
    .replace(/[\s./-]+/g, '_');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const getMinorUnits = (currencyCode) => {
    if (!currencyCode)
        return 2;
    const key = currencyCode.toUpperCase();
    return code_map_1.currencyMinorUnits[key] ?? 2;
};
const fromMinorUnits = (value, currencyCode) => {
    const factor = Math.pow(10, getMinorUnits(currencyCode));
    return value / factor;
};
const isErrorPayload = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const candidate = value;
    return Boolean(candidate.type === 'error' || candidate.code);
};
const getTariffs = (payload) => {
    if (!payload)
        return [];
    if (Array.isArray(payload))
        return payload;
    if (isErrorPayload(payload.tariffs ?? payload))
        return [];
    return Array.isArray(payload.tariffs) ? payload.tariffs : [];
};
const getTariffInfo = (payload) => {
    if (!payload)
        return [];
    if (Array.isArray(payload))
        return payload;
    if (isErrorPayload(payload.tariffInfo ?? payload))
        return [];
    return Array.isArray(payload.tariffInfo) ? payload.tariffInfo : [];
};
const mapPayin = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    return code_map_1.payinMethodMap[code] ?? code_map_1.payinMethodMap[token]
        ?? (token.includes('credit') ? 'credit_card'
            : token.includes('debit') ? 'debit_card'
                : token.includes('card') ? 'debit_card'
                    : 'other');
};
const mapPayout = (code) => {
    if (!code)
        return 'other';
    const token = normalizeToken(code);
    if (code_map_1.payoutMethodMap[code])
        return code_map_1.payoutMethodMap[code];
    if (code_map_1.payoutMethodMap[token])
        return code_map_1.payoutMethodMap[token];
    if (token.includes('cash'))
        return 'cash_pickup';
    if (token.includes('card'))
        return 'bank_deposit';
    if (token.includes('account') || token.includes('iban') || token.includes('bank'))
        return 'bank_deposit';
    if (token.includes('wallet'))
        return 'mobile_wallet';
    return 'other';
};
const extractKoronaPayMethodPairs = (payload) => {
    const pairs = new Map();
    for (const info of getTariffInfo(payload)) {
        const payin = mapPayin(info.paymentMethod);
        const payout = mapPayout(info.receivingMethod);
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractKoronaPayMethodPairs = extractKoronaPayMethodPairs;
const parseKoronaPayPayload = (payload, request) => {
    const flags = [];
    const tariffs = getTariffs(payload);
    if (!tariffs.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const tariff = tariffs[0];
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendCurrency = tariff.sendingCurrency?.code ?? sourceCurrency;
    const receiveCurrency = tariff.receivingCurrency?.code ?? null;
    const sendAmountRaw = parseNumber(tariff.sendingAmountWithoutCommission ?? tariff.sendingAmount);
    const feeAmountRaw = parseNumber(tariff.sendingCommission ?? tariff.sendingTransferCommission);
    const totalDebitRaw = parseNumber(tariff.sendingAmount);
    const receiveAmountRaw = parseNumber(tariff.receivingAmount);
    const exchangeRate = parseNumber(tariff.exchangeRate);
    const sendAmount = Number.isFinite(sendAmountRaw)
        ? fromMinorUnits(sendAmountRaw, sendCurrency)
        : Number.NaN;
    const feeAmount = Number.isFinite(feeAmountRaw)
        ? fromMinorUnits(feeAmountRaw, sendCurrency)
        : Number.NaN;
    const totalDebit = Number.isFinite(totalDebitRaw)
        ? fromMinorUnits(totalDebitRaw, sendCurrency)
        : Number.NaN;
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? fromMinorUnits(receiveAmountRaw, receiveCurrency)
        : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmount) || !Number.isFinite(totalDebit)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(exchangeRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: Number.isFinite(totalDebit)
            ? totalDebit
            : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
        payin_method: request.payin_method,
        payout_method: request.payout_method,
        fee_currency: sendCurrency ?? null,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(exchangeRate) ? exchangeRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'koronapay_v1',
        parse_flags: flags,
    };
};
exports.parseKoronaPayPayload = parseKoronaPayPayload;
