import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { withTimeout } from '../../../shared/utils/timeout'
import { LRUCache } from 'lru-cache'

const logger = createLogger('plane-a.rate-limit-redis')

const shouldSkipRateLimit = (request: FastifyRequest): boolean => {
  if (request.method === 'OPTIONS') return true
  const path = request.url.split('?')[0] || ''
  if (!path) return false
  return path === '/healthz' || path === '/readyz' || path === '/metrics'
}

const isProdLikeRuntime = (): boolean => {
  const nodeEnv = String(config.env || '').trim().toLowerCase()
  const envName = String(config.envName || '').trim().toLowerCase()
  if (envName) {
    return envName === 'production' || envName === 'prod' || envName === 'staging'
  }
  return nodeEnv === 'production' || nodeEnv === 'staging'
}

interface RateLimitOptions {
  timeWindow: number // milliseconds
  max: number | ((request: FastifyRequest) => number)
  keyGenerator?: (request: FastifyRequest) => string
  skipOnError?: boolean
  fallbackMode?: 'memory' | 'reject' | 'skip'
}

type MemoryEntry = { count: number; resetAt: number }

const DEFAULT_MAX_MEMORY_KEYS = 50_000

export const createMemoryLimiterStore = (
  timeWindowMs: number,
  options?: { maxKeys?: number },
) => {
  const maxKeys = options?.maxKeys ?? DEFAULT_MAX_MEMORY_KEYS
  const cache = new LRUCache<string, MemoryEntry>({
    max: maxKeys,
  })

  const getOrIncrement = (key: string): MemoryEntry => {
    const now = Date.now()
    const entry = cache.get(key)

    if (!entry || entry.resetAt <= now) {
      const next = { count: 1, resetAt: now + timeWindowMs }
      cache.set(key, next, { ttl: timeWindowMs })
      return next
    }

    const next = { count: entry.count + 1, resetAt: entry.resetAt }
    cache.set(key, next, { ttl: Math.max(0, entry.resetAt - now) })
    return next
  }

  return {
    cache,
    getOrIncrement,
    size: () => cache.size,
  }
}

const createMemoryLimiter = (timeWindowMs: number) => {
  const store = createMemoryLimiterStore(timeWindowMs)
  return (key: string) => store.getOrIncrement(key)
}

const registerRejectingLimiter = (
  app: FastifyInstance,
  options: RateLimitOptions,
  reason: string,
) => {
  const retryAfterSeconds = Math.max(1, Math.ceil(options.timeWindow / 1000))
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (shouldSkipRateLimit(request)) {
      return
    }

    reply.header('Retry-After', String(retryAfterSeconds))
    reply.code(503)
    return {
      error: 'rate_limit_unavailable',
      message: 'Rate limiting is temporarily unavailable. Please retry shortly.',
      retryAfter: retryAfterSeconds,
      reason,
    }
  })
}

/**
 * Redis-based rate limiting for Lambda/ECS environments
 * Uses Redis for distributed rate limiting across Lambda invocations
 */
export const registerRedisRateLimit = async (
  app: FastifyInstance,
  options: RateLimitOptions,
): Promise<void> => {
  const runtimeProdLike = isProdLikeRuntime()
  const requestedFallbackMode = options.fallbackMode ?? 'memory'
  const fallbackMode = runtimeProdLike && requestedFallbackMode !== 'reject'
    ? 'reject'
    : requestedFallbackMode
  const skipOnError = runtimeProdLike ? false : Boolean(options.skipOnError)
  if (runtimeProdLike && (requestedFallbackMode !== fallbackMode || options.skipOnError)) {
    logger.warn('rate_limit_fail_closed_override', {
      message: 'Forcing fail-closed rate limiting behavior in production/staging runtime.',
      requested_fallback_mode: requestedFallbackMode,
      applied_fallback_mode: fallbackMode,
      requested_skip_on_error: Boolean(options.skipOnError),
    })
  }
  const redis = await getRedisClient()

  if (!redis) {
    if (fallbackMode === 'memory') {
      logger.warn('rate_limit_redis_unavailable_falling_back', {
        message: 'Redis not available; falling back to in-memory rate limiting.',
      })
      registerMemoryRateLimit(app, options)
      return
    }

    if (fallbackMode === 'skip') {
      logger.warn('rate_limit_redis_unavailable_skipping', {
        message: 'Redis not available; skipping rate limiting by configuration.',
      })
      return
    }

    logger.error('rate_limit_redis_unavailable_rejecting', {
      message: 'Redis not available; rejecting requests to avoid per-instance rate limiting drift.',
    })
    registerRejectingLimiter(app, options, 'redis_unavailable')
    return
  }

  const timeWindowMs = options.timeWindow
  const timeWindowSeconds = Math.ceil(timeWindowMs / 1000)
  const memoryLimit = createMemoryLimiter(timeWindowMs)

  // Use preHandler so auth hooks can populate request.user / request.apiKey first.
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (shouldSkipRateLimit(request)) {
      return
    }

    try {
      const maxRequests =
        typeof options.max === 'function' ? options.max(request) : options.max
      const key = options.keyGenerator
        ? options.keyGenerator(request)
        : `rate-limit:${request.ip}`

      const redisKey = `plane-a:rate-limit:${key}`

      // Use Redis INCR with EXPIRE for rate limiting
      const current = await withTimeout(redis.incr(redisKey), 2000, 'redis_rate_limit_incr')
      
      // Set expiration on first request
      if (current === 1) {
        await withTimeout(redis.expire(redisKey, timeWindowSeconds), 2000, 'redis_rate_limit_expire')
      }

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', String(maxRequests))
      reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current)))
      reply.header('X-RateLimit-Reset', String(Date.now() + timeWindowMs))

      if (current > maxRequests) {
        logger.warn('rate_limit_exceeded', {
          key,
          current,
          max: maxRequests,
          ip: request.ip,
          user_id: (request.user as { user_id?: string })?.user_id,
        })
        reply.code(429)
        return {
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindowSeconds} seconds.`,
          retryAfter: timeWindowSeconds,
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('rate_limit_error', {
        error: errorMessage,
        ip: request.ip,
      })

      // On error, allow request if skipOnError is true
      if (skipOnError) {
        logger.warn('rate_limit_error_allowing_request', {
          message: 'Rate limit check failed, allowing request due to skipOnError',
        })
        return
      }

      if (fallbackMode === 'memory') {
        logger.warn('rate_limit_error_falling_back_to_memory', {
          message: 'Rate limit check failed; using in-memory limiter fallback.',
          error: errorMessage,
        })

        const maxRequests =
          typeof options.max === 'function' ? options.max(request) : options.max
        const key = options.keyGenerator
          ? options.keyGenerator(request)
          : `rate-limit:${request.ip}`
        const entry = memoryLimit(key)

        reply.header('X-RateLimit-Limit', String(maxRequests))
        reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)))
        reply.header('X-RateLimit-Reset', String(entry.resetAt))

        if (entry.count > maxRequests) {
          reply.code(429)
          return {
            error: 'rate_limit_exceeded',
            message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindowSeconds} seconds.`,
            retryAfter: timeWindowSeconds,
          }
        }
        return
      }

      if (fallbackMode === 'reject') {
        logger.error('rate_limit_error_rejecting', {
          message: 'Rate limit check failed; rejecting request to avoid inconsistent enforcement.',
          error: errorMessage,
          ip: request.ip,
        })
        reply.header('Retry-After', String(timeWindowSeconds))
        reply.code(503)
        return {
          error: 'rate_limit_unavailable',
          message: 'Rate limiting is temporarily unavailable. Please retry shortly.',
          retryAfter: timeWindowSeconds,
        }
      }

      logger.warn('rate_limit_error_skipping', {
        message: 'Rate limit check failed; skipping by configuration.',
        error: errorMessage,
      })
    }
  })
}

/**
 * Fallback to in-memory rate limiting when Redis is unavailable
 * Note: This only works within a single Lambda invocation, not across invocations
 */
export const registerMemoryRateLimit = (
  app: FastifyInstance,
  options: RateLimitOptions,
): void => {
  const timeWindowMs = options.timeWindow
  const store = createMemoryLimiterStore(timeWindowMs)

  // Use preHandler so auth hooks can populate request.user / request.apiKey first.
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (shouldSkipRateLimit(request)) {
      return
    }

    const maxRequests =
      typeof options.max === 'function' ? options.max(request) : options.max
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : `rate-limit:${request.ip}`

    const now = Date.now()
    const entry = store.cache.get(key)

    if (!entry || entry.resetAt <= now) {
      const next = store.getOrIncrement(key)
      reply.header('X-RateLimit-Limit', String(maxRequests))
      reply.header('X-RateLimit-Remaining', String(maxRequests - 1))
      reply.header('X-RateLimit-Reset', String(next.resetAt))
      return
    }

    const next = store.getOrIncrement(key)
    reply.header('X-RateLimit-Limit', String(maxRequests))
    reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - next.count)))
    reply.header('X-RateLimit-Reset', String(next.resetAt))

    if (next.count > maxRequests) {
      logger.warn('rate_limit_exceeded_memory', {
        key,
        current: next.count,
        max: maxRequests,
      })
      reply.code(429)
      return {
        error: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.ceil(timeWindowMs / 1000)} seconds.`,
      }
    }
  })
}
