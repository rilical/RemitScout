import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type WUPayGroup = {
    fund_in?: string | null;
    fx_rate?: number | string | null;
    promotional_fx_rate?: number | string | null;
    promo_fx_rate?: number | string | null;
    promotional_rate?: number | string | null;
    gross_fee?: number | string | null;
    send_amount?: number | string | null;
    receive_amount?: number | string | null;
};
type WUServiceGroup = {
    service?: string | null;
    service_name?: string | null;
    speed_days?: number | string | null;
    pay_groups?: WUPayGroup[] | null;
};
type WUResponseStatus = {
    status?: number | null;
    message?: string | null;
};
type WUResponse = {
    response_status?: WUResponseStatus | null;
    services_groups?: WUServiceGroup[] | null;
    categories?: Array<Record<string, unknown>> | null;
};
export type WesternUnionParsedQuote = {
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
export declare const extractWesternUnionMethodPairs: (payload: WUResponse) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseWesternUnionPayload: (payload: WUResponse, request: CollectorRequest) => WesternUnionParsedQuote | null;
export {};
