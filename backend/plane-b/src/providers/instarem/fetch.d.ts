import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
export type InstaremPaymentMethod = {
    key?: number | string;
    value?: number | string;
    text?: string | null;
    code?: string | null;
    icon_url?: string | null;
    is_pg?: boolean | null;
    [key: string]: unknown;
};
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
};
export declare const fetchInstaremQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult>;
export {};
