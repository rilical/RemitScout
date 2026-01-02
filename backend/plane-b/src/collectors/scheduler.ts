import { createLogger } from '../../../shared/logger'
import { RedisTokenBucket } from '../lib/redis-token-bucket'

type SchedulerOptions = {
  providerId: string
  rpm: number
  perCorridorRpm: number
  baseDelayMs?: number
  jitterMs?: number
  globalEnabled?: boolean
  locale?: string
  perLocale?: boolean
  burstMultiplier?: number
  maxBuckets?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const logger = createLogger('plane-b.collectors.scheduler')

const MAX_RPM = 100000
const DEFAULT_MAX_BUCKETS = 1000
const DEFAULT_BURST_MULTIPLIER = 2

const validateRpm = (value: number, fieldName: string): number => {
  if (!Number.isFinite(value)) {
    logger.warn('scheduler_invalid_rpm', {
      field: fieldName,
      value,
      reason: 'not_finite',
    })
    return 0
  }
  if (value < 0) {
    logger.warn('scheduler_invalid_rpm', {
      field: fieldName,
      value,
      reason: 'negative',
    })
    return 0
  }
  if (value > MAX_RPM) {
    logger.warn('scheduler_invalid_rpm', {
      field: fieldName,
      value,
      reason: 'exceeds_max',
      max: MAX_RPM,
    })
    return MAX_RPM
  }
  return Math.max(0, Math.round(value))
}

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
export const createScheduler = (options: SchedulerOptions) => {
  const {
    providerId,
    globalEnabled = false,
    locale,
    perLocale = false,
    burstMultiplier = DEFAULT_BURST_MULTIPLIER,
    maxBuckets = DEFAULT_MAX_BUCKETS,
  } = options

  let rpm = validateRpm(options.rpm, 'rpm')
  let perCorridorRpm = validateRpm(options.perCorridorRpm, 'perCorridorRpm')
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 0)
  const jitterMs = Math.max(0, options.jitterMs ?? 0)
  const tokenBuckets = new Map<string, RedisTokenBucket>()

  const localeSuffix = perLocale && locale ? `:${locale}` : ''
  const providerKey = `token_bucket:${providerId}${localeSuffix}`

  const buildCorridorKey = (corridorId: string) => {
    return `token_bucket:corridor:${providerId}:${corridorId}${localeSuffix}`
  }

  const evictOldestBucket = () => {
    if (tokenBuckets.size < maxBuckets) {
      return
    }

    const firstKey = tokenBuckets.keys().next().value
    if (firstKey) {
      tokenBuckets.delete(firstKey)
      logger.debug('scheduler_bucket_evicted', {
        provider_id: providerId,
        key: firstKey,
        remaining_buckets: tokenBuckets.size,
      })
    }
  }

  const getBucket = (key: string, currentRpm: number) => {
    const existing = tokenBuckets.get(key)
    if (existing) {
      existing.updateRpm(currentRpm)
      existing.updateUseRedis(globalEnabled)
      return existing
    }

    evictOldestBucket()

    const bucket = new RedisTokenBucket(key, currentRpm, burstMultiplier, globalEnabled)
    tokenBuckets.set(key, bucket)
    logger.debug('scheduler_bucket_created', {
      provider_id: providerId,
      key,
      rpm: currentRpm,
      burst_multiplier: burstMultiplier,
      total_buckets: tokenBuckets.size,
    })
    return bucket
  }

  /**
   * Waits for a rate limit slot before making an API request.
   *
   * This method:
   * 1. Acquires a token from the corridor bucket (if perCorridorRpm > 0)
   * 2. Acquires a token from the provider bucket (if rpm > 0)
   * 3. Applies base delay, jitter, and penalty delays
   *
   * If token bucket acquisition fails (Redis error), the request is allowed
   * to proceed (fail-open behavior) to prevent blocking collectors.
   *
   * @param corridorId - Corridor identifier for per-corridor rate limiting
   * @param extraDelayMs - Additional delay from rate limit penalties (default: 0)
   * @param extraJitterMs - Additional jitter from rate limit penalties (default: 0)
   * @returns Total wait time in milliseconds
   */
  const waitForSlot = async (
    corridorId: string,
    extraDelayMs = 0,
    extraJitterMs = 0,
  ): Promise<number> => {
    if (perCorridorRpm > 0) {
      const corridorKey = buildCorridorKey(corridorId)
      const corridorBucket = getBucket(corridorKey, perCorridorRpm)
      try {
        await corridorBucket.acquireToken()
      } catch (error) {
        logger.warn('scheduler_corridor_bucket_error', {
          provider_id: providerId,
          corridor_id: corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (rpm > 0) {
      const providerBucket = getBucket(providerKey, rpm)
      try {
        await providerBucket.acquireToken()
      } catch (error) {
        logger.warn('scheduler_provider_bucket_error', {
          provider_id: providerId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const jitter = jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0
    const penaltyJitter = extraJitterMs > 0 ? Math.floor(Math.random() * extraJitterMs) : 0
    const waitMs = baseDelayMs + jitter + extraDelayMs + penaltyJitter
    if (waitMs > 0) {
      await sleep(waitMs)
    }
    return waitMs
  }

  /**
   * Updates rate limits and immediately applies to all existing buckets.
   *
   * This method:
   * 1. Validates and clamps new rates
   * 2. Updates local rpm and perCorridorRpm variables
   * 3. Updates the provider bucket immediately
   * 4. Updates all existing corridor buckets immediately
   *
   * New corridors will use the updated rates when first accessed.
   *
   * @param nextRpm - New provider-level RPM (0 = disabled)
   * @param nextPerCorridorRpm - New per-corridor RPM (0 = disabled)
   */
  const updateRates = (nextRpm: number, nextPerCorridorRpm: number) => {
    const validatedRpm = validateRpm(nextRpm, 'rpm')
    const validatedPerCorridorRpm = validateRpm(nextPerCorridorRpm, 'perCorridorRpm')

    const prevRpm = rpm
    const prevPerCorridorRpm = perCorridorRpm
    const rpmChanged = rpm !== validatedRpm
    const perCorridorRpmChanged = perCorridorRpm !== validatedPerCorridorRpm

    if (!rpmChanged && !perCorridorRpmChanged) {
      return
    }

    rpm = validatedRpm
    perCorridorRpm = validatedPerCorridorRpm

    if (rpmChanged) {
      const providerBucket = tokenBuckets.get(providerKey)
      if (providerBucket) {
        providerBucket.updateRpm(rpm)
      }
    }

    if (perCorridorRpmChanged) {
      for (const [key, bucket] of tokenBuckets.entries()) {
        if (key.startsWith(`token_bucket:corridor:${providerId}:`)) {
          bucket.updateRpm(perCorridorRpm)
        }
      }
    }

    logger.info('scheduler_rates_updated', {
      provider_id: providerId,
      prev_rpm: prevRpm,
      next_rpm: rpm,
      prev_per_corridor_rpm: prevPerCorridorRpm,
      next_per_corridor_rpm: perCorridorRpm,
      buckets_updated: tokenBuckets.size,
    })
  }

  /**
   * Cleans up all token buckets and releases resources.
   *
   * This should be called when the scheduler is no longer needed (e.g., at the
   * end of a collector run) to prevent memory leaks.
   */
  const cleanup = () => {
    const bucketCount = tokenBuckets.size
    tokenBuckets.clear()
    logger.info('scheduler_cleanup', {
      provider_id: providerId,
      buckets_cleared: bucketCount,
    })
  }

  return {
    waitForSlot,
    updateRates,
    cleanup,
  }
}
