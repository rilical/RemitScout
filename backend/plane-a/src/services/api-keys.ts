import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
import { getRedisClient } from '../../../shared/redis'
import { ApiKeyRepository } from '../repositories'

export type ApiKeyContext = {
  key_id: string
  user_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
}

export type ApiKeyCreateResult = {
  key_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  created_at: Date
  token: string
}

export type ApiKeyRotateResult = {
  key_id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  created_at: Date
  token: string
}

const logger = createLogger('plane-a.api-keys')
const API_KEY_ROTATION_GRACE_SECONDS = Math.max(
  0,
  config.planeA.apiKeyRotationGraceSeconds,
)

const toBase64Url = (buffer: Buffer) => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const normalizeScopes = (scopes?: string[]) => {
  const list = Array.isArray(scopes) ? scopes : []
  return Array.from(
    new Set(
      list
        .map((scope) => scope.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

const ensureDefaultScopes = (scopes: string[]) => {
  const set = new Set(scopes)
  if (!set.has('indices:read')) {
    set.add('indices:read')
  }
  if (!set.has('corridors:read')) {
    set.add('corridors:read')
  }
  return Array.from(set)
}

export const generateApiKeyToken = (bytes = 32): string => {
  return toBase64Url(randomBytes(bytes))
}

export const hashApiKey = (token: string): string => {
  return createHash('sha256').update(token).digest('hex')
}

export const createApiKey = async (
  pool: Pool,
  userId: string,
  input: { name?: string | null; scopes?: string[] } = {},
): Promise<ApiKeyCreateResult> => {
  const repo = new ApiKeyRepository(pool)
  const token = generateApiKeyToken()
  const keyHash = hashApiKey(token)
  const keyPrefix = token.slice(0, 8)
  const scopes = ensureDefaultScopes(normalizeScopes(input.scopes))

  const record = await repo.createKey({
    user_id: userId,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    name: input.name ?? null,
    scopes,
  })

  return {
    key_id: record.key_id,
    key_prefix: record.key_prefix,
    name: record.name,
    scopes: record.scopes ?? [],
    created_at: record.created_at,
    token,
  }
}

export const listApiKeys = async (
  pool: Pool,
  userId: string,
): Promise<Array<ApiKeyContext & { created_at: Date; last_used_at: Date | null; revoked_at: Date | null }>> => {
  const repo = new ApiKeyRepository(pool)
  const records = await repo.listKeys(userId)
  return records.map((record) => ({
    key_id: record.key_id,
    user_id: record.user_id,
    key_prefix: record.key_prefix,
    name: record.name,
    scopes: record.scopes ?? [],
    created_at: record.created_at,
    last_used_at: record.last_used_at,
    revoked_at: record.revoked_at,
  }))
}

export const revokeApiKey = async (pool: Pool, userId: string, keyId: string): Promise<boolean> => {
  const repo = new ApiKeyRepository(pool)
  return repo.revokeKey(userId, keyId)
}

export const rotateApiKey = async (
  pool: Pool,
  userId: string,
  keyId: string,
): Promise<ApiKeyRotateResult | null> => {
  const repo = new ApiKeyRepository(pool)
  const existing = await repo.getActiveKeyById(userId, keyId)
  if (!existing) {
    return null
  }

  const token = generateApiKeyToken()
  const keyHash = hashApiKey(token)
  const keyPrefix = token.slice(0, 8)

  const result = await query<{
    key_id: string
    key_prefix: string
    name: string | null
    scopes: string[]
    created_at: Date
  }>(
    `
    UPDATE silver.api_key
       SET key_prefix = $1,
           key_hash = $2
     WHERE key_id = $3
       AND user_id = $4
       AND revoked_at IS NULL
    RETURNING key_id, key_prefix, name, scopes, created_at
    `,
    [keyPrefix, keyHash, keyId, userId],
    pool,
  )

  const record = result.rows[0]
  if (!record) {
    return null
  }

  if (API_KEY_ROTATION_GRACE_SECONDS > 0) {
    const redis = await getRedisClient()
    if (redis) {
      try {
        const gracePayload = JSON.stringify({
          key_id: existing.key_id,
          user_id: existing.user_id,
          key_prefix: existing.key_prefix,
          key_hash: existing.key_hash,
          name: existing.name,
          scopes: existing.scopes ?? [],
        })
        await redis.set(
          `plane-a:api-key-grace:${existing.key_prefix}`,
          gracePayload,
          { EX: API_KEY_ROTATION_GRACE_SECONDS },
        )
      } catch (error) {
        logger.warn('api_key_rotation_grace_write_failed', {
          key_id: existing.key_id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  return {
    key_id: record.key_id,
    key_prefix: record.key_prefix,
    name: record.name,
    scopes: record.scopes ?? [],
    created_at: record.created_at,
    token,
  }
}

export const countActiveApiKeys = async (pool: Pool, userId: string): Promise<number> => {
  const repo = new ApiKeyRepository(pool)
  return repo.countActiveKeys(userId)
}

export const validateApiKey = async (pool: Pool, token: string): Promise<ApiKeyContext | null> => {
  const repo = new ApiKeyRepository(pool)
  const hash = hashApiKey(token)
  const prefix = token.slice(0, 8)
  const candidates = await repo.listActiveKeysByPrefix(prefix)
  let record = candidates.find((candidate) => {
    try {
      const left = Buffer.from(candidate.key_hash, 'utf8')
      const right = Buffer.from(hash, 'utf8')
      if (left.length !== right.length) return false
      return timingSafeEqual(left, right)
    } catch (error) {
      logger.debug('api_key_hash_compare_failed', {
        key_id: candidate.key_id,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }) ?? null

  // Rotation grace period: old prefix+hash can remain valid briefly to avoid deploy race conditions.
  if (!record && API_KEY_ROTATION_GRACE_SECONDS > 0) {
    const redis = await getRedisClient()
    if (redis) {
      try {
        const raw = await redis.get(`plane-a:api-key-grace:${prefix}`)
        if (raw) {
          const parsed = JSON.parse(raw) as {
            key_id: string
            user_id: string
            key_prefix: string
            key_hash: string
            name: string | null
            scopes: string[]
          }
          const left = Buffer.from(parsed.key_hash, 'utf8')
          const right = Buffer.from(hash, 'utf8')
          if (left.length === right.length && timingSafeEqual(left, right)) {
            record = {
              key_id: parsed.key_id,
              user_id: parsed.user_id,
              key_prefix: parsed.key_prefix,
              key_hash: parsed.key_hash,
              name: parsed.name,
              scopes: parsed.scopes ?? [],
              created_at: new Date(0),
              last_used_at: null,
              revoked_at: null,
            }
          }
        }
      } catch (error) {
        logger.warn('api_key_rotation_grace_read_failed', {
          key_prefix: prefix,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  if (!record) return null

  try {
    await repo.markKeyUsed(record.key_id)
  } catch (error) {
    logger.warn('api_key_mark_used_failed', {
      key_id: record.key_id,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return {
    key_id: record.key_id,
    user_id: record.user_id,
    key_prefix: record.key_prefix,
    name: record.name,
    scopes: record.scopes ?? [],
  }
}
