import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type XeIndividualQuote = {
    rate?: number | string | null;
    buyAmount?: number | string | null;
    transferFee?: number | string | null;
    deliveryMethod?: string | null;
    leadTime?: string | null;
};
type XeQuotePayload = {
    quote?: {
        individualQuotes?: XeIndividualQuote[] | null;
    } | null;
    errorMessages?: Record<string, {
        message?: string;
    }> | null;
};
export type XeParsedQuote = {
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
export declare const extractXeMethodPairs: (payload: XeQuotePayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseXePayload: (payload: XeQuotePayload, request: CollectorRequest) => XeParsedQuote | null;
export {};
