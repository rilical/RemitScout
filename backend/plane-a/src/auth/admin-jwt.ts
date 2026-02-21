import { randomUUID } from 'crypto'
import { jwtVerify, SignJWT } from 'jose'
import { config } from '../../../shared/config'
import type { AuthError, AuthResult, AuthUser } from './types'

const ADMIN_JWT_AUDIENCE = 'plane-a-admin'
const ADMIN_TOKEN_TYPE = 'plane_a_admin_access'

const parseBearerToken = (header?: string) => {
  if (!header) return null
  const trimmed = header.trim()
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null
  const token = trimmed.slice('bearer '.length).trim()
  return token || null
}

const makeError = (code: AuthError['code'], message: string): AuthError => ({ code, message })

const getSecret = () => {
  const secret = config.planeA.jwtSecret
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

export type IssueAdminAccessTokenInput = {
  userId: string
  email?: string | null
  role?: string | null
  appRole?: string | null
  refreshFamilyId: string
  jti?: string
}

export type IssuedAdminAccessToken = {
  token: string
  jti: string
  expiresIn: number
  expiresAt: string
}

const toSafeRole = (role?: string | null, appRole?: string | null) => {
  if (appRole === 'super_admin' || role === 'super_admin') return 'super_admin'
  return 'admin'
}

export const issuePlaneAAdminAccessToken = async (
  input: IssueAdminAccessTokenInput,
): Promise<IssuedAdminAccessToken> => {
  const secret = getSecret()
  if (!secret) {
    throw new Error('PLANE_A_JWT_SECRET is required for admin access token issuance')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresIn = Math.max(60, Number(config.planeA.adminAccessTokenTtlSeconds) || 4 * 60 * 60)
  const expiresAt = new Date((nowSeconds + expiresIn) * 1000).toISOString()
  const jti = input.jti || randomUUID()

  const token = await new SignJWT({
    email: input.email ?? undefined,
    role: toSafeRole(input.role, input.appRole),
    app_role: input.appRole ?? undefined,
    token_type: ADMIN_TOKEN_TYPE,
    refresh_family_id: input.refreshFamilyId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(nowSeconds)
    .setIssuer(config.planeA.adminTokenIssuer)
    .setAudience(ADMIN_JWT_AUDIENCE)
    .setSubject(input.userId)
    .setJti(jti)
    .setExpirationTime(nowSeconds + expiresIn)
    .sign(secret)

  return {
    token,
    jti,
    expiresIn,
    expiresAt,
  }
}

const toAuthUser = (payload: Record<string, unknown>): AuthUser | null => {
  const subject = payload.sub
  if (typeof subject !== 'string' || !subject.trim()) return null
  const role = typeof payload.role === 'string' ? payload.role : undefined
  const email = typeof payload.email === 'string' ? payload.email : undefined

  return {
    user_id: subject,
    email,
    role,
    claims: {
      ...payload,
      auth_source: 'plane_a_admin',
    },
  }
}

export const verifyPlaneAAdminJwt = async (authorizationHeader?: string): Promise<AuthResult> => {
  const token = parseBearerToken(authorizationHeader)
  if (!token) {
    return makeError('missing_token', 'Missing or invalid Authorization header')
  }

  const secret = getSecret()
  if (!secret) {
    return makeError('verification_failed', 'Admin JWT secret is not configured')
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: config.planeA.adminTokenIssuer,
      audience: ADMIN_JWT_AUDIENCE,
    })

    const normalizedPayload = payload as Record<string, unknown>
    if (normalizedPayload.token_type !== ADMIN_TOKEN_TYPE) {
      return makeError('invalid_token', 'Invalid admin token type')
    }

    const user = toAuthUser(normalizedPayload)
    if (!user) {
      return makeError('invalid_token', 'Invalid admin token payload')
    }

    return user
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('exp') || message.toLowerCase().includes('expired')) {
      return makeError('expired_token', 'Token has expired')
    }
    return makeError('invalid_token', 'JWT verification failed')
  }
}

export const isPlaneAAdminAccessClaims = (claims: Record<string, unknown> | undefined) => {
  return claims?.token_type === ADMIN_TOKEN_TYPE
}
