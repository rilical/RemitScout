import { config } from '../../../shared/config'
import { AuthUser } from './types'

const cache = new Map<string, { user: AuthUser; expiresAt: number }>()

const getFromCache = (token: string) => {
  const cached = cache.get(token)
  if (!cached) {
    return null
  }
  if (Date.now() >= cached.expiresAt) {
    cache.delete(token)
    return null
  }
  return cached.user
}

const setCache = (token: string, user: AuthUser) => {
  const ttlSeconds = config.auth.supabase.remoteVerifyCacheTtlSeconds
  cache.set(token, { user, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export const remoteVerify = async (token: string): Promise<AuthUser | null> => {
  if (!config.auth.supabase.url || !config.auth.supabase.publishableKey) {
    return null
  }

  const cached = getFromCache(token)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(`${config.auth.supabase.url.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: config.auth.supabase.publishableKey,
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    const userId = payload?.id
    if (!userId) {
      return null
    }

    const user: AuthUser = {
      user_id: String(userId),
      email: typeof payload?.email === 'string' ? payload.email : undefined,
      role: typeof payload?.role === 'string' ? payload.role : undefined,
      claims: payload || {},
    }

    setCache(token, user)
    return user
  } catch (_error) {
    return null
  }
}
