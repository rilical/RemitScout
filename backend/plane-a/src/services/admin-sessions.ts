import { randomUUID } from 'crypto'
import type { Pool, PoolClient } from 'pg'
import { createLogger } from '../../../shared/logger'
import { getRedisClient } from '../../../shared/redis'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { getErrorMessage } from '../types/errors'
import { generateToken, hashToken } from '../utils/token-generator'
import { issuePlaneAAdminAccessToken } from '../auth/admin-jwt'

const logger = createLogger('plane-a.admin-sessions')

const REFRESH_COOKIE_PATH = '/api/v1/sessions'

const refreshTtlSeconds = () => Math.max(60, Number(config.planeA.adminRefreshTokenTtlSeconds) || 30 * 24 * 60 * 60)
const accessTtlSeconds = () => Math.max(60, Number(config.planeA.adminAccessTokenTtlSeconds) || 4 * 60 * 60)
const refreshCookieName = () => config.planeA.adminRefreshCookieName || 'plane_a_admin_refresh'

const isSecureCookie = () => {
  const env = (config.env || '').toLowerCase()
  return env === 'production' || env === 'staging'
}

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date(0)
}

const toUuid = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

const serializeCookie = (name: string, value: string, maxAgeSeconds: number) => {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${REFRESH_COOKIE_PATH}`,
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ]
  if (isSecureCookie()) {
    attrs.push('Secure')
  }
  return attrs.join('; ')
}

const addJsonMetadata = (metadata: Record<string, unknown> | undefined) => {
  if (!metadata) return '{}'
  try {
    return JSON.stringify(metadata)
  }
  catch {
    return '{}'
  }
}

const selectUserProfile = async (executor: Pool | PoolClient, userId: string) => {
  const result = await query<{ email: string | null; app_role: string | null }>(
    `SELECT email, app_role
       FROM silver.user_account
      WHERE user_id = $1`,
    [userId],
    executor as Pool,
  )

  return {
    email: result.rows[0]?.email ?? null,
    appRole: result.rows[0]?.app_role ?? null,
  }
}

export class AdminSessionError extends Error {
  code: string
  statusCode: number

  constructor(code: string, message: string, statusCode = 401) {
    super(message)
    this.code = code
    this.statusCode = statusCode
  }
}

export const getAdminRefreshCookieName = () => refreshCookieName()

export const getCookieValue = (rawCookieHeader: string | undefined, name: string): string | null => {
  if (!rawCookieHeader) return null
  const parts = rawCookieHeader.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const delimiter = trimmed.indexOf('=')
    if (delimiter <= 0) continue
    const cookieName = trimmed.slice(0, delimiter).trim()
    if (cookieName !== name) continue
    const encoded = trimmed.slice(delimiter + 1)
    try {
      return decodeURIComponent(encoded)
    }
    catch {
      return encoded
    }
  }
  return null
}

export const getRefreshCookieHeader = (refreshToken: string) => {
  return serializeCookie(refreshCookieName(), refreshToken, refreshTtlSeconds())
}

export const getClearRefreshCookieHeader = () => {
  return serializeCookie(refreshCookieName(), '', 0)
}

export type IssueAdminSessionInput = {
  pool: Pool
  userId: string
  email?: string | null
  role?: string | null
  appRole?: string | null
  ipHash?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export type IssuedAdminSession = {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  refreshToken: string
  refreshFamilyId: string
  jti: string
  expiresAt: string
}

export const issueAdminSession = async (input: IssueAdminSessionInput): Promise<IssuedAdminSession> => {
  const refreshToken = generateToken(48)
  const refreshHash = hashToken(refreshToken)
  const refreshFamilyId = randomUUID()

  const issuedAccess = await issuePlaneAAdminAccessToken({
    userId: input.userId,
    email: input.email,
    role: input.role,
    appRole: input.appRole,
    refreshFamilyId,
  })

  const expiresAt = new Date(Date.now() + refreshTtlSeconds() * 1000)

  await query(
    `INSERT INTO public.admin_refresh_token (
      user_id,
      token_hash,
      token_family_id,
      expires_at,
      session_jti,
      created_ip_hash,
      user_agent,
      metadata
    ) VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8::jsonb)`,
    [
      input.userId,
      refreshHash,
      refreshFamilyId,
      expiresAt.toISOString(),
      issuedAccess.jti,
      input.ipHash ?? null,
      input.userAgent ?? null,
      addJsonMetadata(input.metadata),
    ],
    input.pool,
  )

  return {
    accessToken: issuedAccess.token,
    expiresIn: issuedAccess.expiresIn,
    tokenType: 'Bearer',
    refreshToken,
    refreshFamilyId,
    jti: issuedAccess.jti,
    expiresAt: issuedAccess.expiresAt,
  }
}

type RefreshTokenRow = {
  id: string
  user_id: string
  token_family_id: string
  expires_at: string | Date
  revoked_at: string | Date | null
  rotated_at: string | Date | null
}

const revokeRefreshFamily = async (
  executor: Pool | PoolClient,
  familyId: string,
  reason: string,
) => {
  await query(
    `UPDATE public.admin_refresh_token
        SET revoked_at = COALESCE(revoked_at, NOW()),
            revoke_reason = COALESCE(revoke_reason, $2)
      WHERE token_family_id = $1::uuid
        AND revoked_at IS NULL`,
    [familyId, reason],
    executor as Pool,
  )
}

export type RefreshAdminSessionInput = {
  pool: Pool
  refreshToken: string
  ipHash?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export const refreshAdminSession = async (
  input: RefreshAdminSessionInput,
): Promise<IssuedAdminSession> => {
  const token = input.refreshToken?.trim()
  if (!token) {
    throw new AdminSessionError('missing_refresh_token', 'Refresh token is required')
  }

  const refreshHash = hashToken(token)
  const client = await input.pool.connect()

  try {
    await client.query('BEGIN')

    const rowResult = await client.query<RefreshTokenRow>(
      `SELECT id, user_id, token_family_id, expires_at, revoked_at, rotated_at
         FROM public.admin_refresh_token
        WHERE token_hash = $1
        LIMIT 1
        FOR UPDATE`,
      [refreshHash],
    )

    const row = rowResult.rows[0]
    if (!row) {
      await client.query('ROLLBACK')
      throw new AdminSessionError('invalid_refresh_token', 'Refresh token is invalid')
    }

    if (row.revoked_at || row.rotated_at) {
      await revokeRefreshFamily(client, row.token_family_id, 'replay_detected')
      await client.query('COMMIT')
      throw new AdminSessionError('refresh_replay_detected', 'Refresh token replay detected')
    }

    const expiresAt = toDate(row.expires_at)
    if (expiresAt.getTime() <= Date.now()) {
      await client.query(
        `UPDATE public.admin_refresh_token
            SET revoked_at = NOW(),
                revoke_reason = COALESCE(revoke_reason, 'expired')
          WHERE id = $1::uuid`,
        [row.id],
      )
      await client.query('COMMIT')
      throw new AdminSessionError('refresh_expired', 'Refresh token expired')
    }

    const profile = await selectUserProfile(client, row.user_id)
    const refreshToken = generateToken(48)
    const newRefreshHash = hashToken(refreshToken)
    const nextExpiresAt = new Date(Date.now() + refreshTtlSeconds() * 1000)

    const issuedAccess = await issuePlaneAAdminAccessToken({
      userId: row.user_id,
      email: profile.email,
      role: profile.appRole,
      appRole: profile.appRole,
      refreshFamilyId: row.token_family_id,
    })

    await client.query(
      `UPDATE public.admin_refresh_token
          SET rotated_at = NOW(),
              revoked_at = NOW(),
              revoke_reason = 'rotated',
              last_used_at = NOW()
        WHERE id = $1::uuid`,
      [row.id],
    )

    await client.query(
      `INSERT INTO public.admin_refresh_token (
        user_id,
        token_hash,
        token_family_id,
        parent_token_id,
        expires_at,
        session_jti,
        created_ip_hash,
        user_agent,
        metadata
      ) VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9::jsonb)`,
      [
        row.user_id,
        newRefreshHash,
        row.token_family_id,
        row.id,
        nextExpiresAt.toISOString(),
        issuedAccess.jti,
        input.ipHash ?? null,
        input.userAgent ?? null,
        addJsonMetadata(input.metadata),
      ],
    )

    await client.query('COMMIT')

    return {
      accessToken: issuedAccess.token,
      expiresIn: issuedAccess.expiresIn,
      tokenType: 'Bearer',
      refreshToken,
      refreshFamilyId: row.token_family_id,
      jti: issuedAccess.jti,
      expiresAt: issuedAccess.expiresAt,
    }
  }
  catch (error) {
    try {
      await client.query('ROLLBACK')
    }
    catch {
      // Ignore rollback failures.
    }

    if (error instanceof AdminSessionError) {
      throw error
    }

    logger.error('refresh_admin_session_failed', {
      error: getErrorMessage(error),
    })
    throw new AdminSessionError('refresh_failed', 'Failed to refresh admin session', 500)
  }
  finally {
    client.release()
  }
}

export const revokeRefreshFamilies = async (
  pool: Pool,
  familyIds: string[],
  reason: string,
) => {
  const uniqueIds = Array.from(new Set(familyIds.map((value) => value.trim()).filter(Boolean)))
  if (!uniqueIds.length) return 0

  const result = await query<{ count: string }>(
    `WITH target AS (
       SELECT DISTINCT UNNEST($1::uuid[]) AS id
     )
     UPDATE public.admin_refresh_token art
        SET revoked_at = COALESCE(art.revoked_at, NOW()),
            revoke_reason = COALESCE(art.revoke_reason, $2)
       FROM target
      WHERE art.token_family_id = target.id
        AND art.revoked_at IS NULL
      RETURNING 1`,
    [uniqueIds, reason],
    pool,
  )

  return result.rowCount || 0
}

export const resolveRefreshFamilyByToken = async (pool: Pool, refreshToken: string) => {
  const token = refreshToken.trim()
  if (!token) return null

  const tokenHash = hashToken(token)
  const result = await query<{ token_family_id: string | null }>(
    `SELECT token_family_id
       FROM public.admin_refresh_token
      WHERE token_hash = $1
      LIMIT 1`,
    [tokenHash],
    pool,
  )

  return toUuid(result.rows[0]?.token_family_id)
}

const getRevokedJtiKey = (jti: string) => `admin:revoked:${jti}`

export const revokeAdminJti = async (jti: string, ttlSeconds: number) => {
  const normalizedJti = jti.trim()
  if (!normalizedJti) return false

  try {
    const redis = await getRedisClient()
    if (!redis) return false

    await redis.set(getRevokedJtiKey(normalizedJti), '1', {
      EX: Math.max(1, Math.floor(ttlSeconds || accessTtlSeconds())),
    })
    return true
  }
  catch (error) {
    logger.warn('admin_jti_revoke_failed', {
      error: getErrorMessage(error),
    })
    return false
  }
}

const shouldFailClosedOnRevocationCheck = (): boolean => {
  return config.planeA.adminRevocationFailClosed
}

export const isAdminJtiRevoked = async (jti: string) => {
  const normalizedJti = jti.trim()
  if (!normalizedJti) return false

  try {
    const redis = await getRedisClient()
    if (!redis) {
      logger.error('admin_jti_revocation_redis_unavailable', {
        fail_closed: shouldFailClosedOnRevocationCheck(),
      })
      return shouldFailClosedOnRevocationCheck()
    }
    const value = await redis.get(getRevokedJtiKey(normalizedJti))
    return Boolean(value)
  }
  catch (error) {
    logger.error('admin_jti_revocation_check_failed', {
      error: getErrorMessage(error),
      fail_closed: shouldFailClosedOnRevocationCheck(),
    })
    return shouldFailClosedOnRevocationCheck()
  }
}

export type RevokeCurrentSessionInput = {
  pool: Pool
  claims?: Record<string, unknown>
  refreshToken?: string | null
}

export const revokeCurrentAdminSession = async (input: RevokeCurrentSessionInput) => {
  const claims = input.claims || {}
  const familyIds: string[] = []

  const claimFamily = toUuid(claims.refresh_family_id)
  if (claimFamily) {
    familyIds.push(claimFamily)
  }

  if (typeof input.refreshToken === 'string' && input.refreshToken.trim()) {
    const familyFromCookie = await resolveRefreshFamilyByToken(input.pool, input.refreshToken)
    if (familyFromCookie) {
      familyIds.push(familyFromCookie)
    }
  }

  if (!familyIds.length && typeof claims.sub === 'string') {
    const fallbackFamilyRows = await query<{ token_family_id: string }>(
      `SELECT DISTINCT token_family_id
         FROM public.admin_refresh_token
        WHERE user_id = $1::uuid
          AND revoked_at IS NULL`,
      [claims.sub],
      input.pool,
    )
    for (const row of fallbackFamilyRows.rows) {
      const id = toUuid(row.token_family_id)
      if (id) familyIds.push(id)
    }
  }

  const revokedRefreshRows = await revokeRefreshFamilies(input.pool, familyIds, 'logout')

  let revokedJti = false
  if (typeof claims.jti === 'string' && claims.jti.trim()) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const exp = typeof claims.exp === 'number' ? claims.exp : nowSeconds + accessTtlSeconds()
    const ttl = Math.max(1, Math.floor(exp - nowSeconds))
    revokedJti = await revokeAdminJti(claims.jti, ttl)
  }

  return {
    revokedRefreshRows,
    revokedJti,
  }
}
