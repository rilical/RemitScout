/**
 * Distributed export job limit using Redis.
 *
 * With multiple Plane A instances behind auto-scaling, a per-process count
 * is insufficient. This module uses a Redis counter keyed by user ID so the
 * limit is enforced cluster-wide.
 *
 * Design:
 * - `checkAndIncrementExportLimit` uses an atomic Lua script to INCR-and-
 *   check in a single Redis round-trip. The script only increments when the
 *   new value would not exceed the cap, eliminating the race window that
 *   existed with the previous INCR-then-DECR approach (where concurrent
 *   requests could see an inflated counter, and a failed DECR could leave
 *   the counter permanently stuck).
 * - `decrementExportCounter` is called by the export worker when a job
 *   finishes (success or failure) to release the slot.
 * - A TTL (default 24 h) is set on every key as a safety net against
 *   orphaned counters (e.g. worker crash before DECR).
 * - If Redis is unreachable the caller falls back to the existing DB-based
 *   count so exports are never fully blocked by a Redis outage.
 */

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'

const logger = createLogger('plane-a.exports-limit')

const REDIS_KEY_PREFIX = 'export:active'

const buildKey = (userId: string): string => `${REDIS_KEY_PREFIX}:${userId}`

/**
 * Lua script that atomically checks and increments the export counter.
 *
 * KEYS[1] — the counter key
 * ARGV[1] — max allowed value (the cap)
 * ARGV[2] — TTL in seconds for the safety-net expiry
 *
 * Returns:
 *   1  — slot acquired (counter was incremented)
 *   0  — rejected (counter already at or above the cap)
 *  -N  — rejected; the negative value is the current count (for diagnostics)
 */
const ATOMIC_INCREMENT_SCRIPT = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, ttl)
end
if current > max then
  redis.call('DECR', key)
  return -(current - 1)
end
redis.call('EXPIRE', key, ttl)
return 1
`

export type ExportLimitResult =
  | { limited: false; redisAvailable: true }
  | { limited: true; redisAvailable: true; currentCount: number }
  | { limited: false; redisAvailable: false }

/**
 * Atomically increment the user's active-export counter and check against
 * the configured maximum using a Lua script. The entire INCR-check-DECR
 * sequence runs inside Redis as a single atomic operation, preventing the
 * race condition where concurrent requests could see an inflated counter.
 *
 * Returns whether the request should be rate-limited and whether Redis was
 * available (so the caller can decide whether to fall back to the DB check).
 */
export const checkAndIncrementExportLimit = async (
  userId: string,
  maxActive: number,
): Promise<ExportLimitResult> => {
  const ttl = config.exports?.activeCounterTtlSeconds ?? 86400

  try {
    const redis = await getRedisClient()
    if (!redis) {
      logger.warn('export_limit_redis_unavailable', { user_id: userId })
      return { limited: false, redisAvailable: false }
    }

    const key = buildKey(userId)

    const result = await redis.eval(ATOMIC_INCREMENT_SCRIPT, {
      keys: [key],
      arguments: [String(maxActive), String(ttl)],
    })

    const code = Number(result)

    if (code === 1) {
      // Slot acquired — counter was incremented within the cap.
      return { limited: false, redisAvailable: true }
    }

    // code <= 0 means rejected; the absolute value is the current count.
    const currentCount = code === 0 ? maxActive : Math.abs(code)
    return { limited: true, redisAvailable: true, currentCount }
  } catch (error) {
    logger.warn('export_limit_check_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
    // Redis error — fall back to DB check.
    return { limited: false, redisAvailable: false }
  }
}

/**
 * Decrement the user's active-export counter when a job completes (or fails).
 * The counter is floored at 0 to avoid negative drift if DECR is called more
 * times than INCR (e.g. due to a deployment that introduced Redis tracking
 * after some jobs were already in flight).
 */
export const decrementExportCounter = async (userId: string): Promise<void> => {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      return
    }

    const key = buildKey(userId)
    const newVal = await redis.decr(key)

    // Floor at zero — if something went negative, reset to 0 so we don't
    // permanently under-count.
    if (newVal < 0) {
      await redis.set(key, '0')
      logger.warn('export_counter_negative_corrected', {
        user_id: userId,
        raw_value: newVal,
      })
    }
  } catch (error) {
    // Best-effort: a missed DECR means the counter is slightly high, but
    // the TTL safety net will clean it up within 24 hours.
    logger.warn('export_counter_decrement_failed', {
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
