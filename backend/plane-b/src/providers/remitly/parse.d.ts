import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type RemitlyCurrency = {
    alpha3?: string | null;
};
type RemitlyConduit = {
    source_country?: string | null;
    target_country?: string | null;
    source_currency?: RemitlyCurrency | null;
    target_currency?: RemitlyCurrency | null;
};
type RemitlyExchangeRate = {
    promotional_exchange_rate?: string | null;
    base_rate?: string | null;
    capped_promotional_exchange_rate_amount?: string | null;
};
type RemitlyDiscount = {
    fee_discount_amount?: string | null;
    send_discount_amount?: string | null;
};
type RemitlyFee = {
    total_fee_amount?: string | null;
};
type RemitlyEstimate = {
    conduit?: RemitlyConduit | null;
    exchange_rate?: RemitlyExchangeRate | null;
    fee?: RemitlyFee | null;
    discount?: RemitlyDiscount | null;
    pay_in_method?: string | null;
    pay_out_method?: string | null;
    receive_amount?: string | null;
    send_amount?: string | null;
    total_charge_amount?: string | null;
};
type RemitlyPayload = {
    estimate?: RemitlyEstimate | null;
    pay_out_price_estimates?: {
        estimates?: RemitlyEstimate[] | null;
    } | null;
};
export type RemitlyParsedQuote = {
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
export declare const extractRemitlyMethodPairs: (payload: RemitlyPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseRemitlyPayload: (payload: RemitlyPayload, request: CollectorRequest) => RemitlyParsedQuote | null;
export {};
