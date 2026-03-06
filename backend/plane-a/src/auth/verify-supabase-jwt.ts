import { config } from '../../../shared/config'
import { decodeJwt } from 'jose'
import { fetchJwks } from './jwks-fetch'
import { getCachedJwks, setCachedJwks } from './jwks-cache'
import { verifyWithJwks } from './jwks-verify'
import { remoteVerify } from './remote-verify'
import { createLogger } from '../../../shared/logger'
import type { AuthResult } from './types'
import { AuthError } from './types'

const logger = createLogger('plane-a.verify-supabase-jwt')

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

const maxTokenAgeSeconds = (() => {
  const parsed = config.planeA.maxTokenAgeSeconds
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})()

const enforceMaxTokenAge = (token: string): AuthError | null => {
  if (!maxTokenAgeSeconds) return null
  try {
    const payload = decodeJwt(token)
    const iat = payload.iat
    if (typeof iat !== 'number' || !Number.isFinite(iat)) {
      return makeError('invalid_token', 'Token is missing a valid iat claim.')
    }
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (iat > nowSeconds + 60) {
      return makeError('invalid_token', 'Token iat is in the future.')
    }
    if (nowSeconds - iat > maxTokenAgeSeconds) {
      return makeError('token_too_old', 'Token is too old. Please sign in again.')
    }
    return null
  } catch (error) {
    logger.warn('supabase_token_age_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return makeError('invalid_token', 'Token age verification failed.')
  }
}

const enforceEmailConfirmation = (token: string): AuthError | null => {
  if (!config.planeA.requireEmailConfirmation) return null
  try {
    const payload = decodeJwt(token)
    if (!payload.email_confirmed_at) {
      return makeError('email_not_confirmed', 'Email not confirmed. Please check your inbox.')
    }
    return null
  } catch (error) {
    logger.warn('supabase_email_confirmation_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return makeError('invalid_token', 'Email confirmation check failed.')
  }
}

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
        const ageError = enforceMaxTokenAge(token)
        if (ageError) return ageError
        const emailError = enforceEmailConfirmation(token)
        if (emailError) return emailError
        return user
      }

      logger.warn('supabase_jwt_signature_verification_failed', {
        mode,
      })
      if (!allowRemote) {
        return makeError('invalid_token', 'JWT signature verification failed')
      }
    }

    if (!allowRemote) {
      return makeError('invalid_token', 'JWT verification failed')
    }
  }

  if (allowRemote) {
    const user = await remoteVerify(token)
    if (user) {
      const ageError = enforceMaxTokenAge(token)
      if (ageError) return ageError
      const emailError = enforceEmailConfirmation(token)
      if (emailError) return emailError
      return user
    }
  }

  return makeError('verification_failed', 'JWT verification failed')
}
