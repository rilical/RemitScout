import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
};
export declare const fetchRemitlyQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult>;
export {};
