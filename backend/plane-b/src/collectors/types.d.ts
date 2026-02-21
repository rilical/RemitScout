import type { NormalizedQuote } from '../normalize/quote-normalizer';
/**
 * HTTP response from provider API fetch operation.
 *
 * This type represents the result of fetching a quote from a provider's API.
 * The payload is generic to allow provider-specific types while maintaining
 * type safety.
 *
 * @template T - Type of the parsed payload (default: unknown for backward compatibility)
 *
 * @example
 * ```typescript
 * // Provider-specific payload type
 * type RemitlyPayload = { quotes: Quote[] }
 * const result: FetchResult<RemitlyPayload> = await fetchRemitlyQuote(request)
 * ```
 */
export type FetchResult<T = unknown> = {
    /** HTTP status code from the provider API response */
    status: number;
    /** Raw response body as string (before parsing) */
    bodyText: string;
    /** Whether JSON parsing failed for an expected JSON payload */
    parseError?: boolean;
    /** Parsed payload (type depends on provider, defaults to unknown) */
    payload: T;
};
/**
 * Request parameters for fetching a quote from a provider.
 *
 * This type defines all the parameters needed to make a quote request to a
 * provider's API. It is used by fetch functions across all providers.
 *
 * @property provider_id - Provider identifier (e.g., 'remitly', 'wise')
 * @property corridor_id - Corridor identifier in format 'SOURCE-DEST-CURRENCY-CURRENCY' (e.g., 'US-MX-USD-MXN')
 * @property amount_bucket - Amount bucket value (e.g., 100, 500, 1000)
 * @property payin_method - Payment method for sending money (e.g., 'debit_card', 'bank_transfer')
 * @property payout_method - Payment method for receiving money (e.g., 'bank_deposit', 'cash_pickup')
 * @property send_amount - Exact send amount in source currency (may differ from amount_bucket for approximate buckets)
 * @property locale - Locale string (e.g., 'en-US', 'es-MX')
 */
export type CollectorRequest = {
    /** Provider identifier */
    provider_id: string;
    /** Corridor identifier in format 'SOURCE-DEST-CURRENCY-CURRENCY' */
    corridor_id: string;
    /** Amount bucket value (used for rate limiting and caching) */
    amount_bucket: number;
    /** Payment method for sending money */
    payin_method: string;
    /** Payment method for receiving money */
    payout_method: string;
    /**
     * Exact send amount in source currency.
     * This may differ from amount_bucket when using approximate buckets.
     * For example, if amount_bucket is 500 but the actual amount is 353,
     * send_amount would be 353.
     */
    send_amount: number;
    /** Locale string for localization */
    locale: string;
};
/**
 * Status of a collection attempt.
 *
 * - `success`: Quote was successfully fetched and parsed
 * - `blocked`: Provider blocked the request (detected via keywords or status codes)
 * - `error`: An error occurred during fetch or parse
 * - `skipped`: Request was skipped (e.g., due to freshness check or circuit breaker)
 */
export type CollectorStatus = 'success' | 'blocked' | 'error' | 'skipped';
/**
 * Result of a collection attempt.
 *
 * This type represents the complete result of attempting to collect a quote,
 * including the raw payload, normalized quote, and any errors or blocks detected.
 *
 * **Note**: This type is currently not used in the codebase but is defined for
 * potential future use in standardized result handling or testing utilities.
 *
 * @property status - Status of the collection attempt (required)
 * @property raw_payload - Raw payload from provider API (present if fetch succeeded)
 * @property normalized_quote - Normalized quote object (present if parse succeeded)
 * @property error_code - Error code if an error occurred (present if status is 'error')
 * @property error_message - Human-readable error message (present if status is 'error')
 * @property block_detected - Whether a block was detected (present if status is 'blocked')
 * @property locale - Locale used for the request (required)
 */
export type CollectorResult = {
    /** Status of the collection attempt */
    status: CollectorStatus;
    /** Raw payload from provider API (present if fetch succeeded) */
    raw_payload?: unknown;
    /** Normalized quote object (present if parse succeeded) */
    normalized_quote?: NormalizedQuote;
    /** Error code if an error occurred (present if status is 'error') */
    error_code?: string;
    /** Human-readable error message (present if status is 'error') */
    error_message?: string;
    /** Whether a block was detected (present if status is 'blocked') */
    block_detected?: boolean;
    /** Locale used for the request */
    locale: string;
};
/**
 * Type guard to check if a value is a CollectorRequest.
 *
 * @param value - Value to check
 * @returns True if value is a valid CollectorRequest
 */
export declare const isCollectorRequest: (value: unknown) => value is CollectorRequest;
/**
 * Type guard to check if a value is a FetchResult.
 *
 * @param value - Value to check
 * @returns True if value is a valid FetchResult
 */
export declare const isFetchResult: (value: unknown) => value is FetchResult;
/**
 * Type guard to check if a value is a CollectorResult.
 *
 * @param value - Value to check
 * @returns True if value is a valid CollectorResult
 */
export declare const isCollectorResult: (value: unknown) => value is CollectorResult;
