import { createHash } from 'crypto'
import { getRedisClient } from '../../../shared/redis'

type RateLimitLogger = {
  warn: (event: string, meta?: Record<string, unknown>) => void
}

type RateLimitOptions = {
  logger: RateLimitLogger
  key: string
  limit: number
  ttlSeconds: number
  component: string
}

export const buildRateLimitKey = (prefix: string, seed: string) => {
  const hash = createHash('sha256').update(seed).digest('hex')
  return `${prefix}:${hash}`
}

export const checkRateLimit = async (options: RateLimitOptions): Promise<boolean> => {
  const { logger, key, limit, ttlSeconds, component } = options

  try {
    const redis = await getRedisClient()
    if (!redis) {
      logger.warn(`${component}_rate_limit_disabled`, { reason: 'redis_unavailable' })
      return false
    }

    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, ttlSeconds)
    }
    return count > limit
  } catch (error) {
    logger.warn(`${component}_rate_limit_failed`, {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
