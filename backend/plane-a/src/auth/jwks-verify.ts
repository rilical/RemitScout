import { importJWK, jwtVerify, decodeProtectedHeader, JWTPayload } from 'jose'
import type { JWTVerifyOptions } from 'jose'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AuthUser } from './types'

const logger = createLogger('plane-a.jwks-verify')

/**
 * Allowlist of JWT signing algorithms accepted during JWKS verification.
 * Supabase uses RS256; restricting to this set prevents algorithm confusion attacks.
 */
const ALLOWED_ALGORITHMS: ReadonlySet<string> = new Set(['RS256'])

const resolveIssuer = (): string => {
  if (config.auth.supabase.jwtIssuer) {
    return config.auth.supabase.jwtIssuer
  }
  if (!config.auth.supabase.url) {
    // Fail-closed: if neither SUPABASE_JWT_ISSUER nor SUPABASE_URL is configured,
    // use a sentinel value that will never match any real issuer. This ensures
    // all tokens are rejected rather than silently skipping issuer validation.
    return '__issuer_not_configured__'
  }
  return `${config.auth.supabase.url.replace(/\/$/, '')}/auth/v1`
}

const splitCsv = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const resolveAudience = (): string | string[] | undefined => {
  const configured = splitCsv(config.auth.supabase.jwtAudience)
  if (configured.length === 1) return configured[0]
  if (configured.length > 1) return configured

  // Fail-closed default: Supabase access tokens typically use aud='authenticated'.
  // When Plane A requires JWT auth, enforce aud even if SUPABASE_JWT_AUDIENCE was omitted.
  if (config.planeA.requireJwt) {
    return 'authenticated'
  }
  return undefined
}

const buildVerifyOptions = (): JWTVerifyOptions => {
  const options: JWTVerifyOptions = {}
  // Always set issuer — resolveIssuer() now never returns undefined (fail-closed)
  options.issuer = resolveIssuer()
  const audience = resolveAudience()
  if (audience) {
    options.audience = audience
  }
  return options
}

const toUser = (payload: JWTPayload): AuthUser | null => {
  const subject = payload.sub
  if (!subject) {
    return null
  }
  return {
    user_id: String(subject),
    email: typeof payload.email === 'string' ? payload.email : undefined,
    role: typeof payload.role === 'string' ? payload.role : undefined,
    claims: payload as Record<string, unknown>,
  }
}

export const verifyWithJwks = async (token: string, keys: unknown[]): Promise<AuthUser | null> => {
  // H5: Reject tokens whose header algorithm is not in the allowlist.
  // This prevents algorithm confusion attacks (e.g., HS256 with public key).
  let headerAlg: string | undefined
  try {
    const header = decodeProtectedHeader(token)
    headerAlg = header.alg
  } catch {
    logger.warn('jwks_verify_header_decode_failed')
    return null
  }

  if (!headerAlg || !ALLOWED_ALGORITHMS.has(headerAlg)) {
    logger.warn('jwks_verify_algorithm_rejected', {
      alg: headerAlg ?? 'missing',
      allowed: [...ALLOWED_ALGORITHMS],
    })
    return null
  }

  const verifyOptions = buildVerifyOptions()
  for (const key of keys) {
    try {
      if (!key || typeof key !== 'object') {
        continue
      }
      const jwk = key as { alg?: string }
      const cryptoKey = await importJWK(jwk as never, jwk.alg)
      const { payload } = await jwtVerify(token, cryptoKey, {
        ...verifyOptions,
        algorithms: [...ALLOWED_ALGORITHMS],
      })
      return toUser(payload)
    } catch (_error) {
      continue
    }
  }
  return null
}
