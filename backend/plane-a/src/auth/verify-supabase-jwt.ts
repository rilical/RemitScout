import { config } from '../../../shared/config'
import { decodeJwt } from 'jose'
import { fetchJwks } from './jwks-fetch'
import { getCachedJwks, setCachedJwks, invalidateCachedJwks } from './jwks-cache'
import { verifyWithJwks } from './jwks-verify'
import { remoteVerify } from './remote-verify'
import { createLogger } from '../../../shared/logger'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import type { AuthResult, RemoteVerifyResult } from './types'
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

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

const isTruthyTimestamp = (value: unknown) => {
  if (typeof value === 'string') return value.trim().length > 0
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

const isVerifiedFlag = (value: unknown) => {
  return value === true || value === 'true'
}

const hasConfirmedEmailClaim = (claims?: Record<string, unknown>): boolean => {
  if (!claims) return false
  if (isTruthyTimestamp(claims.email_confirmed_at) || isTruthyTimestamp(claims.confirmed_at)) {
    return true
  }
  if (isVerifiedFlag(claims.email_verified)) {
    return true
  }

  const userMetadata = asRecord(claims.user_metadata)
  if (isVerifiedFlag(userMetadata?.email_verified)) {
    return true
  }

  const identities = Array.isArray(claims.identities) ? claims.identities : []
  return identities.some((identity) => {
    const row = asRecord(identity)
    return (
      isTruthyTimestamp(row?.email_confirmed_at) ||
      isTruthyTimestamp(row?.confirmed_at) ||
      isVerifiedFlag(row?.email_verified)
    )
  })
}

const enforceEmailConfirmation = (claims?: Record<string, unknown>): AuthError | null => {
  if (!config.planeA.requireEmailConfirmation) return null
  if (!hasConfirmedEmailClaim(claims)) {
    return makeError('email_not_confirmed', 'Email not confirmed. Please check your inbox.')
  }
  return null
}

const resolveEmailConfirmation = async (
  token: string,
  mode: typeof config.auth.supabase.verifyMode,
  allowRemote: boolean,
  userClaims?: Record<string, unknown>,
): Promise<{ userClaims?: Record<string, unknown>; error: AuthError | null }> => {
  const directError = enforceEmailConfirmation(userClaims)
  if (!directError) {
    return { userClaims, error: null }
  }

  if (!allowRemote) {
    return { userClaims, error: directError }
  }

  const remoteResult = await remoteVerify(token)
  if (remoteResult.status === 'service_unavailable') {
    emitRemoteVerifyMetric(remoteResult)
    logger.warn('supabase_email_confirmation_remote_check_failed', {
      mode,
      error_type: remoteResult.status,
      error: remoteResult.error,
    })
    return {
      userClaims,
      error: makeError('verification_failed', 'JWT verification failed'),
    }
  }
  if (remoteResult.status !== 'success') {
    logger.warn('supabase_email_confirmation_remote_check_failed', {
      mode,
      error_type: remoteResult.status,
    })
    return {
      userClaims,
      error: makeError('verification_failed', 'JWT verification failed'),
    }
  }

  const remoteError = enforceEmailConfirmation(asRecord(remoteResult.user.claims))
  if (remoteError) {
    return { userClaims: asRecord(remoteResult.user.claims), error: remoteError }
  }

  return {
    userClaims: asRecord(remoteResult.user.claims),
    error: null,
  }
}

const emitRemoteVerifyMetric = (result: RemoteVerifyResult): void => {
  if (result.status === 'service_unavailable') {
    recordCloudWatchMetric({
      name: 'supabase_remote_verify_unavailable',
      value: 1,
      unit: 'Count',
      namespace: 'RemitScout',
      dimensions: { error_type: 'service_unavailable' },
    })
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
    let usedCachedKeys = !!keys
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
        const { error: emailError } = await resolveEmailConfirmation(
          token,
          mode,
          allowRemote,
          asRecord(user.claims),
        )
        if (emailError) return emailError
        return user
      }

      // H7: If verification failed with cached keys, force-refresh the JWKS
      // cache once and retry. This handles key rotation where stale cached keys
      // would otherwise cause 0-120s of auth failures.
      if (usedCachedKeys) {
        const didInvalidate = invalidateCachedJwks()
        if (didInvalidate) {
          logger.info('jwks_cache_invalidated_for_retry', { mode })
          const freshKeys = await fetchJwks()
          if (freshKeys.length > 0) {
            setCachedJwks(freshKeys, config.auth.supabase.remoteVerifyCacheTtlSeconds)
            const retryUser = await verifyWithJwks(token, freshKeys)
            if (retryUser) {
              const ageError = enforceMaxTokenAge(token)
              if (ageError) return ageError
              const { error: emailError } = await resolveEmailConfirmation(
                token,
                mode,
                allowRemote,
                asRecord(retryUser.claims),
              )
              if (emailError) return emailError
              return retryUser
            }
          }
        } else {
          logger.debug('jwks_cache_invalidation_cooldown_active', { mode })
        }
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
    const remoteResult = await remoteVerify(token)
    if (remoteResult.status === 'service_unavailable') {
      emitRemoteVerifyMetric(remoteResult)
      logger.warn('supabase_remote_verify_service_unavailable', {
        error_type: remoteResult.status,
        error: remoteResult.error,
      })
    }
    if (remoteResult.status === 'success') {
      const ageError = enforceMaxTokenAge(token)
      if (ageError) return ageError
      const emailError = enforceEmailConfirmation(asRecord(remoteResult.user.claims))
      if (emailError) return emailError
      return remoteResult.user
    }
  }

  return makeError('verification_failed', 'JWT verification failed')
}
