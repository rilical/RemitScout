import { config } from '../../../shared/config'
import { fetchJwks } from './jwks-fetch'
import { getCachedJwks, setCachedJwks } from './jwks-cache'
import { verifyWithJwks } from './jwks-verify'
import { remoteVerify } from './remote-verify'
import type { AuthResult } from './types'
import { AuthError } from './types'

const parseBearerToken = (header?: string) => {
  if (!header) {
    return null
  }
  const trimmed = header.trim()
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return null
  }
  const token = trimmed.slice('bearer '.length).trim()
  return token || null
}

const makeError = (code: AuthError['code'], message: string): AuthError => ({ code, message })

export const verifySupabaseJwt = async (authorizationHeader?: string): Promise<AuthResult> => {
  const token = parseBearerToken(authorizationHeader)
  if (!token) {
    return makeError('missing_token', 'Missing or invalid Authorization header')
  }

  const mode = config.auth.supabase.verifyMode
  const allowJwks = mode === 'auto' || mode === 'jwks'
  const allowRemote = mode === 'auto' || mode === 'remote'

  if (allowJwks) {
    let keys = getCachedJwks()
    if (!keys) {
      keys = await fetchJwks()
      if (keys.length > 0) {
        setCachedJwks(keys, config.auth.supabase.remoteVerifyCacheTtlSeconds)
      }
    }

    if (keys && keys.length > 0) {
      const user = await verifyWithJwks(token, keys)
      if (user) {
        return user
      }
    }

    if (!allowRemote) {
      return makeError('invalid_token', 'JWT verification failed')
    }
  }

  if (allowRemote) {
    const user = await remoteVerify(token)
    if (user) {
      return user
    }
  }

  return makeError('verification_failed', 'JWT verification failed')
}
