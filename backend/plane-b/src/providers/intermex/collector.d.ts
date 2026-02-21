import type { Pool } from 'pg';
/**
 * Intermex Collector
 *
 * Orchestrates quote collection from Intermex API while handling
 * rate limits, circuit breaking, and persistence.
 */
type IntermexCollectorOptions = {
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
export declare const runIntermexCollector: (options?: IntermexCollectorOptions) => Promise<boolean>;
export {};
