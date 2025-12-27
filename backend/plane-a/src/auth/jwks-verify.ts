import { importJWK, jwtVerify, JWTPayload } from 'jose'
import { AuthUser } from './types'

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
  for (const key of keys) {
    try {
      if (!key || typeof key !== 'object') {
        continue
      }
      const jwk = key as { alg?: string }
      const cryptoKey = await importJWK(jwk as never, jwk.alg)
      const { payload } = await jwtVerify(token, cryptoKey)
      return toUser(payload)
    } catch (_error) {
      continue
    }
  }
  return null
}
