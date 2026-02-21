import type { Pool } from 'pg';
/**
 * Western Union Collector
 *
 * This collector orchestrates the collection of money transfer quotes from Western Union's API.
 * It handles rate limiting, circuit breaking, error recovery, and data persistence.
 *
 * Flow:
 * 1. Initialize collector with options and resolve rate limits
 * 2. For each corridor and amount bucket:
 *    - Check freshness SLO (if enabled) to skip recent quotes
 *    - Wait for rate limit slot via scheduler
 *    - Fetch quote from Western Union API
 *    - Write raw payload to bronze storage
 *    - Detect blocks/rate limits and handle accordingly
 *    - Parse provider-specific payload format
 *    - Normalize to standard quote format
 *    - Persist normalized quote to database
 *    - Run anomaly detection and dispatch signals if needed
 * 3. Apply rate limit penalties on errors, decay on success
 * 4. Update RPM rates based on performance metrics
 */
type WesternUnionCollectorOptions = {
    pool?: Pool;
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
    closePool?: boolean;
};
/**
 * Main collector function that orchestrates quote collection from Western Union.
 *
 * @param options - Configuration options for the collector run
 * @returns Promise<boolean> - true if collection completed successfully, false if blocked
 */
export declare const runWesternUnionCollector: (options?: WesternUnionCollectorOptions) => Promise<boolean>;
export {};
