export interface RateLimitOptions {
  windowMs: number // e.g. 60000 (1 minute)
  maxRequests: number // e.g. 120
}

const store = new Map<string, number[]>()

export const checkRateLimit = (
  key: string,
  options: RateLimitOptions,
): { allowed: boolean, remaining: number, resetMs: number } => {
  const now = Date.now()
  const windowStart = now - options.windowMs
  const timestamps = store.get(key) || []
  const valid = timestamps.filter(t => t > windowStart)

  if (valid.length >= options.maxRequests) {
    store.set(key, valid)
    return { allowed: false, remaining: 0, resetMs: valid[0] + options.windowMs - now }
  }

  valid.push(now)
  store.set(key, valid)
  return { allowed: true, remaining: options.maxRequests - valid.length, resetMs: options.windowMs }
}

// Periodic cleanup: keep this conservative. This is an in-memory limiter and should
// eventually move to Redis for multi-instance prod.
const cleanupEveryMs = 60_000
const maxAgeMs = 60_000 * 2

export const rateLimiterCleanupInterval = setInterval(() => {
  const now = Date.now()
  const cutoff = now - maxAgeMs

  for (const [key, timestamps] of store.entries()) {
    const valid = timestamps.filter(t => t > cutoff)
    if (valid.length === 0) store.delete(key)
    else store.set(key, valid)
  }
}, cleanupEveryMs)

// Don't keep the process alive just because of cleanup in tests/CLI.
rateLimiterCleanupInterval.unref?.()

export const resetRateLimiterForTests = () => {
  store.clear()
}
