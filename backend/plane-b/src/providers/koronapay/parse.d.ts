import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type KoronaPayCurrency = {
    id?: string | number | null;
    code?: string | null;
    name?: string | null;
};
type KoronaPayTariff = {
    sendingCurrency?: KoronaPayCurrency | null;
    sendingAmount?: number | string | null;
    sendingAmountWithoutCommission?: number | string | null;
    sendingAmountDiscount?: number | string | null;
    sendingCommission?: number | string | null;
    sendingCommissionDiscount?: number | string | null;
    sendingTransferCommission?: number | string | null;
    paidNotificationCommission?: number | string | null;
    receivingCurrency?: KoronaPayCurrency | null;
    receivingAmount?: number | string | null;
    exchangeRate?: number | string | null;
    exchangeRateType?: string | null;
    exchangeRateDiscount?: number | string | null;
    profit?: number | string | null;
};
type KoronaPayTariffInfo = {
    sendingCurrency?: KoronaPayCurrency | null;
    receivingCurrency?: KoronaPayCurrency | null;
    paymentMethod?: string | null;
    receivingMethod?: string | null;
    minSendingAmount?: number | string | null;
    maxSendingAmount?: number | string | null;
    minReceivingAmount?: number | string | null;
    maxReceivingAmount?: number | string | null;
};
type KoronaPayError = {
    code?: number | string | null;
    message?: string | null;
    type?: string | null;
};
type KoronaPayPayload = {
    tariffs?: KoronaPayTariff[] | KoronaPayError | null;
    tariffInfo?: KoronaPayTariffInfo[] | KoronaPayError | null;
};
export type KoronaPayParsedQuote = {
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
export declare const extractKoronaPayMethodPairs: (payload: KoronaPayPayload | KoronaPayTariffInfo[]) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseKoronaPayPayload: (payload: KoronaPayPayload | KoronaPayTariff[], request: CollectorRequest) => KoronaPayParsedQuote | null;
export {};
