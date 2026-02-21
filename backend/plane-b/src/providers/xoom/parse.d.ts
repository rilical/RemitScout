import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
import type { XoomQuotePayload } from './fetch';
type XoomParsedQuote = {
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
export declare const extractXoomMethodPairs: (payload: XoomQuotePayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseXoomPayload: (payload: XoomQuotePayload, request: CollectorRequest) => XoomParsedQuote | null;
export {};
