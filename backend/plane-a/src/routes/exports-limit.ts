/**
 * Distributed export job limit using Redis.
 *
 * With multiple Plane A instances behind auto-scaling, a per-process count
 * is insufficient. This module uses a Redis INCR/DECR counter keyed by
 * user ID so the limit is enforced cluster-wide.
 *
 * Design:
 * - `checkAndIncrementExportLimit` atomically increments and checks in one
 *   round-trip (INCR then compare). If the new value exceeds the cap the
 *   counter is immediately decremented so it stays accurate.
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

export type ExportLimitResult =
  | { limited: false; redisAvailable: true }
  | { limited: true; redisAvailable: true; currentCount: number }
  | { limited: false; redisAvailable: false }

/**
 * Atomically increment the user's active-export counter and check against
 * the configured maximum. If the user is over the limit the counter is
 * immediately rolled back so it stays accurate.
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

    // Atomic increment — returns the new value after incrementing.
    const newCount = await redis.incr(key)

    // Always refresh the TTL so the safety-net window slides forward while
    // the user has active exports.
    await redis.expire(key, ttl)

    if (newCount > maxActive) {
      // Over the limit: roll back the increment we just performed.
      await redis.decr(key)
      return { limited: true, redisAvailable: true, currentCount: newCount - 1 }
    }

    return { limited: false, redisAvailable: true }
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
