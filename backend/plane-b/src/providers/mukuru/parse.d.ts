import type { CollectorRequest } from '../../collectors/types';
import { type QualityFlag } from '../../normalize/quality-flags';
import type { MukuruPayload } from './fetch';
export type MukuruParsedQuote = {
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
export declare const extractMukuruMethodPairs: (payload: MukuruPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const getMukuruErrorMessages: (payload: MukuruPayload) => string[];
export declare const parseMukuruPayload: (payload: MukuruPayload, request: CollectorRequest) => MukuruParsedQuote | null;
