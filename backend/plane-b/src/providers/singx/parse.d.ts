import type { CollectorRequest } from '../../collectors/types';
import { type QualityFlag } from '../../normalize/quality-flags';
type SingxPayload = {
    exchangeRate?: number | string | null;
    receiveAmount?: number | string | null;
    sendAmount?: number | string | null;
    singxFee?: number | string | null;
    totalPayable?: number | string | null;
    errors?: unknown[] | null;
    type?: string | null;
};
export type SingxParsedQuote = {
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
export declare const extractSingxMethodPairs: () => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseSingxPayload: (payload: SingxPayload, request: CollectorRequest) => SingxParsedQuote | null;
export {};
