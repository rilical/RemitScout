import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.redis-token-bucket')

const MAX_RPM = 100000
const MAX_BURST_MULTIPLIER = 10
const MAX_RETRIES = 1000
const LOCAL_BUCKET_TTL_MS = 60 * 60 * 1000
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

const ACQUIRE_TOKEN_SCRIPT = `
  local key = KEYS[1]
  local rate = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local state_raw = redis.call("get", key)
  local tokens = capacity
  local last_refill = now

  if state_raw then
    local state = cjson.decode(state_raw)
    tokens = tonumber(state.tokens) or capacity
    last_refill = tonumber(state.last_refill) or now
  end

  local elapsed_ms = math.max(0, now - last_refill)
  local refill_tokens = (elapsed_ms / 60000.0) * rate
  tokens = math.min(capacity, tokens + refill_tokens)

  local wait_ms = 0
  if tokens >= requested then
    tokens = tokens - requested
  else
    local tokens_needed = requested - tokens
    if rate > 0 then
      wait_ms = math.ceil((tokens_needed / rate) * 60000)
    else
      wait_ms = 60000
    end
  end

  local time_to_full = 0
  if rate > 0 then
    time_to_full = math.ceil(((capacity - tokens) / rate) * 60000)
  else
    time_to_full = 60000
  end
  time_to_full = math.max(1000, time_to_full)

  local new_state = cjson.encode({tokens = tokens, last_refill = now})
  redis.call("set", key, new_state, "PX", time_to_full)

  if wait_ms > 0 then
    return {0, wait_ms}
  end

  return {1, 0}
`

type LocalBucketState = {
  tokens: number
  lastRefill: number
  rpm: number
  capacity: number
  burstMultiplier: number
  lastAccess: number
}

const localBuckets = new Map<string, LocalBucketState>()
const warnedKeys = new Set<string>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isValidRedisResult = (value: unknown): value is [number, number] => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  )
}

const cleanupLocalBuckets = () => {
  const now = Date.now()
  let cleaned = 0
  for (const [key, bucket] of localBuckets.entries()) {
    if (now - bucket.lastAccess > LOCAL_BUCKET_TTL_MS) {
      localBuckets.delete(key)
      cleaned++
    }
  }
  if (cleaned > 0) {
    logger.debug('local_buckets_cleaned', { cleaned, remaining: localBuckets.size })
  }
}

let cleanupInterval: NodeJS.Timeout | null = null
if (!cleanupInterval) {
  cleanupInterval = setInterval(cleanupLocalBuckets, CLEANUP_INTERVAL_MS)
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }
}

const getLocalBucket = (key: string, rpm: number, burstMultiplier: number) => {
  const capacity = rpm * burstMultiplier
  const now = Date.now()
  const existing = localBuckets.get(key)
  if (existing) {
    existing.rpm = rpm
    existing.capacity = capacity
    existing.burstMultiplier = burstMultiplier
    existing.tokens = Math.min(existing.tokens, capacity)
    existing.lastAccess = now
    return existing
  }
  const bucket: LocalBucketState = {
    tokens: capacity,
    lastRefill: now,
    rpm,
    capacity,
    burstMultiplier,
    lastAccess: now,
  }
  localBuckets.set(key, bucket)
  return bucket
}

const refillLocalBucket = (bucket: LocalBucketState, now: number) => {
  const elapsedMs = Math.max(0, now - bucket.lastRefill)
  const refillTokens = (elapsedMs / 60000) * bucket.rpm
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refillTokens)
  bucket.lastRefill = now
}

const acquireLocalToken = (
  key: string,
  rpm: number,
  burstMultiplier: number,
  requested: number,
) => {
  const bucket = getLocalBucket(key, rpm, burstMultiplier)
  const now = Date.now()
  refillLocalBucket(bucket, now)
  if (bucket.tokens >= requested) {
    bucket.tokens -= requested
    return { allowed: true, waitMs: 0 }
  }
  if (rpm <= 0) {
    return { allowed: true, waitMs: 0 }
  }
  const tokensNeeded = requested - bucket.tokens
  const waitMs = Math.ceil((tokensNeeded / rpm) * 60000)
  return { allowed: false, waitMs }
}

/**
 * Token bucket rate limiter using Redis for distributed coordination or local fallback.
 *
 * Implements token bucket algorithm:
 * - Capacity = RPM * burstMultiplier tokens
 * - Refill rate = RPM tokens per minute
 * - Consumption = 1 token per request (configurable)
 *
 * **Redis Path (Primary)**:
 * - Uses Lua script for atomic refill and check
 * - Stores state: {tokens, last_refill} with TTL
 * - Distributed coordination across multiple instances
 *
 * **Local Fallback (when Redis unavailable)**:
 * - In-memory buckets with automatic cleanup
 * - Uses 75% of configured RPM
 * - Uses configured burstMultiplier
 * - Per-instance (not distributed)
 *
 * @example
 * ```typescript
 * const bucket = new RedisTokenBucket('token_bucket:provider:remitly', 100, 2, true)
 * await bucket.acquireToken() // Blocks until token available
 * bucket.updateRpm(50) // Update rate dynamically
 * ```
 */
export class RedisTokenBucket {
  private key: string
  private rpm: number
  private burstMultiplier: number
  private useRedis: boolean

  /**
   * Creates a new token bucket rate limiter.
   *
   * @param key - Redis key for bucket state (must be non-empty)
   * @param rpm - Requests per minute (0 = disabled, max = 100000)
   * @param burstMultiplier - Burst capacity multiplier (default: 2, max: 10)
   * @param useRedis - Enable Redis for distributed coordination (default: true)
   * @throws Error if parameters are invalid
   */
  constructor(key: string, rpm: number, burstMultiplier = 2, useRedis = true) {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      throw new Error('Invalid key: must be non-empty string')
    }
    if (!Number.isFinite(rpm) || rpm < 0 || rpm > MAX_RPM) {
      throw new Error(`Invalid RPM: must be 0-${MAX_RPM}, got ${rpm}`)
    }
    if (!Number.isFinite(burstMultiplier) || burstMultiplier <= 0 || burstMultiplier > MAX_BURST_MULTIPLIER) {
      throw new Error(`Invalid burstMultiplier: must be >0 and <=${MAX_BURST_MULTIPLIER}, got ${burstMultiplier}`)
    }
    this.key = key
    this.rpm = rpm
    this.burstMultiplier = burstMultiplier
    this.useRedis = useRedis
  }

  /**
   * Updates the rate limit dynamically.
   *
   * @param rpm - New requests per minute (0 = disabled)
   */
  updateRpm(rpm: number) {
    this.rpm = rpm
  }

  /**
   * Toggles Redis usage for distributed coordination.
   *
   * @param useRedis - Enable/disable Redis
   */
  updateUseRedis(useRedis: boolean) {
    this.useRedis = useRedis
  }

  /**
   * Acquires tokens, blocking until available.
   *
   * Retries until tokens are available or max retries exceeded.
   * Falls back to local buckets if Redis is unavailable.
   *
   * @param requested - Number of tokens to acquire (default: 1)
   * @throws Error if acquisition fails after max retries or invalid requested value
   */
  async acquireToken(requested = 1): Promise<void> {
    if (!Number.isFinite(requested) || requested <= 0) {
      throw new Error(`Invalid requested tokens: must be >0, got ${requested}`)
    }
    const capacity = this.rpm * this.burstMultiplier
    if (requested > capacity) {
      throw new Error(`Requested tokens (${requested}) exceeds capacity (${capacity})`)
    }
    if (!Number.isFinite(this.rpm) || this.rpm <= 0) return

    let retries = 0
    while (retries < MAX_RETRIES) {
      const result = await this.tryAcquire(requested)
      if (result.allowed) return

      const waitMs = Math.max(1, result.waitMs)
      if (waitMs === 0) {
        logger.warn('token_bucket_zero_wait', { key: this.key, retries })
        await sleep(100)
      } else {
        await sleep(waitMs)
      }
      retries++
    }

    throw new Error(`Token bucket acquisition failed after ${MAX_RETRIES} retries for key: ${this.key}`)
  }

  private async tryAcquire(requested: number): Promise<{ allowed: boolean; waitMs: number }> {
    if (this.useRedis) {
      const redis = await getRedisClient()
      if (redis) {
        try {
          const capacity = this.rpm * this.burstMultiplier
          const now = Date.now()
          const result = await redis.eval(ACQUIRE_TOKEN_SCRIPT, {
            keys: [this.key],
            arguments: [String(this.rpm), String(capacity), String(now), String(requested)],
          })

          if (!isValidRedisResult(result)) {
            logger.error('redis_invalid_result', {
              key: this.key,
              result: JSON.stringify(result),
            })
            throw new Error('Invalid Redis result format')
          }

          const allowed = result[0] === 1
          const waitMs = result[1] || 0
          return { allowed, waitMs }
        } catch (error) {
          logger.error('redis_token_bucket_error', {
            key: this.key,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    if (!warnedKeys.has(this.key)) {
      logger.warn('redis_unavailable_fallback', {
        key: this.key,
        note: 'Using local bucket (not distributed across instances)',
      })
      warnedKeys.add(this.key)
    }
    const fallbackRpm = Math.max(1, Math.floor(this.rpm * 0.75))
    return acquireLocalToken(this.key, fallbackRpm, this.burstMultiplier, requested)
  }
}

/**
 * Creates a token bucket with a generated key for provider/corridor/locale.
 *
 * @param providerId - Provider identifier (e.g., 'remitly')
 * @param corridorId - Corridor identifier (e.g., 'US-PH') or null for provider-level
 * @param locale - Locale identifier (e.g., 'en-US') or null
 * @param rpm - Requests per minute (0 = disabled)
 * @param useRedis - Enable Redis for distributed coordination (default: true)
 * @param burstMultiplier - Burst capacity multiplier (default: 2)
 * @returns RedisTokenBucket instance
 */
export const createTokenBucket = (
  providerId: string,
  corridorId: string | null,
  locale: string | null,
  rpm: number,
  useRedis = true,
  burstMultiplier = 2,
) => {
  const localeSuffix = locale ? `:${locale}` : ''
  const key = corridorId
    ? `token_bucket:corridor:${providerId}:${corridorId}${localeSuffix}`
    : `token_bucket:${providerId}${localeSuffix}`
  return new RedisTokenBucket(key, rpm, burstMultiplier, useRedis)
}
