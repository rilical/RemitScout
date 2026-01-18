import { importJWK, jwtVerify, JWTPayload } from 'jose'
import type { JWTVerifyOptions } from 'jose'
import { config } from '../../../shared/config'
import { AuthUser } from './types'

const resolveIssuer = () => {
  if (config.auth.supabase.jwtIssuer) {
    return config.auth.supabase.jwtIssuer
  }
  if (!config.auth.supabase.url) {
    return undefined
  }
  return `${config.auth.supabase.url.replace(/\/$/, '')}/auth/v1`
}

const resolveAudience = () => {
  return config.auth.supabase.jwtAudience || undefined
}

const buildVerifyOptions = (): JWTVerifyOptions => {
  const options: JWTVerifyOptions = {}
  const issuer = resolveIssuer()
  if (issuer) {
    options.issuer = issuer
  }
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
  const verifyOptions = buildVerifyOptions()
  for (const key of keys) {
    try {
      if (!key || typeof key !== 'object') {
        continue
      }
      const jwk = key as { alg?: string }
      const cryptoKey = await importJWK(jwk as never, jwk.alg)
      const { payload } = await jwtVerify(token, cryptoKey, verifyOptions)
      return toUser(payload)
    } catch (_error) {
      continue
    }
  }
  return null
}
