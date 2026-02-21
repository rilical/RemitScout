import type { Pool } from 'pg';
import type { ProviderRates } from './rate-config';
export type SweepStats = {
    attemptCount: number;
    successCount: number;
    blockCount: number;
    rateLimitCount: number;
    http2xxCount: number;
};
type RampOptions = {
    pool: Pool;
    providerId: string;
    collectorType: string;
    stats: SweepStats;
    rates: ProviderRates;
    maxRpm?: number;
    thresholds?: RampThresholds;
};
export type RampThresholds = {
    highBlockRate: number;
    moderateBlockRate: number;
    lowBlockRate: number;
    http2xxStableThreshold: number;
    errorBudgetMinAttempts: number;
    errorBudgetRateLimitRate: number;
    errorBudgetBlockRate: number;
    errorBudgetDecreasePercent: number;
    decreaseBasePercent: number;
    decreaseMaxPercent: number;
    increaseBasePercent: number;
    increaseMaxPercent: number;
    moderateDecreasePercent: number;
    successRateWeight: number;
};
/**
 * Adaptive RPM (requests per minute) adjustment system for provider API collectors.
 *
 * This function adjusts rate limits based on performance metrics:
 * - Decreases RPM when blocks or rate limits are detected
 * - Increases RPM when performance is stable and block rate is low
 * - Holds RPM when conditions are moderate
 *
 * Algorithm:
 * 1. High pressure (rate limits OR blockRate >= highBlockRate): Decrease RPM
 *    - Decrease scales from basePercent to maxPercent based on pressure severity
 * 2. Moderate pressure (moderateBlockRate <= blockRate < highBlockRate): Small decrease
 *    - Applies moderateDecreasePercent reduction
 * 3. Low pressure (blockRate < moderateBlockRate AND http2xxRate >= stableThreshold): Increase RPM
 *    - Increase scales from basePercent to maxPercent based on how low block rate is
 * 4. Otherwise: Hold current RPM
 *
 * The perCorridorRpm is adjusted proportionally when rpm changes to maintain balance.
 *
 * @param options - Configuration for RPM ramp adjustment
 * @param options.pool - Database connection pool
 * @param options.providerId - Provider identifier
 * @param options.collectorType - Type of collector (only sweep collectors are adjusted)
 * @param options.stats - Performance statistics from the collection run
 * @param options.rates - Current provider rate limits
 * @param options.thresholds - Optional custom thresholds (defaults to DEFAULT_THRESHOLDS)
 */
export declare const applyRpmRamp: (options: RampOptions) => Promise<void>;
export {};
