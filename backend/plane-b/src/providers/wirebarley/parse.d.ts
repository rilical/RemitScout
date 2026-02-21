import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type WirebarleyFee = {
    useDiscountFee?: boolean | null;
    min?: number | string | null;
    max?: number | string | null;
    fee1?: number | string | null;
    discountFee1?: number | string | null;
    threshold1?: number | string | null;
    fee2?: number | string | null;
    discountFee2?: number | string | null;
    threshold2?: number | string | null;
    fee3?: number | string | null;
    discountFee3?: number | string | null;
    option?: string | null;
    [key: string]: unknown;
};
type WirebarleyRateData = {
    threshold?: number | string | null;
    wbRate?: number | string | null;
    threshold1?: number | string | null;
    wbRate1?: number | string | null;
    threshold2?: number | string | null;
    wbRate2?: number | string | null;
    threshold3?: number | string | null;
    wbRate3?: number | string | null;
    threshold4?: number | string | null;
    wbRate4?: number | string | null;
    threshold5?: number | string | null;
    wbRate5?: number | string | null;
    threshold6?: number | string | null;
    wbRate6?: number | string | null;
    threshold7?: number | string | null;
    wbRate7?: number | string | null;
    threshold8?: number | string | null;
    wbRate8?: number | string | null;
    wbRate9?: number | string | null;
};
type WirebarleyExRate = {
    country?: string | null;
    currency?: string | null;
    wbRate?: number | string | null;
    baseRate?: number | string | null;
    paymentFees?: WirebarleyFee[] | null;
    transferFees?: WirebarleyFee[] | null;
    wbRateData?: WirebarleyRateData | null;
};
type WirebarleyPayload = {
    data?: {
        exRates?: WirebarleyExRate[] | null;
    };
};
export type WireBarleyParsedQuote = {
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
export declare const extractWireBarleyMethodPairs: (payload: WirebarleyPayload | Record<string, unknown>) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseWireBarleyPayload: (payload: WirebarleyPayload | Record<string, unknown>, request: CollectorRequest) => WireBarleyParsedQuote | null;
export {};
