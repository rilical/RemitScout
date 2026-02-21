import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type PaysendRestriction = {
    minAmount?: string | number | null;
    maxAmount?: string | number | null;
};
type PaysendCommission = {
    convertRate?: string | number | null;
    fee?: string | number | null;
    from?: string | number | null;
    to?: string | number | null;
    fromAmount?: string | number | null;
    toAmount?: string | number | null;
    restrictionFrom?: PaysendRestriction | null;
    restrictionTo?: PaysendRestriction | null;
    feeCurrency?: string | null;
};
type PaysendPaymentForm = {
    description?: string | null;
    currencyRateText?: string | null;
    paymentMethod?: string | null;
    deliveryMethod?: string | null;
    payIn?: string | null;
    payOut?: string | null;
    payInMethod?: string | null;
    payOutMethod?: string | null;
    paymentSystem?: string | null;
    paySystem?: string | null;
    paymentSourceFromMethod?: string | null;
};
type PaysendPayload = {
    commission?: PaysendCommission | null;
    paymentForm?: PaysendPaymentForm | null;
    rate?: string | number | null;
    todayRate?: string | number | null;
    exchangeRate?: string | number | null;
    exchange?: string | number | null;
    error?: string | null;
    errorMessage?: string | null;
    message?: string | null;
    paymentSystems?: unknown;
    paySystems?: unknown;
    paymentMethod?: string | null;
    payoutMethod?: string | null;
    payinMethod?: string | null;
    countryFrom?: Array<{
        code?: string | null;
        paySystems?: unknown;
        cardPaySystems?: unknown;
    }> | null;
    countryTo?: Array<{
        code?: string | null;
        paySystems?: unknown;
        cardPaySystems?: unknown;
    }> | null;
};
export type PaysendParsedQuote = {
    send_amount: number;
    receive_amount: number;
    fee_amount: number;
    total_debit_amount: number;
    payin_method: string;
    payout_method: string;
    fee_currency: string | null;
    promotional_fee_amount: number | null;
    promotional_rate: number | null;
    base_rate: number | null;
    promotional_cap_amount: number | null;
    delivery_time_min_minutes: number | null;
    delivery_time_max_minutes: number | null;
    collected_at: string;
    parser_version: string;
    parse_flags: QualityFlag[];
};
export declare const extractPaysendMethodPairs: (payload: PaysendPayload, request?: CollectorRequest | string) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parsePaysendPayload: (payload: PaysendPayload, request: CollectorRequest) => PaysendParsedQuote | null;
export {};
