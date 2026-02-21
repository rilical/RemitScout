import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
    cookie?: string;
    extraHeaders?: Record<string, string>;
};
export declare const fetchRemitbeeSessionCookie: (input: {
    locale: string;
    corridorId: string;
    proxyTier?: ProxyTier;
    warmupUrl?: string | null;
}) => Promise<string | null>;
export declare const fetchRemitbeeQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult>;
export {};
