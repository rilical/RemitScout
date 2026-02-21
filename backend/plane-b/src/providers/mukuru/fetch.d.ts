import '../../../../shared/node-polyfills';
import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
    timeoutMs?: number;
};
export type MukuruProduct = {
    id: number;
    title: string;
    iso: string;
    is_send_calculator?: boolean;
    show_fee?: number | boolean;
};
export type MukuruQuoteData = {
    payin_amount?: number | string;
    payout_amount?: number | string;
    rate_message?: string;
    charge_message?: string;
    amount_adjusted_message?: string;
    bonus_amount_message?: string;
    breakdown?: Record<string, unknown>;
    breakdown_template?: string;
};
export type MukuruQuoteResponse = {
    status?: string;
    data?: MukuruQuoteData;
    message?: string;
    code?: number;
};
export type MukuruPayload = {
    quote: MukuruQuoteResponse | string;
    products: MukuruProduct[];
    selectedProduct: MukuruProduct | null;
    payoutMethod: string;
    sourceCurrency: string | null;
};
export declare const fetchMukuruQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult>;
export {};
