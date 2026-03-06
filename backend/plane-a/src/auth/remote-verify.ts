import { config } from '../../../shared/config'
import { AuthUser } from './types'

export const remoteVerify = async (token: string): Promise<AuthUser | null> => {
  const apiKey =
    config.auth.supabase.serviceRoleKey ||
    config.auth.supabase.publishableKey
  if (!config.auth.supabase.url || !apiKey) {
    return null
  }

  try {
    const response = await fetch(`${config.auth.supabase.url.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: apiKey,
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
    return user
  } catch (_error) {
    return null
  }
}
