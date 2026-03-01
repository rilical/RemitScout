/**
 * JWT claims from authenticated token.
 *
 * Contains standard JWT claims (sub, exp, iat, etc.) and custom claims
 * from the authentication provider. The structure is flexible to accommodate
 * different providers and custom claim formats.
 */
export type AuthClaims = Record<string, unknown>

/**
 * Authenticated user object attached to FastifyRequest.
 *
 * This type represents a successfully authenticated user. It is attached to
 * the request object by the auth plugin after JWT verification succeeds.
 *
 * @property user_id - Unique user identifier (required, extracted from JWT 'sub' claim)
 * @property email - User email address (optional, present if available in JWT claims)
 * @property role - User role (optional, present if available in JWT claims)
 * @property claims - Raw JWT claims (required, contains all claims from the token)
 *
 * @example
 * ```typescript
 * // In a route handler
 * fastify.get('/api/v1/me', async (request, reply) => {
 *   const user = request.user // Type: AuthUser
 *   return { user_id: user.user_id, email: user.email }
 * })
 * ```
 */
export type AuthUser = {
  /** Unique user identifier (extracted from JWT 'sub' claim) */
  user_id: string
  /** User email address (PII; present if available in JWT claims) */
  email?: string
  /** User role (present if available in JWT claims) */
  role?: string
  /** Raw JWT claims containing all token data */
  claims: AuthClaims
}

/**
 * Authentication error codes.
 *
 * - `missing_token`: Authorization header is missing or invalid
 * - `invalid_token`: Token format is invalid or signature verification failed
 * - `expired_token`: Token has expired (exp claim is in the past)
 * - `token_too_old`: Token is valid but older than MAX_TOKEN_AGE
 * - `verification_failed`: Token verification failed for other reasons
 */
export type AuthErrorCode =
  | 'missing_token'
  | 'invalid_token'
  | 'expired_token'
  | 'token_too_old'
  | 'revoked_token'
  | 'email_not_confirmed'
  | 'verification_failed'

/**
 * Authentication error object.
 *
 * This type represents an authentication failure. It is returned by
 * verification functions when authentication fails.
 *
 * @property code - Error code indicating the type of failure
 * @property message - Human-readable error message
 * @property details - Optional additional error details (expiration time, token type, etc.)
 *
 * @example
 * ```typescript
 * const result = await verifySupabaseJwt(authHeader)
 * if ('code' in result) {
 *   // result is AuthError
 *   return { error: result.code, message: result.message }
 * }
 * ```
 */
export type AuthError = {
  /** Error code indicating the type of failure */
  code: AuthErrorCode
  /** Human-readable error message */
  message: string
  /**
   * Optional additional error details.
   * May include expiration time, token type, or other diagnostic information.
   */
  details?: {
    /** Token expiration time (Unix timestamp in milliseconds) */
    expirationTime?: number
    /** Type of token (e.g., 'JWT', 'Bearer') */
    tokenType?: string
    /** Additional diagnostic information */
    [key: string]: unknown
  }
}

/**
 * Result of authentication verification.
 *
 * This union type represents the possible outcomes of authentication:
 * either a successfully authenticated user or an authentication error.
 *
 * @example
 * ```typescript
 * const result: AuthResult = await verifySupabaseJwt(authHeader)
 * if (isAuthUser(result)) {
 *   // result is AuthUser
 *   return { user_id: result.user_id }
 * } else {
 *   // result is AuthError
 *   return { error: result.code, message: result.message }
 * }
 * ```
 */
export type AuthResult = AuthUser | AuthError

/**
 * Type guard to check if a value is an AuthUser.
 *
 * @param value - Value to check
 * @returns True if value is a valid AuthUser
 */
export const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.user_id === 'string' &&
    (user.email === undefined || typeof user.email === 'string') &&
    (user.role === undefined || typeof user.role === 'string') &&
    user.claims !== null &&
    typeof user.claims === 'object'
  )
}

/**
 * Type guard to check if a value is an AuthError.
 *
 * @param value - Value to check
 * @returns True if value is a valid AuthError
 */
export const isAuthError = (value: unknown): value is AuthError => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const error = value as Record<string, unknown>

  return (
    typeof error.code === 'string' &&
    ['missing_token', 'invalid_token', 'expired_token', 'token_too_old', 'revoked_token', 'email_not_confirmed', 'verification_failed'].includes(
      error.code,
    ) &&
    typeof error.message === 'string'
  )
}

/**
 * Type guard to check if a value is an AuthResult.
 *
 * @param value - Value to check
 * @returns True if value is a valid AuthResult (either AuthUser or AuthError)
 */
export const isAuthResult = (value: unknown): value is AuthResult => {
  return isAuthUser(value) || isAuthError(value)
}
