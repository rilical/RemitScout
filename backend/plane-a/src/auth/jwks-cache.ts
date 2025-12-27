import { config } from '../../../shared/config'

let cachedKeys: unknown[] | null = null
let expiresAt = 0

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
