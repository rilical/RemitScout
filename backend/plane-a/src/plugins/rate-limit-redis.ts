import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getRedisClient } from '../../../shared/redis'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.rate-limit-redis')

const rateLimitBypassPrefixes = [
  '/api/analytics',
  '/api/v1/analytics',
  '/api/audit',
  '/api/v1/audit',
  '/api/ops',
  '/api/v1/ops',
  '/api/telemetry/analytics',
  '/api/v1/telemetry/analytics',
]

const shouldBypassRateLimit = (request: FastifyRequest): boolean => {
  if (config.env !== 'production' && config.env !== 'staging') {
    return true
  }
  const path = request.url.split('?')[0]
  if (!path) {
    return false
  }
  return rateLimitBypassPrefixes.some((prefix) => path.startsWith(prefix))
}

interface RateLimitOptions {
  timeWindow: number // milliseconds
  max: number | ((request: FastifyRequest) => number)
  keyGenerator?: (request: FastifyRequest) => string
  skipOnError?: boolean
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
    logger.warn('rate_limit_redis_unavailable', {
      message: 'Redis not available, rate limiting disabled. Consider using API Gateway throttling.',
    })
    return
  }

  const timeWindowMs = options.timeWindow
  const timeWindowSeconds = Math.ceil(timeWindowMs / 1000)

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting for OPTIONS requests
    if (request.method === 'OPTIONS') {
      return
    }
    if (shouldBypassRateLimit(request)) {
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

      // Default: allow request on error (fail open)
      logger.warn('rate_limit_error_allowing_request', {
        message: 'Rate limit check failed, allowing request (fail open)',
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
  const store = new Map<string, { count: number; resetAt: number }>()
  const timeWindowMs = options.timeWindow

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') {
      return
    }
    if (shouldBypassRateLimit(request)) {
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

