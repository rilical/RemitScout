import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.rate-limit-redis')

const shouldSkipRateLimit = (request: FastifyRequest): boolean => {
  if (request.method === 'OPTIONS') return true
  const path = request.url.split('?')[0] || ''
  if (!path) return false
  return path === '/healthz' || path === '/readyz' || path === '/metrics'
}

interface RateLimitOptions {
  timeWindow: number // milliseconds
  max: number | ((request: FastifyRequest) => number)
  keyGenerator?: (request: FastifyRequest) => string
  skipOnError?: boolean
}

type MemoryEntry = { count: number; resetAt: number }

const createMemoryLimiter = (timeWindowMs: number) => {
  const store = new Map<string, MemoryEntry>()
  return (key: string) => {
    const now = Date.now()
    const entry = store.get(key)
    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + timeWindowMs })
      return { count: 1, resetAt: now + timeWindowMs }
    }
    entry.count += 1
    return { count: entry.count, resetAt: entry.resetAt }
  }
}

/**
 * Redis-based rate limiting for Lambda/ECS environments
 * Uses Redis for distributed rate limiting across Lambda invocations
 */
export const registerRedisRateLimit = async (
  app: FastifyInstance,
  options: RateLimitOptions,
): Promise<void> => {
  const redis = await getRedisClient()

  if (!redis) {
    logger.warn('rate_limit_redis_unavailable_falling_back', {
      message: 'Redis not available; falling back to in-memory rate limiting.',
    })
    registerMemoryRateLimit(app, options)
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
      const current = await redis.incr(redisKey)
      
      // Set expiration on first request
      if (current === 1) {
        await redis.expire(redisKey, timeWindowSeconds)
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
      if (options.skipOnError) {
        logger.warn('rate_limit_error_allowing_request', {
          message: 'Rate limit check failed, allowing request due to skipOnError',
        })
        return
      }

      // Fail closed in production posture: fall back to in-memory limiter for this invocation
      // rather than skipping rate limiting entirely.
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
  const store = new Map<string, { count: number; resetAt: number }>()
  const timeWindowMs = options.timeWindow

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
    const entry = store.get(key)

    // Clean up expired entries periodically
    if (store.size > 1000) {
      for (const [k, v] of store.entries()) {
        if (v.resetAt < now) {
          store.delete(k)
        }
      }
    }

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + timeWindowMs })
      reply.header('X-RateLimit-Limit', String(maxRequests))
      reply.header('X-RateLimit-Remaining', String(maxRequests - 1))
      reply.header('X-RateLimit-Reset', String(now + timeWindowMs))
      return
    }

    entry.count++
    reply.header('X-RateLimit-Limit', String(maxRequests))
    reply.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)))
    reply.header('X-RateLimit-Reset', String(entry.resetAt))

    if (entry.count > maxRequests) {
      logger.warn('rate_limit_exceeded_memory', {
        key,
        current: entry.count,
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
