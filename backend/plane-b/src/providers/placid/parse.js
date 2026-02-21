"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlacidPayload = exports.extractPlacidMethodPairs = exports.parsePlacidHtml = void 0;
const corridor_1 = require("../../../../shared/corridor");
const logger_1 = require("../../../../shared/logger");
const quality_flags_1 = require("../../normalize/quality-flags");
const code_map_1 = require("./code-map");
const supported_corridors_1 = require("./supported-corridors");
const logger = (0, logger_1.createLogger)('plane-b.placid.parse');
const parseNumber = (value) => {
    if (value === null || value === undefined)
        return Number.NaN;
    if (typeof value === 'number')
        return value;
    const cleaned = String(value).replace(/[^0-9.+Ee-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};
const parseFeeStore = (html) => {
    const feeMatch = html.match(/FeesSTORG[\s\S]*?JSON\.stringify\(([^)]+)\)/);
    if (!feeMatch?.[1])
        return [];
    try {
        const encoded = feeMatch[1].trim();
        let decoded;
        if (encoded.startsWith("'") && encoded.endsWith("'")) {
            decoded = encoded.slice(1, -1).replace(/\\'/g, "'");
        }
        else {
            decoded = JSON.parse(encoded);
        }
        if (typeof decoded !== 'string')
            return [];
        const raw = JSON.parse(decoded);
        if (!Array.isArray(raw))
            return [];
        return raw
            .map((entry) => {
            const placidCode = String(entry.ConCode ?? '').trim().toUpperCase();
            const currency = String(entry.CurCode ?? '').trim().toUpperCase();
            const paymentType = String(entry.PymType ?? '').trim().toUpperCase();
            const rangeMin = parseNumber(entry.FrRange);
            const rangeMax = parseNumber(entry.ToRange);
            const fee = parseNumber(entry.FeeCust);
            const pct = parseNumber(entry.PctCust);
            if (!placidCode || !currency || !paymentType)
                return null;
            if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax))
                return null;
            return {
                placidCode,
                currency,
                paymentType,
                rangeMin,
                rangeMax,
                fee: Number.isFinite(fee) ? fee : 0,
                pct: Number.isFinite(pct) ? pct : 0,
            };
        })
            .filter((entry) => Boolean(entry));
    }
    catch (error) {
        logger.warn('placid_fee_table_parse_failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
};
const parseRates = (html) => {
    const rateMatches = html.matchAll(/<div[^>]*class="list-item[^"]*"[^>]*>/g);
    const results = [];
    const getAttr = (tag, name) => {
        const match = tag.match(new RegExp(`${name}="([^"]+)"`));
        return match?.[1] ?? null;
    };
    for (const match of rateMatches) {
        const tag = match[0];
        const placidCode = (getAttr(tag, 'data-code') ?? '').trim().toUpperCase();
        const currency = (getAttr(tag, 'data-currency') ?? '').trim().toUpperCase();
        const name = getAttr(tag, 'data-name');
        const rateValue = parseNumber(getAttr(tag, 'data-rate'));
        if (!placidCode || !currency || !Number.isFinite(rateValue))
            continue;
        results.push({
            placidCode,
            currency,
            rate: rateValue,
            name: name ? name.trim() : null,
        });
    }
    return results;
};
const parsePlacidHtml = (html) => {
    if (!html)
        return { rates: [], fees: [] };
    return {
        rates: parseRates(html),
        fees: parseFeeStore(html),
    };
};
exports.parsePlacidHtml = parsePlacidHtml;
const resolvePayload = (payload) => {
    if (payload && typeof payload === 'object' && Array.isArray(payload.rates)) {
        return payload;
    }
    if (typeof payload === 'string') {
        return (0, exports.parsePlacidHtml)(payload);
    }
    return { rates: [], fees: [] };
};
const selectFeeEntry = (fees, placidCode, currency, payinCode, sendAmount) => {
    const normalizedCode = placidCode.toUpperCase();
    const normalizedCurrency = currency.toUpperCase();
    const normalizedPayin = payinCode.toUpperCase();
    const matches = fees.filter((fee) => fee.placidCode === normalizedCode
        && fee.currency === normalizedCurrency);
    const inRange = (fee) => sendAmount >= fee.rangeMin && sendAmount <= fee.rangeMax;
    const payinMatch = matches.find((fee) => fee.paymentType === normalizedPayin && inRange(fee));
    if (payinMatch) {
        return { entry: payinMatch, usedFallback: false };
    }
    const fallback = matches.find((fee) => inRange(fee));
    if (fallback) {
        return { entry: fallback, usedFallback: true };
    }
    return { entry: null, usedFallback: false };
};
const extractPlacidMethodPairs = (payload) => {
    const parsed = resolvePayload(payload);
    const payinMethods = new Set();
    for (const fee of parsed.fees) {
        const mapped = (0, code_map_1.mapPlacidPaymentType)(fee.paymentType);
        if (mapped && mapped !== 'other') {
            payinMethods.add(mapped);
        }
    }
    if (payinMethods.size === 0) {
        payinMethods.add('debit_card');
        payinMethods.add('bank_transfer');
    }
    return Array.from(payinMethods).map((payin) => ({
        payin_method: payin,
        payout_method: 'bank_deposit',
    }));
};
exports.extractPlacidMethodPairs = extractPlacidMethodPairs;
const parsePlacidPayload = (payload, request) => {
    const flags = [];
    const parsedPayload = resolvePayload(payload);
    const { sourceCurrency, destCountry, destCurrency } = (0, corridor_1.requireCorridorId)(request.corridor_id);
    const normalizedDestCountry = destCountry.toUpperCase();
    const normalizedDestCurrency = destCurrency.toUpperCase();
    const destinationCode = supported_corridors_1.PLACID_CODE_BY_COUNTRY[normalizedDestCountry];
    if (!destinationCode) {
        flags.push(quality_flags_1.qualityFlags.unsupported_corridor);
        return null;
    }
    const expectedCurrency = supported_corridors_1.PLACID_DESTINATION_CURRENCY_BY_COUNTRY[normalizedDestCountry];
    if (expectedCurrency && expectedCurrency !== normalizedDestCurrency) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    const rateEntry = parsedPayload.rates.find((rate) => rate.placidCode === destinationCode && rate.currency === normalizedDestCurrency);
    const baseRate = parseNumber(rateEntry?.rate ?? null);
    if (!Number.isFinite(baseRate)) {
        flags.push(quality_flags_1.qualityFlags.parse_error);
    }
    const sendAmount = request.send_amount;
    const receiveAmount = Number.isFinite(baseRate) ? sendAmount * baseRate : 0;
    const payinMethod = (0, code_map_1.mapPayinMethod)(request.payin_method ?? 'bank_transfer');
    const payoutMethod = (0, code_map_1.mapPayoutMethod)(request.payout_method ?? 'bank_deposit');
    const payinCode = (0, code_map_1.mapPayinToPlacidCode)(payinMethod);
    const feeSelection = selectFeeEntry(parsedPayload.fees, destinationCode, normalizedDestCurrency, payinCode, sendAmount);
    if (!feeSelection.entry || feeSelection.usedFallback) {
        flags.push(quality_flags_1.qualityFlags.partial_data);
    }
    const feeAmount = feeSelection.entry
        ? feeSelection.entry.fee + (feeSelection.entry.pct * sendAmount)
        : 0;
    return {
        send_amount: sendAmount,
        receive_amount: Number.isFinite(receiveAmount) ? receiveAmount : 0,
        fee_amount: Number.isFinite(feeAmount) ? feeAmount : 0,
        total_debit_amount: sendAmount + (Number.isFinite(feeAmount) ? feeAmount : 0),
        payin_method: payinMethod,
        payout_method: payoutMethod,
        fee_currency: sourceCurrency ?? null,
        promotional_fee_amount: null,
        promotional_rate: null,
        base_rate: Number.isFinite(baseRate) ? baseRate : null,
        promotional_cap_amount: null,
        delivery_time_min_minutes: null,
        delivery_time_max_minutes: null,
        collected_at: new Date().toISOString(),
        parser_version: 'placid_html_v1',
        parse_flags: flags,
    };
};
exports.parsePlacidPayload = parsePlacidPayload;
