import '../../../shared/node-polyfills';
import type { ProxyTier } from '../lib/proxy-router';
export declare const TERMINAL_ERROR_CODES: readonly ["CORRIDOR_NOT_SUPPORTED", "CURRENCY_NOT_SUPPORTED", "COUNTRY_NOT_SUPPORTED", "AMOUNT_OUT_OF_RANGE", "AMOUNT_TOO_LOW", "AMOUNT_TOO_HIGH", "INVALID_CORRIDOR", "SERVICE_UNAVAILABLE_CORRIDOR"];
export declare const isTerminalError: (error: unknown) => boolean;
export type HttpClientOptions = {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string | Record<string, unknown>;
    timeoutMs?: number;
    jitterMs?: number;
    proxyUrl?: string;
    proxyTier?: ProxyTier;
    corridorId?: string;
};
export type HttpResponse = {
    status: number;
    bodyText: string;
    json?: unknown;
    setCookie?: string[];
    parseError?: boolean;
};
export declare const httpRequest: (options: HttpClientOptions) => Promise<HttpResponse>;
