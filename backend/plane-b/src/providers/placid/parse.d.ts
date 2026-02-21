import type { CollectorRequest } from '../../collectors/types';
import { type QualityFlag } from '../../normalize/quality-flags';
export type PlacidRate = {
    placidCode: string;
    currency: string;
    rate: number;
    name?: string | null;
};
export type PlacidFee = {
    placidCode: string;
    currency: string;
    paymentType: string;
    rangeMin: number;
    rangeMax: number;
    fee: number;
    pct: number;
};
export type PlacidPayload = {
    rates: PlacidRate[];
    fees: PlacidFee[];
};
export type PlacidParsedQuote = {
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
export declare const parsePlacidHtml: (html: string) => PlacidPayload;
export declare const extractPlacidMethodPairs: (payload?: PlacidPayload | string | null) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parsePlacidPayload: (payload: PlacidPayload | string, request: CollectorRequest) => PlacidParsedQuote | null;
