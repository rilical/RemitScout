export type AuthClaims = Record<string, unknown>

export type AuthUser = {
  user_id: string
  email?: string
  role?: string
  claims: AuthClaims
}

export type AuthErrorCode = 'missing_token' | 'invalid_token' | 'expired_token' | 'verification_failed'

export type AuthError = {
  code: AuthErrorCode
  message: string
}
