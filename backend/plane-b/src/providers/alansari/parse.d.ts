import type { CollectorRequest } from '../../collectors/types';
import { type QualityFlag } from '../../normalize/quality-flags';
type AlansariPayload = {
    amount?: string | number | null;
    get_rate?: string | number | null;
    status_msg?: string | null;
    status_msg_detail?: string | null;
};
export type AlansariParsedQuote = {
    send_amount: number;
    receive_amount: number;
    fee_amount: number;
    total_debit_amount: number;
    payin_method: string;
    payout_method: string;
    fee_currency: string | null;
    exchange_rate: number | null;
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
export declare const extractAlansariMethodPairs: (_payload?: AlansariPayload | null, request?: CollectorRequest) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseAlansariPayload: (payload: AlansariPayload, request: CollectorRequest) => AlansariParsedQuote | null;
export {};
