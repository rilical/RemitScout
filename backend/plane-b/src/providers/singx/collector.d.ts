import type { Pool } from 'pg';
/**
 * SingX Collector
 *
 * Orchestrates quote collection from SingX while handling rate limits,
 * block detection, and persistence.
 */
type SingxCollectorOptions = {
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
export declare const runSingxCollector: (options?: SingxCollectorOptions) => Promise<boolean>;
export {};
