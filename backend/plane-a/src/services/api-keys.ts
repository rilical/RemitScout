import { createHash, randomBytes } from 'crypto'
import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { query } from '../../../shared/db'
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
  const hasTier = Array.from(set).some((scope) => scope.startsWith('tier:'))
  if (!hasTier) {
    set.add('tier:2')
  }
  if (!set.has('indices:read')) {
    set.add('indices:read')
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
  const record = await repo.getKeyByHash(hash)
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
