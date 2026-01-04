import { getRedisClient } from './redis'
import { createLogger } from './logger'
import { formatError } from './utils/error-handling'

const logger = createLogger('shared.repository-cache')

/**
 * ElastiCache/Redis caching layer for repository operations.
 * Provides TTL-based caching with automatic invalidation.
 */
export class RepositoryCache {
  private readonly namespace: string
  private readonly defaultTtlSeconds: number

  constructor(namespace: string, defaultTtlSeconds: number = 300) {
    this.namespace = namespace
    this.defaultTtlSeconds = defaultTtlSeconds
  }

  private buildKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  /**
   * Gets a cached value from Redis.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return null
      }

      const cacheKey = this.buildKey(key)
      const raw = await redis.get(cacheKey)
      if (!raw) {
        return null
      }

      try {
        return JSON.parse(raw) as T
      } catch {
        logger.warn('cache_parse_failed', { key: cacheKey })
        return null
      }
    } catch (error: unknown) {
      const { message } = formatError(error)
      logger.debug('cache_get_failed', { key, error: message })
      return null
    }
  }

  /**
   * Sets a cached value in Redis with TTL.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return false
      }

      const cacheKey = this.buildKey(key)
      const ttl = ttlSeconds ?? this.defaultTtlSeconds
      const payload = JSON.stringify(value)

      await redis.set(cacheKey, payload, { EX: ttl })
      return true
    } catch (error: unknown) {
      const { message } = formatError(error)
      logger.debug('cache_set_failed', { key, error: message })
      return false
    }
  }

  /**
   * Invalidates a cached value.
   */
  async invalidate(key: string): Promise<boolean> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return false
      }

      const cacheKey = this.buildKey(key)
      await redis.del(cacheKey)
      return true
    } catch (error: unknown) {
      const { message } = formatError(error)
      logger.debug('cache_invalidate_failed', { key, error: message })
      return false
    }
  }

  /**
   * Invalidates all keys matching a pattern.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return 0
      }

      const fullPattern = this.buildKey(pattern)
      const keys = await redis.keys(fullPattern)
      if (keys.length === 0) {
        return 0
      }

      await redis.del(keys)
      return keys.length
    } catch (error: unknown) {
      const { message } = formatError(error)
      logger.debug('cache_invalidate_pattern_failed', { pattern, error: message })
      return 0
    }
  }
}

/**
 * Cache instances for different data types.
 */
export const fxRateCache = new RepositoryCache('fx_rate', 300) // 5 minutes
export const fxRateHistoryCache = new RepositoryCache('fx_rate_history', 3600) // 1 hour
export const pulseCache = new RepositoryCache('pulse_cache', 3600) // 1 hour
export const queueDepthCache = new RepositoryCache('queue_depth', 30) // 30 seconds

