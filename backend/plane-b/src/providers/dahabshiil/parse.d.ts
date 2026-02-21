import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type DahabshiilCharges = {
    source_currency?: string | null;
    source_amount?: string | number | null;
    rate?: string | number | null;
    base_rate?: string | number | null;
    destination_currency?: string | null;
    destination_amount?: string | number | null;
    commission?: string | number | null;
    agent_fee?: string | number | null;
    hq_fee?: string | number | null;
    total_charges?: string | number | null;
    tax?: string | number | null;
};
export type DahabshiilPayload = {
    status?: string | null;
    code?: number | null;
    message?: string | null;
    errors?: string[] | null;
    form?: {
        errors?: string[] | null;
        children?: Record<string, {
            errors?: string[] | null;
        } | null> | null;
    } | null;
    data?: {
        charges?: DahabshiilCharges | null;
    } | null;
};
export type DahabshiilParsedQuote = {
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
export declare const getDahabshiilErrorMessages: (payload: DahabshiilPayload) => string[];
export declare const extractDahabshiilMethodPairs: () => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseDahabshiilPayload: (payload: DahabshiilPayload, request: CollectorRequest) => DahabshiilParsedQuote | null;
export {};
