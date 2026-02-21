type SchedulerOptions = {
    providerId: string;
    rpm: number;
    perCorridorRpm: number;
    baseDelayMs?: number;
    jitterMs?: number;
    globalEnabled?: boolean;
    locale?: string;
    perLocale?: boolean;
    scope?: string | null;
    burstMultiplier?: number;
    maxBuckets?: number;
};
/**
 * Rate limiting scheduler using token bucket algorithm.
 *
 * This scheduler enforces two-level rate limiting:
 * 1. **Provider-level**: Global RPM limit across all corridors
 * 2. **Corridor-level**: Per-corridor RPM limit to prevent hot-spotting
 *
 * The scheduler uses Redis token buckets for distributed rate limiting across
 * multiple collector instances. If Redis is unavailable, it falls back to local
 * token buckets with reduced capacity (50% of configured RPM).
 *
 * **Token Bucket Algorithm**:
 * - Each bucket has a capacity = RPM * burstMultiplier
 * - Tokens refill at rate of RPM per minute
 * - Requests consume tokens (1 token per request by default)
 * - If insufficient tokens, request waits until tokens are available
 *
 * **Rate Updates**:
 * - `updateRates()` immediately updates all existing buckets
 * - New buckets are created lazily when corridors are first accessed
 * - Buckets are never deleted (memory leak risk), use `cleanup()` to clear
 *
 * **Usage Pattern**:
 * ```typescript
 * const scheduler = createScheduler({
 *   providerId: 'remitly',
 *   rpm: 100,
 *   perCorridorRpm: 10,
 *   baseDelayMs: 100,
 *   jitterMs: 50,
 *   globalEnabled: true,
 * })
 *
 * // Before each API request:
 * await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs)
 *
 * // When penalties are applied:
 * scheduler.updateRates(newRpm, newPerCorridorRpm)
 *
 * // Cleanup when done:
 * scheduler.cleanup()
 * ```
 *
 * @param options - Scheduler configuration
 * @param options.providerId - Provider identifier (used in Redis keys)
 * @param options.rpm - Provider-level requests per minute (0 = disabled)
 * @param options.perCorridorRpm - Per-corridor requests per minute (0 = disabled)
 * @param options.baseDelayMs - Base delay between requests (default: 0)
 * @param options.jitterMs - Random jitter added to base delay (default: 0)
 * @param options.globalEnabled - Enable Redis for distributed rate limiting (default: false)
 * @param options.locale - Locale identifier (used in Redis keys if perLocale=true)
 * @param options.perLocale - Create separate buckets per locale (default: false)
 * @param options.burstMultiplier - Token bucket burst multiplier (default: 2)
 * @param options.maxBuckets - Maximum number of buckets before eviction (default: 1000)
 * @returns Scheduler instance with waitForSlot, updateRates, and cleanup methods
 */
export declare const createScheduler: (options: SchedulerOptions) => {
    waitForSlot: (corridorId: string, extraDelayMs?: number, extraJitterMs?: number) => Promise<number>;
    updateRates: (nextRpm: number, nextPerCorridorRpm: number) => void;
    cleanup: () => void;
};
export type Scheduler = ReturnType<typeof createScheduler>;
export {};
