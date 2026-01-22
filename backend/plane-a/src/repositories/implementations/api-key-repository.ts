import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ApiKeyCreateInput,
  ApiKeyRecord,
  IApiKeyRepository,
} from '../interfaces/api-key-repository.interface'

export class ApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly pool: Pool) {}

  async createKey(input: ApiKeyCreateInput): Promise<ApiKeyRecord> {
    const result = await query<ApiKeyRecord>(
      `
      INSERT INTO silver.api_key (
        user_id,
        key_prefix,
        key_hash,
        name,
        scopes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        key_id,
        user_id,
        key_prefix,
        key_hash,
        name,
        scopes,
        created_at,
        last_used_at,
        revoked_at
      `,
      [
        input.user_id,
        input.key_prefix,
        input.key_hash,
        input.name ?? null,
        input.scopes ?? [],
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async listKeys(userId: string): Promise<ApiKeyRecord[]> {
    const result = await query<ApiKeyRecord>(
      `
      SELECT key_id,
             user_id,
             key_prefix,
             key_hash,
             name,
             scopes,
             created_at,
             last_used_at,
             revoked_at
        FROM silver.api_key
       WHERE user_id = $1
       ORDER BY created_at DESC
      `,
      [userId],
      this.pool,
    )
    return result.rows
  }

  async getKeyByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    const result = await query<ApiKeyRecord>(
      `
      SELECT key_id,
             user_id,
             key_prefix,
             key_hash,
             name,
             scopes,
             created_at,
             last_used_at,
             revoked_at
        FROM silver.api_key
       WHERE key_hash = $1
         AND revoked_at IS NULL
       LIMIT 1
      `,
      [keyHash],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async revokeKey(userId: string, keyId: string): Promise<boolean> {
    const result = await query(
      `
      UPDATE silver.api_key
         SET revoked_at = NOW()
       WHERE key_id = $1
         AND user_id = $2
         AND revoked_at IS NULL
      `,
      [keyId, userId],
      this.pool,
    )
    return (result.rowCount ?? 0) > 0
  }

  async markKeyUsed(keyId: string): Promise<void> {
    await query(
      `
      UPDATE silver.api_key
         SET last_used_at = NOW()
       WHERE key_id = $1
      `,
      [keyId],
      this.pool,
    )
  }

  async countActiveKeys(userId: string): Promise<number> {
    const result = await query<{ count: number }>(
      `
      SELECT COUNT(*)::int AS count
        FROM silver.api_key
       WHERE user_id = $1
         AND revoked_at IS NULL
      `,
      [userId],
      this.pool,
    )
    return result.rows[0]?.count ?? 0
  }
}
