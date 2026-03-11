import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import type { AuthUser, RemoteVerifyResult } from './types'

const logger = createLogger('plane-a.auth.remote-verify')

export const remoteVerify = async (token: string): Promise<RemoteVerifyResult> => {
  const apiKey =
    config.auth.supabase.serviceRoleKey ||
    config.auth.supabase.publishableKey
  if (!config.auth.supabase.url || !apiKey) {
    return { status: 'config_missing' }
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
      const httpStatus = response.status
      if (httpStatus === 401 || httpStatus === 403) {
        logger.warn('supabase_remote_verify_rejected', { status: httpStatus, error_type: 'auth_rejected' })
        return { status: 'auth_rejected', httpStatus }
      }
      // 5xx or other non-auth failures
      logger.warn('supabase_remote_verify_rejected', { status: httpStatus, error_type: 'service_unavailable' })
      return { status: 'service_unavailable', error: `Supabase returned HTTP ${httpStatus}` }
    }

    const payload = await response.json()
    const userId = payload?.id
    if (!userId) {
      logger.warn('supabase_remote_verify_rejected', { error_type: 'auth_rejected', reason: 'missing_user_id' })
      return { status: 'auth_rejected', httpStatus: 200 }
    }

    const user: AuthUser = {
      user_id: String(userId),
      email: typeof payload?.email === 'string' ? payload.email : undefined,
      role: typeof payload?.role === 'string' ? payload.role : undefined,
      claims: payload || {},
    }
    return { status: 'success', user }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('supabase_remote_verify_failed', { error: message, error_type: 'service_unavailable' })
    return { status: 'service_unavailable', error: message }
  }
}
