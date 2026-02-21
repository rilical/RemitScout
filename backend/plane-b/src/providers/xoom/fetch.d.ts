import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
export type XoomRemittance = {
    id?: string | null;
    selectedDisbursementType?: string | null;
    sourceCountry?: string | null;
    sourceCurrency?: string | null;
    destinationCountry?: string | null;
    destinationCurrency?: string | null;
    recipient?: unknown | null;
    validations?: Array<{
        code?: string | null;
        message?: string | null;
        path?: string | null;
        level?: string | null;
    }> | null;
    quote?: {
        pricing?: unknown[] | null;
    } | null;
};
export type XoomQuotePayload = {
    remittance?: XoomRemittance | null;
};
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
};
export declare const fetchXoomQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult<XoomQuotePayload>>;
export {};
