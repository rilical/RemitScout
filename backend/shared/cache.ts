import { config } from './config'
import { createLogger } from './logger'
import { getRedisClient } from './redis'
import { trackCacheHit, trackCacheMiss } from './cache-metrics'

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

type TtlCacheOptions = {
  namespace?: string
  maxEntries?: number
  pruneIntervalMs?: number
}

export type TtlCache<T> = {
  get: (key: string) => Promise<T | null>
  set: (key: string, value: T, ttlMs: number) => Promise<void>
  clear: () => Promise<void>
  size: () => number
}

const logger = createLogger('shared.cache')
const DEFAULT_MAX_ENTRIES = 10000
const DEFAULT_PRUNE_INTERVAL_MS = 60000

const buildKey = (namespace: string | undefined, key: string) => {
  if (!namespace) return key
  return `${namespace}:${key}`
}

export const createTtlCache = <T>(options: TtlCacheOptions = {}): TtlCache<T> => {
  const entries = new Map<string, CacheEntry<T>>()
  const namespace = options.namespace?.trim()
  const maxEntries = Math.max(0, options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const pruneIntervalMs = Math.max(1000, options.pruneIntervalMs ?? DEFAULT_PRUNE_INTERVAL_MS)
  let lastPruneAt = 0

  const pruneExpired = () => {
    if (entries.size === 0) return
    const now = Date.now()
    for (const [key, entry] of entries) {
      if (now >= entry.expiresAt) {
        entries.delete(key)
      }
    }
  }

  const enforceMaxEntries = () => {
    if (maxEntries <= 0 || entries.size <= maxEntries) return
    const overflow = entries.size - maxEntries
    const keys = entries.keys()
    for (let i = 0; i < overflow; i += 1) {
      const key = keys.next().value
      if (key === undefined) break
      entries.delete(key)
    }
  }

  const pruneIfNeeded = () => {
    const now = Date.now()
    if (now - lastPruneAt >= pruneIntervalMs) {
      pruneExpired()
      lastPruneAt = now
    }
    enforceMaxEntries()
  }

  const getFromMemory = (key: string): T | null => {
    const entry = entries.get(key)
    if (!entry) return null
    if (Date.now() >= entry.expiresAt) {
      entries.delete(key)
      return null
    }
    return entry.value
  }

  const setInMemory = (key: string, value: T, ttlMs: number) => {
    const expiresAt = ttlMs <= 0 ? Number.POSITIVE_INFINITY : Date.now() + ttlMs
    entries.set(key, { value, expiresAt })
  }

  const get = async (key: string): Promise<T | null> => {
    pruneIfNeeded()
    const redis = await getRedisClient()
    if (!redis) {
      const memoryValue = getFromMemory(key)
      if (memoryValue === null) {
        trackCacheMiss(namespace, 'memory')
      } else {
        trackCacheHit(namespace, 'memory')
      }
      return memoryValue
    }

    let raw: string | null
    try {
      raw = await redis.get(buildKey(namespace, key))
    } catch (error) {
      logger.warn('cache_get_failed', { error })
      trackCacheMiss(namespace, 'redis')
      const fallbackValue = getFromMemory(key)
      if (fallbackValue === null) {
        trackCacheMiss(namespace, 'memory')
      } else {
        trackCacheHit(namespace, 'memory')
      }
      return fallbackValue
    }

    if (!raw) {
      trackCacheMiss(namespace, 'redis')
      const fallbackValue = getFromMemory(key)
      if (fallbackValue === null) {
        trackCacheMiss(namespace, 'memory')
      } else {
        trackCacheHit(namespace, 'memory')
      }
      return fallbackValue
    }

    try {
      const parsed = JSON.parse(raw) as T
      trackCacheHit(namespace, 'redis')
      return parsed
    } catch (error) {
      logger.warn('cache_parse_failed', { error })
      trackCacheMiss(namespace, 'redis')
      const fallbackValue = getFromMemory(key)
      if (fallbackValue === null) {
        trackCacheMiss(namespace, 'memory')
      } else {
        trackCacheHit(namespace, 'memory')
      }
      return fallbackValue
    }
  }

  const set = async (key: string, value: T, ttlMs: number) => {
    setInMemory(key, value, ttlMs)
    pruneIfNeeded()
    const redis = await getRedisClient()
    if (!redis) {
      return
    }

    try {
      const payload = JSON.stringify(value ?? null)
      await redis.set(buildKey(namespace, key), payload, {
        PX: Math.max(0, ttlMs),
      })
    } catch (error) {
      logger.warn('cache_set_failed', { error })
    }
  }

  const clear = async () => {
    entries.clear()
    if (!config.redis.url) return
    logger.warn('cache_clear_redis_unsupported', { namespace: namespace ?? null })
  }

  const size = () => entries.size

  return { get, set, clear, size }
}
