import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type RemitbeeTimeline = {
    predicted_minutes?: number | string | null;
    predicted_date?: string | null;
};
type RemitbeePaymentType = {
    label?: string | null;
    payment_type?: string | null;
    fees?: string | number | null;
    timeline?: {
        funding_timeline?: RemitbeeTimeline | null;
        settlement_timeline?: RemitbeeTimeline | null;
    } | null;
    funding_time?: string | null;
    settlement_time?: string | null;
};
type RemitbeePayload = {
    transfer_amount?: string | number | null;
    receiving_amount?: string | number | null;
    rate?: string | number | null;
    cumulative_rate?: string | number | null;
    special_rate?: string | number | null;
    spot_rate?: string | number | null;
    special_rate_transfer_amount_limit?: string | number | null;
    payment_types?: RemitbeePaymentType[] | null;
    payment_additional_info?: {
        first_transfer_free?: boolean | null;
        all_transfers_free?: boolean | null;
    } | null;
};
export type RemitbeeParsedQuote = {
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
export declare const extractRemitbeeMethodPairs: (payload: RemitbeePayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseRemitbeePayload: (payload: RemitbeePayload, request: CollectorRequest) => RemitbeeParsedQuote | null;
export {};
