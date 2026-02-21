"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXoomPayload = exports.extractXoomMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.xoom.parse');
const normalizeToken = (value) => value.trim().toLowerCase().replace(/[\s._-]+/g, '_');
const mapPayin = (code) => {
    if (!code)
        return 'other';
    const normalized = normalizeToken(code);
    return code_map_1.payinMethodMap[code] ?? code_map_1.payinMethodMap[normalized] ?? 'other';
};
const mapPayout = (code) => {
    if (!code)
        return 'other';
    const normalized = normalizeToken(code);
    return code_map_1.payoutMethodMap[code] ?? code_map_1.payoutMethodMap[normalized] ?? 'other';
};
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const parsed = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const hasErrors = (validations) => {
    if (!validations || !validations.length)
        return false;
    return validations.some((validation) => validation.level?.toUpperCase() === 'ERROR');
};
const resolveRemittance = (payload) => {
    if (!payload)
        return null;
    if (payload.remittance)
        return payload.remittance;
    const data = payload.data;
    if (data?.remittance)
        return data.remittance;
    if (data?.data?.remittance)
        return data.data.remittance;
    return null;
};
const getPricingOptions = (remittance) => {
    if (!remittance?.quote?.pricing)
        return [];
    return remittance.quote.pricing;
};
const extractXoomMethodPairs = (payload) => {
    const remittance = resolveRemittance(payload);
    const pricing = getPricingOptions(remittance);
    const pairs = new Map();
    for (const option of pricing) {
        const payin = mapPayin(option.paymentType?.type ?? null);
        const payout = mapPayout(option.disbursementType ?? null);
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    }
    return Array.from(pairs.values());
};
exports.extractXoomMethodPairs = extractXoomMethodPairs;
const selectPricing = (options, request) => {
    const flags = [];
    if (!options.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { pricing: null, parse_flags: flags };
    }
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    if (requestedPayin && requestedPayout) {
        const match = options.find((option) => {
            const payin = mapPayin(option.paymentType?.type ?? null);
            const payout = mapPayout(option.disbursementType ?? null);
            return payin === requestedPayin && payout === requestedPayout;
        });
        if (match)
            return { pricing: match, parse_flags: flags };
    }
    if (requestedPayout) {
        const match = options.find((option) => mapPayout(option.disbursementType ?? null) === requestedPayout);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { pricing: match, parse_flags: flags };
        }
    }
    if (requestedPayin) {
        const match = options.find((option) => mapPayin(option.paymentType?.type ?? null) === requestedPayin);
        if (match) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
            return { pricing: match, parse_flags: flags };
        }
    }
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { pricing: options[0] ?? null, parse_flags: flags };
};
const parseXoomPayload = (payload, request) => {
    const remittance = resolveRemittance(payload);
    if (!remittance) {
        logger.warn('xoom_parse_no_remittance', { corridor_id: request.corridor_id });
        return null;
    }
    if (hasErrors(remittance.validations ?? null)) {
        logger.warn('xoom_parse_remittance_errors', {
            corridor_id: request.corridor_id,
            validations: remittance.validations,
        });
        return null;
    }
    const pricingOptions = getPricingOptions(remittance);
    const { pricing, parse_flags } = selectPricing(pricingOptions, request);
    if (!pricing)
        return null;
    if (hasErrors(pricing.validations ?? null)) {
        logger.warn('xoom_parse_pricing_errors', {
            corridor_id: request.corridor_id,
            validations: pricing.validations,
        });
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = parseNumber(pricing.sendAmount?.rawValue ?? request.send_amount);
    const receiveAmount = parseNumber(pricing.receiveAmount?.rawValue ?? null);
    const feeAmount = parseNumber(pricing.feeAmount?.rawValue ?? null);
    const baseRate = parseNumber(pricing.fxRate?.rate ?? null);
    const payin = mapPayin(pricing.paymentType?.type ?? null);
    const payout = mapPayout(pricing.disbursementType ?? null);
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount) || !Number.isFinite(feeAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    return {
        send_amount: Number.isFinite(sendAmount) ? sendAmount : request.send_amount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: (Number.isFinite(sendAmount) ? sendAmount : request.send_amount)
            + (Number.isFinite(feeAmount) ? feeAmount : 0),
        payin_method: payin,
        payout_method: payout,
        fee_currency: pricing.feeAmount?.currencyCode ?? sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'xoom_html_v1',
        parse_flags,
    };
};
exports.parseXoomPayload = parseXoomPayload;
