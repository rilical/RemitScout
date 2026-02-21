import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type IntermexPaymentMethod = {
    senderPaymentMethodId?: number | string | null;
    senderPaymentMethodName?: string | null;
    feeAmount?: number | string | null;
    isAvailable?: boolean | null;
};
type IntermexDeliveryMethod = {
    tranTypeId?: number | string | null;
    tranTypeName?: string | null;
    deliveryMethod?: string | null;
    isSelected?: boolean | null;
};
type IntermexPayload = {
    rate?: number | string | null;
    origAmount?: number | string | null;
    destAmount?: number | string | null;
    feeAmount?: number | string | null;
    totalAmount?: number | string | null;
    discountAmount?: number | string | null;
    fxDif?: number | string | null;
    paymentMethods?: IntermexPaymentMethod[] | null;
    deliveryMethodsList?: IntermexDeliveryMethod[] | null;
};
export type IntermexParsedQuote = {
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
export declare const extractIntermexMethodPairs: (payload: IntermexPayload | Record<string, unknown>) => Array<{
    payin_method: string;
    payout_method: string;
}>;
export declare const parseIntermexPayload: (payload: IntermexPayload, request: CollectorRequest) => IntermexParsedQuote | null;
export {};
