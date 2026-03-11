import { config } from '../../../shared/config'

let cachedKeys: unknown[] | null = null
let expiresAt = 0

/**
 * Minimum interval (ms) between forced cache invalidations.
 * Prevents cache stampede when many requests fail simultaneously.
 */
const FORCE_REFRESH_COOLDOWN_MS = 30_000
let lastForceRefreshAt = 0

export const getCachedJwks = () => {
  if (!config.auth.supabase.jwksUrl) {
    return null
  }
  if (!cachedKeys || Date.now() >= expiresAt) {
    cachedKeys = null
    return null
  }
  return cachedKeys
}

export const setCachedJwks = (keys: unknown[], ttlSeconds: number) => {
  if (!config.auth.supabase.jwksUrl) {
    return
  }
  cachedKeys = keys
  expiresAt = Date.now() + ttlSeconds * 1000
}

/**
 * Force-invalidate the JWKS cache so the next getCachedJwks() call returns null.
 * Returns true if the cache was actually invalidated, false if the cooldown prevented it.
 *
 * H7: When JWT verification fails (e.g., after JWKS key rotation), callers
 * invoke this to force a fresh fetch. The cooldown prevents cache stampede
 * if many requests fail at once.
 */
export const invalidateCachedJwks = (): boolean => {
  const now = Date.now()
  if (now - lastForceRefreshAt < FORCE_REFRESH_COOLDOWN_MS) {
    return false
  }
  lastForceRefreshAt = now
  cachedKeys = null
  expiresAt = 0
  return true
}
