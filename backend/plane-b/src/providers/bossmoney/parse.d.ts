import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type BossMoneyFeeByPaymentMethod = {
    payment_method?: string | null;
    fee?: string | number | null;
    status?: string | null;
    highlight_fee?: boolean | null;
    is_enabled?: boolean | null;
};
type BossMoneyFee = {
    pricing_rule_name?: string | null;
    fee?: string | number | null;
    currency_code?: string | null;
    max_amount?: string | number | null;
    fees_by_payment_method?: BossMoneyFeeByPaymentMethod[] | null;
};
type BossMoneyRates = {
    sell_rate?: string | number | null;
    base_sell_rate?: string | number | null;
};
type BossMoneyAmounts = {
    sender?: string | number | null;
    recipient?: string | number | null;
};
type BossMoneyFreeTransaction = {
    max_amount?: string | number | null;
    currency_code?: string | null;
};
export type BossMoneyPayload = {
    free_transaction?: BossMoneyFreeTransaction | null;
    pricing_fee?: BossMoneyFee | null;
    fee?: BossMoneyFee | null;
    loyalty_stats?: unknown;
    fx_rates?: BossMoneyRates | null;
    amounts?: BossMoneyAmounts | null;
};
export type BossMoneyParsedQuote = {
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
export declare const extractBossMoneyMethodPairs: (payload: BossMoneyPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseBossMoneyPayload: (payload: BossMoneyPayload, request: CollectorRequest) => BossMoneyParsedQuote | null;
export {};
