import type { CollectorRequest, FetchResult } from '../../collectors/types';
import type { ProxyTier } from '../../lib/proxy-router';
import { type PlacidPayload } from './parse';
type FetchOptions = {
    jitterMs?: number;
    proxyTier?: ProxyTier;
    cookie?: string;
    extraHeaders?: Record<string, string>;
};
export declare const fetchPlacidSessionCookie: (input: {
    locale: string;
    corridorId: string;
    proxyTier?: ProxyTier;
    warmupUrl?: string | null;
}) => Promise<string | null>;
export declare const fetchPlacidQuote: (request: CollectorRequest, options?: FetchOptions) => Promise<FetchResult<PlacidPayload>>;
export {};
