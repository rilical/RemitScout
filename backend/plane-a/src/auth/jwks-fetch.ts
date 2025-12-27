import { config } from '../../../shared/config'

export const fetchJwks = async (): Promise<unknown[]> => {
  if (!config.auth.supabase.jwksUrl) {
    return []
  }
  try {
    const response = await fetch(config.auth.supabase.jwksUrl)
    if (!response.ok) {
      return []
    }
    const payload = await response.json()
    if (!payload || typeof payload !== 'object') {
      return []
    }
    const keys = (payload as { keys?: unknown[] }).keys
    return Array.isArray(keys) ? keys : []
  } catch (_error) {
    return []
  }
}
