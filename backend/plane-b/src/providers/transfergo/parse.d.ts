import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type TransferGoAmount = {
    value?: string | number | null;
    currency?: string | null;
};
type TransferGoFee = {
    value?: string | number | null;
    valueBeforeDiscount?: string | number | null;
    currency?: string | null;
};
type TransferGoRate = {
    value?: string | number | null;
    fromCurrency?: string | null;
    toCurrency?: string | null;
};
type TransferGoOption = {
    code?: string | null;
    label?: string | null;
    isDefault?: boolean | null;
    availability?: {
        isAvailable?: boolean | null;
        reason?: string | null;
    } | null;
    fee?: TransferGoFee | null;
    rate?: TransferGoRate | null;
    receivingAmount?: TransferGoAmount | null;
    sendingAmount?: TransferGoAmount | null;
    promotion?: {
        isApplied?: boolean | null;
        isFxDiscountApplied?: boolean | null;
    } | null;
    payIn?: {
        code?: string | null;
        visibility?: {
            estimateLabel?: string | null;
        } | null;
    } | null;
    payOut?: {
        code?: string | null;
        visibility?: {
            accountType?: string | null;
        } | null;
    } | null;
    visibility?: {
        estimateLabel?: string | null;
        estimate?: {
            label?: string | null;
        } | null;
    } | null;
};
type TransferGoPayload = {
    options?: TransferGoOption[] | null;
};
export type TransferGoParsedQuote = {
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
export declare const extractTransferGoMethodPairs: (payload: TransferGoPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseTransferGoPayload: (payload: TransferGoPayload, request: CollectorRequest) => TransferGoParsedQuote | null;
export {};
