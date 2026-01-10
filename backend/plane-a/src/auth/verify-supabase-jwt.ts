import { createHash } from 'crypto'
import { config } from '../../../shared/config'
import { fetchJwks } from './jwks-fetch'
import { getCachedJwks, setCachedJwks } from './jwks-cache'
import { verifyWithJwks } from './jwks-verify'
import { remoteVerify } from './remote-verify'
import { AuthError, AuthUser } from './types'

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

const parseMockToken = (token: string, baseToken: string) => {
  if (!baseToken) return null
  if (token === baseToken) {
    return { email: null }
  }
  const prefix = `${baseToken}:`
  if (token.startsWith(prefix)) {
    const email = token.slice(prefix.length).trim()
    return { email: email || null }
  }
  return null
}

const makeError = (code: AuthError['code'], message: string): AuthError => ({ code, message })

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isUuid = (value: string) => uuidPattern.test(value)

const toDeterministicUuid = (value: string) => {
  const hash = createHash('sha256').update(value).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

const resolveMockUserId = (value: string, fallback: string) => {
  const candidate = value || fallback
  if (isUuid(candidate)) {
    return candidate
  }
  return toDeterministicUuid(candidate)
}

import type { AuthResult } from './types'

export const verifySupabaseJwt = async (authorizationHeader?: string): Promise<AuthResult> => {
  const token = parseBearerToken(authorizationHeader)
  if (!token) {
    return makeError('missing_token', 'Missing or invalid Authorization header')
  }

  if (config.auth.supabase.mock.enabled) {
    const { token: userToken, adminToken, userId, email, role, adminEmail } =
      config.auth.supabase.mock
    const adminMatch = parseMockToken(token, adminToken)
    const userMatch = parseMockToken(token, userToken)
    const isAdmin = !!adminMatch
    const isUser = !!userMatch

    if (!isAdmin && !isUser) {
      return makeError('invalid_token', 'Invalid mock token')
    }

    const tokenEmail = (adminMatch ?? userMatch)?.email
    const fallbackIdSource = isAdmin ? adminToken : userToken
    const resolvedUserId = resolveMockUserId(
      tokenEmail || userId || fallbackIdSource || 'dev-user',
      userId || fallbackIdSource || 'dev-user',
    )
    const resolvedEmail = tokenEmail || (isAdmin ? adminEmail : email)
    const resolvedRole = isAdmin ? 'admin' : role
    const claims = {
      sub: resolvedUserId,
      email: resolvedEmail,
      role: resolvedRole,
      mock: true,
    }

    return {
      user_id: resolvedUserId,
      email: resolvedEmail,
      role: resolvedRole,
      claims,
    }
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
