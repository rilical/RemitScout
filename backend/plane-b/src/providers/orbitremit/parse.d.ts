import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type OrbitRemitRateAttributes = {
    send_currency?: string | null;
    payout_currency?: string | null;
    base_currency?: string | null;
    send_amount?: string | number | null;
    payout_amount?: string | number | null;
    rate?: string | number | null;
    promotion_rate?: string | number | null;
    promotion_threshold?: string | number | null;
    standard_rate?: string | number | null;
    standard_send_amount?: string | number | null;
    standard_payout_amount?: string | number | null;
};
type OrbitRemitRateResponse = {
    type?: string | null;
    data?: {
        data?: {
            attributes?: OrbitRemitRateAttributes | null;
        } | null;
    } | null;
    warning?: string | null;
};
type OrbitRemitFeeData = {
    fee?: string | number | null;
    send_currency?: string | null;
    payout_currency?: string | null;
    send_amount?: string | number | null;
    recipient_type?: string | null;
};
type OrbitRemitFeeResponse = {
    code?: number | string | null;
    status?: string | null;
    data?: OrbitRemitFeeData | null;
};
export type OrbitRemitPayload = {
    rate?: OrbitRemitRateResponse | string | null;
    fee?: OrbitRemitFeeResponse | string | null;
    meta?: {
        recipientType?: string | null;
        requestedRecipientType?: string | null;
        availableRecipientTypes?: string[] | null;
    } | null;
};
export type OrbitRemitParsedQuote = {
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
export declare const extractOrbitRemitMethodPairs: (payload: OrbitRemitPayload, request?: CollectorRequest) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseOrbitRemitPayload: (payload: OrbitRemitPayload, request: CollectorRequest) => OrbitRemitParsedQuote | null;
export {};
