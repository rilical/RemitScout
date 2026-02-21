"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWesternUnionPayload = exports.extractWesternUnionMethodPairs = void 0;
const corridor_1 = require("../../../../shared/corridor");
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
const payoutAliases = {
    money_in_minutes: 'cash_pickup',
    direct_to_bank: 'bank_deposit',
    davivienda_bank_deposito_banco: 'bank_deposit',
    mobile_money_transfer: 'mobile_wallet',
    mobile_money: 'mobile_wallet',
    wallet_account: 'mobile_wallet',
    account_deposit: 'bank_deposit',
    cash_pickup: 'cash_pickup',
    direct_to_card: 'other',
    home_delivery: 'other',
};
const mapPayin = (code) => {
    if (!code)
        return 'other';
    return (code_map_1.payinMethodMap[code] ??
        code_map_1.payinMethodMap[code.toUpperCase()] ??
        code_map_1.payinMethodMap[normalizeToken(code)] ??
        'other');
};
const mapPayout = (code, label) => {
    const token = code ? normalizeToken(code) : '';
    const labelToken = label ? normalizeToken(label) : '';
    return (code_map_1.payoutMethodMap[code ?? ''] ??
        code_map_1.payoutMethodMap[(code ?? '').toUpperCase()] ??
        code_map_1.payoutMethodMap[token] ??
        payoutAliases[labelToken] ??
        payoutAliases[token] ??
        'other');
};
const normalizeDeliveryWindow = (label, speedDays) => {
    const token = label ? normalizeToken(label) : '';
    if (token.includes('minutes')) {
        return { min: 15, max: 60 };
    }
    if (token.includes('direct_to_bank') || token.includes('bank')) {
        return { min: 60, max: 24 * 60 };
    }
    if (token.includes('direct_to_card')) {
        return { min: 30, max: 180 };
    }
    if (token.includes('mobile')) {
        return { min: 30, max: 180 };
    }
    if (token.includes('home_delivery')) {
        return { min: 24 * 60, max: 48 * 60 };
    }
    if (speedDays !== null && Number.isFinite(speedDays) && speedDays > 0) {
        const minutes = Math.round(speedDays * 1440);
        return { min: minutes, max: minutes };
    }
    return { min: null, max: null };
};
const buildOptions = (payload) => {
    const options = [];
    const serviceGroups = payload.services_groups ?? [];
    for (const group of serviceGroups) {
        const payout = mapPayout(group.service, group.service_name);
        const payGroups = group.pay_groups ?? [];
        for (const payGroup of payGroups) {
            const payin = mapPayin(payGroup.fund_in);
            const fxRate = parseNumber(payGroup.fx_rate);
            const promoRate = parseNumber(payGroup.promotional_fx_rate ?? payGroup.promo_fx_rate ?? payGroup.promotional_rate);
            const netFee = parseNumber(payGroup.net_fee);
            const grossFee = parseNumber(payGroup.gross_fee);
            const feeValue = Number.isFinite(grossFee)
                ? grossFee
                : Number.isFinite(netFee)
                    ? netFee
                    : 0;
            const promotionalFeeValue = Number.isFinite(netFee) && Number.isFinite(grossFee) && netFee < grossFee
                ? netFee
                : null;
            const sendAmount = parseNumber(payGroup.send_amount);
            const receiveAmount = parseNumber(payGroup.receive_amount);
            const speedDays = parseNumber(group.speed_days);
            const deliveryLabel = group.service_name ?? null;
            const deliveryWindow = normalizeDeliveryWindow(deliveryLabel, Number.isFinite(speedDays) ? speedDays : null);
            options.push({
                payin_method: payin,
                payout_method: payout,
                fx_rate: Number.isFinite(fxRate) ? fxRate : 0,
                promotional_rate: Number.isFinite(promoRate) ? promoRate : null,
                promotional_fee_amount: promotionalFeeValue,
                delivery_label: deliveryLabel,
                fee_amount: Number.isFinite(feeValue) ? feeValue : 0,
                send_amount: Number.isFinite(sendAmount) ? sendAmount : null,
                receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : null,
                delivery_time_min_minutes: deliveryWindow.min,
                delivery_time_max_minutes: deliveryWindow.max,
            });
        }
    }
    return options;
};
const chooseOption = (options, request) => {
    const flags = [];
    if (!options.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { option: null, parse_flags: flags };
    }
    const requestedPayin = request.payin_method;
    const requestedPayout = request.payout_method;
    const match = options.find(option => option.payin_method === requestedPayin && option.payout_method === requestedPayout);
    if (match) {
        return { option: match, parse_flags: flags };
    }
    const sorted = [...options].sort((a, b) => b.fx_rate - a.fx_rate);
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { option: sorted[0] ?? null, parse_flags: flags };
};
const extractWesternUnionMethodPairs = (payload) => {
    const pairs = new Map();
    const options = buildOptions(payload);
    for (const option of options) {
        const key = `${option.payin_method}:${option.payout_method}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: option.payin_method, payout_method: option.payout_method });
        }
    }
    return Array.from(pairs.values());
};
exports.extractWesternUnionMethodPairs = extractWesternUnionMethodPairs;
const parseWesternUnionPayload = (payload, request) => {
    const statusValue = payload.response_status?.status;
    const statusNumber = statusValue === null || statusValue === undefined ? 0 : Number(statusValue);
    if (Number.isFinite(statusNumber) && statusNumber < 0) {
        return null;
    }
    const options = buildOptions(payload);
    const { option, parse_flags } = chooseOption(options, request);
    if (!option)
        return null;
    if (Number.isFinite(statusNumber) && statusNumber > 0) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = option.send_amount ?? request.send_amount;
    const receiveAmount = option.receive_amount ?? (option.fx_rate > 0 ? sendAmount * option.fx_rate : Number.NaN);
    const feeForDebit = option.promotional_fee_amount ?? option.fee_amount;
    if (!Number.isFinite(sendAmount) || !Number.isFinite(receiveAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    return {
        send_amount: Number.isFinite(sendAmount) ? sendAmount : request.send_amount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: option.fee_amount,
        total_debit_amount: Number.isFinite(sendAmount) ? sendAmount + feeForDebit : 0,
        payin_method: option.payin_method,
        payout_method: option.payout_method,
        fee_currency: sourceCurrency,
        promotional_fee_amount: option.promotional_fee_amount,
        promotional_rate: option.promotional_rate,
        base_rate: option.fx_rate > 0 ? option.fx_rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: option.delivery_time_min_minutes,
        delivery_time_max_minutes: option.delivery_time_max_minutes,
        collected_at: new Date().toISOString(),
        parser_version: 'westernunion_catalog_v1',
        parse_flags,
    };
};
exports.parseWesternUnionPayload = parseWesternUnionPayload;
