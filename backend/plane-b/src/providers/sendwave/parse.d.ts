import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type SendwaveSegment = {
    description?: string | null;
    segmentDisplayName?: string | null;
    segmentName?: string | null;
};
type SendwavePayoutGroup = {
    payoutMethod?: string | null;
    label?: string | null;
    bestPricedSegmentName?: string | null;
    isBestPricedPayoutMethod?: boolean | null;
    segments?: SendwaveSegment[] | null;
};
export type SendwaveSegmentsPayload = {
    payoutMethodsAndPrices?: SendwavePayoutGroup[] | null;
};
export type SendwavePricingPayload = {
    baseExchangeRate?: string | number | null;
    effectiveExchangeRate?: string | number | null;
    baseFeeAmount?: string | number | null;
    effectiveFeeAmount?: string | number | null;
    baseSendAmount?: string | number | null;
    effectiveSendAmount?: string | number | null;
    payAmount?: string | number | null;
    receiveAmount?: string | number | null;
};
export type SendwavePayload = {
    segments?: SendwaveSegmentsPayload | string | null;
    pricing?: SendwavePricingPayload | string | null;
    segmentName?: string | null;
    payoutMethod?: string | null;
};
export type SendwaveParsedQuote = {
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
export declare const getSendwaveErrorMessages: (payload: SendwavePayload) => string[];
export declare const extractSendwaveMethodPairs: (payload: SendwavePayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseSendwavePayload: (payload: SendwavePayload, request: CollectorRequest) => SendwaveParsedQuote | null;
export {};
