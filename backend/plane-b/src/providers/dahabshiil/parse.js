"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDahabshiilPayload = exports.extractDahabshiilMethodPairs = exports.getDahabshiilErrorMessages = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const logger = (0, logger_1.createLogger)('plane-b.dahabshiil.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const normalizeStatus = (value) => {
    if (!value)
        return '';
    return value.trim().toLowerCase();
};
const getDahabshiilErrorMessages = (payload) => {
    const messages = [];
    if (Array.isArray(payload.errors)) {
        messages.push(...payload.errors.filter(Boolean));
    }
    const formErrors = payload.form?.errors;
    if (Array.isArray(formErrors)) {
        messages.push(...formErrors.filter(Boolean));
    }
    const children = payload.form?.children ?? null;
    if (children && typeof children === 'object') {
        for (const child of Object.values(children)) {
            if (!child?.errors || !Array.isArray(child.errors))
                continue;
            messages.push(...child.errors.filter(Boolean));
        }
    }
    return messages;
};
exports.getDahabshiilErrorMessages = getDahabshiilErrorMessages;
const getCharges = (payload) => {
    return payload.data?.charges ?? null;
};
const extractDahabshiilMethodPairs = () => {
    return [
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
    ];
};
exports.extractDahabshiilMethodPairs = extractDahabshiilMethodPairs;
const parseDahabshiilPayload = (payload, request) => {
    const flags = [];
    if (!payload || typeof payload !== 'object') {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const errors = (0, exports.getDahabshiilErrorMessages)(payload);
    if (errors.length > 0) {
        logger.warn('dahabshiil_parse_error_messages', {
            corridor_id: request.corridor_id,
            errors,
        });
        return null;
    }
    const status = normalizeStatus(payload.status);
    if (status && status !== 'success') {
        logger.warn('dahabshiil_parse_error_status', {
            corridor_id: request.corridor_id,
            status: payload.status,
            code: payload.code,
            message: payload.message,
        });
        return null;
    }
    const charges = getCharges(payload);
    if (!charges) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmountRaw = parseNumber(charges.source_amount);
    const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : request.send_amount;
    const rate = parseNumber(charges.base_rate ?? charges.rate);
    const receiveAmountRaw = parseNumber(charges.destination_amount);
    const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(rate)
            ? sendAmount * rate
            : Number.NaN;
    const totalChargesValue = parseNumber(charges.total_charges);
    const commissionValue = parseNumber(charges.commission);
    const agentFeeValue = parseNumber(charges.agent_fee);
    const hqFeeValue = parseNumber(charges.hq_fee);
    const taxValue = parseNumber(charges.tax);
    const fallbackFees = [commissionValue, agentFeeValue, hqFeeValue, taxValue]
        .filter(value => Number.isFinite(value))
        .reduce((sum, value) => sum + value, 0);
    const feeAmountRaw = Number.isFinite(totalChargesValue)
        ? totalChargesValue
        : Number.isFinite(commissionValue)
            ? commissionValue
            : fallbackFees > 0
                ? fallbackFees
                : Number.NaN;
    const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : Number.NaN;
    const totalDebitRaw = Number.isFinite(sendAmount) && Number.isFinite(feeAmount)
        ? sendAmount + feeAmount
        : Number.NaN;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmountRaw)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(rate)) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const payinMethod = request.payin_method || 'bank_transfer';
    const payoutMethod = request.payout_method || 'cash_pickup';
    const totalDebit = Number.isFinite(totalDebitRaw)
        ? totalDebitRaw
        : sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0);
    return {
        send_amount: sendAmount,
        receive_amount: receiveAmount,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: totalDebit,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: charges.source_currency ?? sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(rate) ? rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'dahabshiil_quote_v1',
        parse_flags: flags,
    };
};
exports.parseDahabshiilPayload = parseDahabshiilPayload;
