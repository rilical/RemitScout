import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type PangeaAmount = {
    Amount?: string | number | null;
    Currency?: string | null;
};
type PangeaRate = {
    RateType?: string | null;
    Rate?: string | number | null;
};
export type PangeaPayload = {
    SendingAmount?: PangeaAmount | null;
    ReceivingAmount?: PangeaAmount | null;
    StandardRate?: PangeaRate | null;
    PromotionalRate?: PangeaRate | null;
};
export type PangeaParsedQuote = {
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
export declare const extractPangeaMethodPairs: () => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parsePangeaPayload: (payload: PangeaPayload, request: CollectorRequest) => PangeaParsedQuote | null;
export {};
