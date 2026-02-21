"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRiaPayload = exports.extractRiaMethodPairs = exports.extractRiaErrorMessages = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const logger = (0, logger_1.createLogger)('plane-b.ria.parse');
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
const parseDeliveryWindow = (value) => {
    if (!value)
        return { min: null, max: null };
    const text = value.toLowerCase();
    const dayRange = text.match(/(\d+)\s*-\s*(\d+)\s*(?:business\s*)?day/);
    if (dayRange) {
        const min = Number(dayRange[1]) * 1440;
        const max = Number(dayRange[2]) * 1440;
        return { min, max };
    }
    const hourRange = text.match(/(\d+)\s*-\s*(\d+)\s*hour/);
    if (hourRange) {
        const min = Number(hourRange[1]) * 60;
        const max = Number(hourRange[2]) * 60;
        return { min, max };
    }
    const daySingle = text.match(/(\d+)\s*(?:business\s*)?day/);
    if (daySingle) {
        const minutes = Number(daySingle[1]) * 1440;
        return { min: minutes, max: minutes };
    }
    const hourSingle = text.match(/(\d+)\s*hour/);
    if (hourSingle) {
        const minutes = Number(hourSingle[1]) * 60;
        return { min: minutes, max: minutes };
    }
    const minuteSingle = text.match(/(\d+)\s*minute/);
    if (minuteSingle) {
        const minutes = Number(minuteSingle[1]);
        return { min: minutes, max: minutes };
    }
    if (text.includes('within 24 hours') || text.includes('same day')) {
        return { min: 60, max: 1440 };
    }
    if (text.includes('instant') || text.includes('minutes')) {
        return { min: 15, max: 60 };
    }
    return { min: null, max: null };
};
const getQuotes = (payload) => {
    return payload.quote?.individualQuotes ?? [];
};
const getTransferDetails = (payload) => {
    return payload.model?.transferDetails ?? null;
};
const extractRiaErrorMessages = (payload) => {
    const errorMessages = [];
    const appendError = (value) => {
        if (!value)
            return;
        if (typeof value === 'string') {
            errorMessages.push(value);
            return;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            const message = value.message;
            if (message)
                errorMessages.push(message);
        }
    };
    const responseErrors = payload.errorResponse?.errors ?? [];
    if (Array.isArray(responseErrors)) {
        for (const entry of responseErrors)
            appendError(entry);
    }
    if (payload.errorMessages) {
        for (const entry of Object.values(payload.errorMessages))
            appendError(entry);
    }
    if (payload.quote?.errorMessages) {
        for (const entry of Object.values(payload.quote.errorMessages))
            appendError(entry);
    }
    if (payload.statusMessage) {
        errorMessages.push(payload.statusMessage);
    }
    return errorMessages;
};
exports.extractRiaErrorMessages = extractRiaErrorMessages;
const extractRiaMethodPairs = (payload) => {
    const pairs = new Map();
    const quotes = getQuotes(payload);
    const addPair = (payin, payout) => {
        const key = `${payin}:${payout}`;
        if (!pairs.has(key)) {
            pairs.set(key, { payin_method: payin, payout_method: payout });
        }
    };
    const transferDetails = getTransferDetails(payload);
    const selections = transferDetails?.selections ?? null;
    const selectionPayin = selections ? mapPayin(selections.paymentMethod) : 'other';
    const selectionPayout = selections ? mapPayout(selections.deliveryMethod) : 'other';
    if (selectionPayin !== 'other' && selectionPayout !== 'other') {
        addPair(selectionPayin, selectionPayout);
    }
    const transferOptions = transferDetails?.transferOptions ?? null;
    if (transferOptions && selectionPayin !== 'other') {
        for (const method of transferOptions.deliveryMethods ?? []) {
            const payout = mapPayout(method.value);
            if (payout !== 'other') {
                addPair(selectionPayin, payout);
            }
        }
    }
    if (transferOptions && selectionPayout !== 'other') {
        for (const method of transferOptions.paymentMethods ?? []) {
            const payin = mapPayin(method.value);
            if (payin !== 'other') {
                addPair(payin, selectionPayout);
            }
        }
    }
    const payoutsByPayin = new Map();
    for (const quote of quotes) {
        if (quote.isEnabled === false)
            continue;
        const payout = mapPayout(quote.deliveryMethod);
        const payin = mapPayin(quote.settlementMethod);
        addPair(payin, payout);
        if (payin !== 'other' && payout !== 'other') {
            const payouts = payoutsByPayin.get(payin) ?? new Set();
            payouts.add(payout);
            payoutsByPayin.set(payin, payouts);
        }
    }
    const proxies = payload.quote?.availableSettlementProxies;
    if (Array.isArray(proxies) && proxies.length > 0) {
        for (const proxy of proxies) {
            const proxyPayin = mapPayin(proxy.name);
            if (proxyPayin === 'other')
                continue;
            const basePayin = mapPayin(proxy.defaultSettlementMethod);
            const payouts = payoutsByPayin.get(basePayin);
            if (!payouts || payouts.size === 0)
                continue;
            for (const payout of payouts) {
                addPair(proxyPayin, payout);
            }
        }
    }
    return Array.from(pairs.values());
};
exports.extractRiaMethodPairs = extractRiaMethodPairs;
const selectQuote = (quotes, request) => {
    const flags = [];
    const enabledQuotes = quotes.filter(quote => quote.isEnabled !== false);
    if (!enabledQuotes.length) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
        return { quote: null, parse_flags: flags };
    }
    const desiredPayin = request.payin_method && request.payin_method !== 'other'
        ? request.payin_method
        : null;
    const desiredPayout = request.payout_method && request.payout_method !== 'other'
        ? request.payout_method
        : null;
    const match = enabledQuotes.find((quote) => {
        const payin = mapPayin(quote.settlementMethod);
        const payout = mapPayout(quote.deliveryMethod);
        return (!desiredPayin || payin === desiredPayin) && (!desiredPayout || payout === desiredPayout);
    });
    if (match)
        return { quote: match, parse_flags: flags };
    const fallback = enabledQuotes.find(quote => quote.isDefault) ?? enabledQuotes[0];
    flags.push(quality_flags_1.qualityFlags.partial_data);
    return { quote: fallback ?? null, parse_flags: flags };
};
const parseRiaPayload = (payload, request) => {
    const errorMessages = (0, exports.extractRiaErrorMessages)(payload);
    const hasErrorMessages = errorMessages.length > 0;
    if (hasErrorMessages) {
        logger.warn('ria_parse_error_messages', {
            corridor_id: request.corridor_id,
            error_messages: errorMessages,
        });
    }
    const transferDetails = getTransferDetails(payload);
    const calculations = transferDetails?.calculations ?? null;
    if (!calculations && getQuotes(payload).length === 0 && hasErrorMessages) {
        return null;
    }
    if (calculations) {
        const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
        const selections = transferDetails?.selections ?? null;
        const payin = mapPayin(selections?.paymentMethod);
        const payout = mapPayout(selections?.deliveryMethod);
        const sendAmount = parseNumber(calculations.amountFrom);
        const resolvedSend = Number.isFinite(sendAmount) ? sendAmount : request.send_amount;
        const receiveAmountValue = parseNumber(calculations.amountTo);
        const rate = parseNumber(calculations.exchangeRate);
        const promoRate = parseNumber(calculations.exchangeRatePromo);
        const feeAmountValue = parseNumber(calculations.transferFee ?? calculations.totalFeesAndTaxes);
        const totalCostValue = parseNumber(calculations.totalAmount);
        const receiveAmount = Number.isFinite(receiveAmountValue)
            ? receiveAmountValue
            : Number.isFinite(rate)
                ? resolvedSend * rate
                : Number.NaN;
        if (!Number.isFinite(resolvedSend) || !Number.isFinite(receiveAmount)) {
            return null;
        }
        const flags = hasErrorMessages ? [quality_flags_1.qualityFlags.partial_data] : [];
        if (!Number.isFinite(feeAmountValue)) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
        }
        if (!Number.isFinite(rate)) {
            flags.push(quality_flags_1.qualityFlags.partial_data);
        }
        const feeAmount = Number.isFinite(feeAmountValue) ? feeAmountValue : 0;
        const totalDebit = Number.isFinite(totalCostValue)
            ? totalCostValue
            : resolvedSend + feeAmount;
        return {
            send_amount: resolvedSend,
            receive_amount: receiveAmount,
            fee_amount: feeAmount,
            total_debit_amount: totalDebit,
            payin_method: payin !== 'other' ? payin : request.payin_method,
            payout_method: payout !== 'other' ? payout : request.payout_method,
            fee_currency: sourceCurrency,
            promotional_fee_amount: null,
            promotional_rate: Number.isFinite(promoRate) ? promoRate : null,
            base_rate: Number.isFinite(rate) ? rate : null,
            promotional_cap_amount: null,
            delivery_time_min_minutes: null,
            delivery_time_max_minutes: null,
            collected_at: new Date().toISOString(),
            parser_version: 'ria_quote_v2',
            parse_flags: flags,
        };
    }
    const { quote, parse_flags } = selectQuote(getQuotes(payload), request);
    if (hasErrorMessages && !parse_flags.includes(quality_flags_1.qualityFlags.partial_data)) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!quote)
        return null;
    const { sourceCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const sendAmount = parseNumber(quote.sellAmount);
    const resolvedSend = Number.isFinite(sendAmount) ? sendAmount : request.send_amount;
    const rate = parseNumber(quote.rate);
    const receiveAmountValue = parseNumber(quote.buyAmount);
    const feeAmountValue = parseNumber(quote.transferFee ?? quote.totalFees);
    const totalCostValue = parseNumber(quote.totalCostAmount);
    const payout = mapPayout(quote.deliveryMethod);
    const payin = mapPayin(quote.settlementMethod);
    const deliveryWindow = parseDeliveryWindow(quote.leadTime ?? null);
    const receiveAmount = Number.isFinite(receiveAmountValue)
        ? receiveAmountValue
        : Number.isFinite(rate)
            ? resolvedSend * rate
            : Number.NaN;
    if (!Number.isFinite(resolvedSend) || !Number.isFinite(receiveAmount)) {
        parse_flags.push(quality_flags_1.qualityFlags.parse_error);
        return null;
    }
    if (!Number.isFinite(feeAmountValue)) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    if (!Number.isFinite(rate)) {
        parse_flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const feeAmount = Number.isFinite(feeAmountValue) ? feeAmountValue : 0;
    const totalDebit = Number.isFinite(totalCostValue)
        ? totalCostValue
        : resolvedSend + feeAmount;
    return {
        send_amount: resolvedSend,
        receive_amount: receiveAmount,
        fee_amount: feeAmount,
        total_debit_amount: totalDebit,
        payin_method: payin,
        payout_method: payout,
        fee_currency: sourceCurrency,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(rate) ? rate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: deliveryWindow.min,
        delivery_time_max_minutes: deliveryWindow.max,
        collected_at: new Date().toISOString(),
        parser_version: 'ria_quote_v1',
        parse_flags,
    };
};
exports.parseRiaPayload = parseRiaPayload;
