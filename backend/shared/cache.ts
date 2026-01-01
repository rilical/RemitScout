import { config } from './config'
import { createLogger } from './logger'
import { getRedisClient } from './redis'

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

type TtlCacheOptions = {
  namespace?: string
}

export type TtlCache<T> = {
  get: (key: string) => Promise<T | null>
  set: (key: string, value: T, ttlMs: number) => Promise<void>
  clear: () => Promise<void>
  size: () => number
}

const logger = createLogger('shared.cache')

const buildKey = (namespace: string | undefined, key: string) => {
  if (!namespace) return key
  return `${namespace}:${key}`
}

export const createTtlCache = <T>(options: TtlCacheOptions = {}): TtlCache<T> => {
  const entries = new Map<string, CacheEntry<T>>()
  const namespace = options.namespace?.trim()

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
    const expiresAt = Date.now() + Math.max(0, ttlMs)
    entries.set(key, { value, expiresAt })
  }

  const get = async (key: string): Promise<T | null> => {
    const redis = await getRedisClient()
    if (!redis) {
      return getFromMemory(key)
    }

    try {
      const raw = await redis.get(buildKey(namespace, key))
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch (error) {
      logger.warn('cache_get_failed', { error })
      return getFromMemory(key)
    }
  }

  const set = async (key: string, value: T, ttlMs: number) => {
    const redis = await getRedisClient()
    if (!redis) {
      setInMemory(key, value, ttlMs)
      return
    }

    try {
      const payload = JSON.stringify(value ?? null)
      await redis.set(buildKey(namespace, key), payload, {
        PX: Math.max(0, ttlMs),
      })
    } catch (error) {
      logger.warn('cache_set_failed', { error })
      setInMemory(key, value, ttlMs)
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
