import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type RiaIndividualQuote = {
    settlementMethod?: string | null;
    deliveryMethod?: string | null;
    isDefault?: boolean | null;
    isEnabled?: boolean | null;
    sellAmount?: string | number | null;
    buyAmount?: string | number | null;
    rate?: string | number | null;
    transferFee?: string | number | null;
    totalFees?: string | number | null;
    totalCostAmount?: string | number | null;
    leadTime?: string | null;
};
type RiaSettlementProxy = {
    name?: string | null;
    defaultSettlementMethod?: string | null;
};
type RiaTransferSelections = {
    paymentMethod?: string | null;
    deliveryMethod?: string | null;
};
type RiaTransferCalculations = {
    amountFrom?: number | null;
    amountTo?: number | null;
    transferFee?: number | null;
    totalFeesAndTaxes?: number | null;
    totalAmount?: number | null;
    exchangeRate?: number | null;
    exchangeRatePromo?: number | null;
};
type RiaTransferOption = {
    value?: string | null;
    text?: string | null;
};
type RiaTransferOptions = {
    paymentMethods?: RiaTransferOption[] | null;
    deliveryMethods?: RiaTransferOption[] | null;
};
type RiaTransferDetails = {
    selections?: RiaTransferSelections | null;
    calculations?: RiaTransferCalculations | null;
    transferOptions?: RiaTransferOptions | null;
};
type RiaPayload = {
    quote?: {
        individualQuotes?: RiaIndividualQuote[] | null;
        errorMessages?: Record<string, {
            message?: string;
        }> | null;
        availableSettlementProxies?: RiaSettlementProxy[] | null;
    } | null;
    model?: {
        transferDetails?: RiaTransferDetails | null;
    } | null;
    errorMessages?: Record<string, {
        message?: string;
    }> | null;
    errorResponse?: {
        errors?: Array<{
            message?: string;
        }> | string[] | null;
    } | null;
    statusMessage?: string | null;
};
export type RiaParsedQuote = {
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
export declare const extractRiaErrorMessages: (payload: RiaPayload) => string[];
export declare const extractRiaMethodPairs: (payload: RiaPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseRiaPayload: (payload: RiaPayload, request: CollectorRequest) => RiaParsedQuote | null;
export {};
