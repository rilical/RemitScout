"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePaysendPayload = exports.extractPaysendMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.paysend.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const extractStrings = (value) => {
    if (!value)
        return [];
    if (typeof value === 'string')
        return [value];
    if (Array.isArray(value))
        return value.flatMap(extractStrings);
    if (typeof value === 'object') {
        const record = value;
        const keys = ['method', 'type', 'code', 'name', 'title', 'label'];
        return keys.flatMap(key => extractStrings(record[key]));
    }
    return [];
};
const parseRateText = (text, sourceCurrency, destCurrency) => {
    const match = text.match(/([0-9.,]+)\s*([A-Z]{3})\s*=\s*([0-9.,]+)\s*([A-Z]{3})/i);
    if (!match)
        return null;
    const leftAmount = parseNumber(match[1]);
    const leftCurrency = match[2].toUpperCase();
    const rightAmount = parseNumber(match[3]);
    const rightCurrency = match[4].toUpperCase();
    if (!Number.isFinite(leftAmount) || !Number.isFinite(rightAmount))
        return null;
    if (leftCurrency === sourceCurrency && rightCurrency === destCurrency) {
        return rightAmount / leftAmount;
    }
    if (leftCurrency === destCurrency && rightCurrency === sourceCurrency) {
        return leftAmount / rightAmount;
    }
    return null;
};
const parseDeliveryMinutes = (description) => {
    if (!description)
        return { min: null, max: null };
    const normalized = description.toLowerCase();
    if (normalized.includes('instant') || normalized.includes('real time') || normalized.includes('seconds')) {
        return { min: 5, max: 5 };
    }
    const digitMatch = normalized.match(/(\d+)\s*(minute|hour|day|business day|working day)/);
    if (digitMatch) {
        const value = Number(digitMatch[1]);
        const unit = digitMatch[2];
        if (!Number.isFinite(value))
            return { min: null, max: null };
        if (unit.startsWith('minute'))
            return { min: value, max: value };
        if (unit.startsWith('hour'))
            return { min: value * 60, max: value * 60 };
        if (unit.includes('business') || unit.includes('working'))
            return { min: value * 1440, max: value * 1440 };
        return { min: value * 1440, max: value * 1440 };
    }
    if (normalized.includes('business day') || normalized.includes('working day')) {
        return { min: 2880, max: 2880 };
    }
    if (normalized.includes('minute')) {
        return { min: 15, max: 15 };
    }
    if (normalized.includes('hour')) {
        return { min: 60, max: 60 };
    }
    if (normalized.includes('day')) {
        return { min: 1440, max: 1440 };
    }
    return { min: null, max: null };
};
const extractPaysendMethodPairs = (payload, request) => {
    const corridorId = typeof request === 'string' ? request : request?.corridor_id;
    const payinCandidates = [
        payload.paymentForm?.payIn,
        payload.paymentForm?.payInMethod,
        payload.paymentForm?.paymentMethod,
        payload.paymentForm?.paySystem,
        payload.paymentForm?.paymentSourceFromMethod,
        payload.paymentMethod,
        payload.payinMethod,
    ];
    const payoutCandidates = [
        payload.paymentForm?.payOut,
        payload.paymentForm?.payOutMethod,
        payload.paymentForm?.deliveryMethod,
        payload.paymentForm?.paymentSystem,
        payload.paymentForm?.paySystem,
        payload.payoutMethod,
        payload.paySystems,
        payload.paymentSystems,
    ];
    const parsedCorridor = corridorId ? (0, corridor_1.parseCorridorId)(corridorId) : null;
    const sourceCode = parsedCorridor?.sourceCountry?.toLowerCase() ?? null;
    const destCode = parsedCorridor?.destCountry?.toLowerCase() ?? null;
    if (sourceCode && Array.isArray(payload.countryFrom)) {
        const sourceEntry = payload.countryFrom.find(entry => entry?.code?.toLowerCase() === sourceCode);
        if (sourceEntry) {
            payinCandidates.push(sourceEntry.paySystems, sourceEntry.cardPaySystems);
        }
    }
    if (destCode && Array.isArray(payload.countryTo)) {
        const destEntry = payload.countryTo.find(entry => entry?.code?.toLowerCase() === destCode);
        if (destEntry) {
            payoutCandidates.push(destEntry.paySystems, destEntry.cardPaySystems);
        }
    }
    const payins = payinCandidates.flatMap(extractStrings).map(code_map_1.mapPayinMethod).filter(Boolean);
    const payouts = payoutCandidates.flatMap(extractStrings).map(code_map_1.mapPayoutMethod).filter(Boolean);
    const normalizedPayins = payins.filter(method => method !== 'other');
    const normalizedPayouts = payouts.filter(method => method !== 'other');
    const resolvedPayins = normalizedPayins.length ? normalizedPayins : ['debit_card'];
    const resolvedPayouts = normalizedPayouts.length ? normalizedPayouts : ['bank_deposit'];
    const pairs = new Map();
    for (const payin of resolvedPayins) {
        for (const payout of resolvedPayouts) {
            const key = `${payin}:${payout}`;
            if (!pairs.has(key)) {
                pairs.set(key, { payin_method: payin, payout_method: payout });
            }
        }
    }
    return Array.from(pairs.values());
};
exports.extractPaysendMethodPairs = extractPaysendMethodPairs;
const selectMethodPair = (pairs, request, flags) => {
    if (!pairs.length) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
        return { payin: request.payin_method || 'debit_card', payout: request.payout_method || 'bank_deposit' };
    }
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    if (requestedPayin && requestedPayout) {
        const match = pairs.find(pair => pair.payin_method === requestedPayin && pair.payout_method === requestedPayout);
        if (match)
            return { payin: match.payin_method, payout: match.payout_method };
    }
    if (requestedPayout) {
        const match = pairs.find(pair => pair.payout_method === requestedPayout);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { payin: match.payin_method, payout: match.payout_method };
        }
    }
    if (requestedPayin) {
        const match = pairs.find(pair => pair.payin_method === requestedPayin);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { payin: match.payin_method, payout: match.payout_method };
        }
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { payin: pairs[0].payin_method, payout: pairs[0].payout_method };
};
const parsePaysendPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (payload.error || payload.errorMessage) {
        logger.warn('paysend_parse_error_payload', {
            corridor_id: request.corridor_id,
            error: payload.error || payload.errorMessage,
        });
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const commission = payload.commission ?? null;
    const sendAmountRaw = parseNumber(commission?.from ?? commission?.fromAmount ?? null);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const feeAmountRaw = parseNumber(commission?.fee ?? null);
    const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN;
    let baseRate = parseNumber(commission?.convertRate
        ?? payload.rate
        ?? payload.exchangeRate
        ?? payload.todayRate
        ?? payload.exchange
        ?? null);
    if (!Number.isFinite(baseRate) && payload.paymentForm?.currencyRateText) {
        const parsedRate = parseRateText(payload.paymentForm.currencyRateText, sourceCurrency, destCurrency);
        if (parsedRate)
            baseRate = parsedRate;
    }
    const receiveAmountRaw = parseNumber(commission?.to ?? commission?.toAmount ?? null);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(baseRate)
            ? sendAmount * baseRate
            : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmount)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const methodPairs = (0, exports.extractPaysendMethodPairs)(payload, request);
    const { payin, payout } = selectMethodPair(methodPairs, request, flags);
    const feeCurrency = commission?.feeCurrency ?? sourceCurrency ?? null;
    const deliveryDescription = payload.paymentForm?.description ?? null;
    const { min: deliveryMin, max: deliveryMax } = parseDeliveryMinutes(deliveryDescription);
    const feeValue = Number.isFinite(feeAmount) ? feeAmount : 0;
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: feeValue,
        total_debit_amount: sendAmount + feeValue,
        payin_method: payin,
        payout_method: payout,
        fee_currency: feeCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryMin,
        delivery_time_max_minutes: deliveryMax,
        collected_at: new Date().toISOString(),
        parser_version: 'paysend_v1',
        parse_flags: flags,
    };
};
exports.parsePaysendPayload = parsePaysendPayload;
