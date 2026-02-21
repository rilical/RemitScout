import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type WisePaymentOption = {
    payIn?: string | null;
    payOut?: string | null;
    disabled?: boolean;
    sourceAmount?: number;
    targetAmount?: number;
    sourceCurrency?: string;
    targetCurrency?: string;
    estimatedDelivery?: string | null;
    formattedEstimatedDelivery?: string | null;
    fee?: {
        total?: number;
        discount?: number;
        transferwise?: number;
        payIn?: number;
    };
    price?: {
        total?: {
            value?: {
                amount?: number;
                currency?: string;
            };
        };
    };
};
type WisePayload = {
    paymentOptions?: WisePaymentOption[];
    rate?: number;
    createdTime?: string;
    rateTimestamp?: string;
    status?: string;
    error?: string;
    errorCode?: string;
    message?: string;
};
export type WiseParsedQuote = {
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
export declare const extractWiseMethodPairs: (payload: WisePayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseWisePayload: (payload: WisePayload, request: CollectorRequest) => WiseParsedQuote | null;
export {};
