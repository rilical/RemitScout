import type { Pool } from 'pg';
/**
 * XE Collector
 *
 * This collector orchestrates the collection of money transfer quotes from XE's API.
 * It handles rate limiting, circuit breaking, error recovery, and data persistence.
 *
 * Flow:
 * 1. Initialize collector with options and resolve rate limits
 * 2. For each corridor and amount bucket:
 *    - Check freshness SLO (if enabled) to skip recent quotes
 *    - Wait for rate limit slot via scheduler
 *    - Fetch quote from XE API
 *    - Write raw payload to bronze storage
 *    - Detect blocks/rate limits and handle accordingly
 *    - Parse provider-specific payload format
 *    - Normalize to standard quote format
 *    - Persist normalized quote to database
 *    - Run anomaly detection and dispatch signals if needed
 * 3. Apply rate limit penalties on errors, decay on success
 * 4. Update RPM rates based on performance metrics
 */
type XeCollectorOptions = {
    pool?: Pool;
    closePool?: boolean;
    corridors?: string[];
    delayMs?: number;
    jitterMs?: number;
    rateLimitBackoffMs?: number;
    rateLimitJitterMs?: number;
    rateLimitMaxRetries?: number;
    corridorDelayMs?: number;
    corridorJitterMs?: number;
    amountBuckets?: number[];
    payinMethod?: string;
    payoutMethod?: string;
    locale?: string;
    collectorType?: string;
    freshnessSloMinutes?: number;
    freshnessSloEnabled?: boolean;
    rpmOverride?: number;
    perCorridorRpmOverride?: number;
};
/**
 * Main collector function that orchestrates quote collection from XE.
 *
 * @param options - Configuration options for the collector run
 * @returns Promise<boolean> - true if collection completed successfully, false if blocked
 */
export declare const runXeCollector: (options?: XeCollectorOptions) => Promise<boolean>;
export {};
