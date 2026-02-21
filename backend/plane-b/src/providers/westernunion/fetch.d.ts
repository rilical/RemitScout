import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
type FetchOptions = {
    jitterMs?: number;
    forceAllPayins?: boolean;
    proxyTier?: ProxyTier;
};
export declare const fetchWesternUnionQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult>;
export {};
