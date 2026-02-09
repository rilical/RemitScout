import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IUserAccountRepository,
  UserAccountProfile,
  UserAccountProfileUpdateInput,
  UserAccountUpsertInput,
  UserAdminRecord,
  UserPrivacySettings,
  UserPrivacyUpdateInput,
  UserRoleUpdateInput,
} from '../interfaces/user-account-repository.interface'

export class UserAccountRepository implements IUserAccountRepository {
  constructor(private readonly pool: Pool) {}

  async upsertUserAccount(input: UserAccountUpsertInput): Promise<void> {
    await query(
      `
      INSERT INTO silver.user_account (user_id, email, last_seen_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET email = EXCLUDED.email, last_seen_at = NOW()
      `,
      [input.user_id, input.email],
      this.pool,
    )
  }

  async getProfile(userId: string): Promise<UserAccountProfile | null> {
    const result = await query<UserAccountProfile>(
      `
      SELECT name
      FROM silver.user_account
      WHERE user_id = $1
      `,
      [userId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updateProfile(input: UserAccountProfileUpdateInput): Promise<UserAccountProfile | null> {
    const updates: string[] = []
    const values: Array<string | null> = []
    let index = 2

    if (Object.prototype.hasOwnProperty.call(input, 'name')) {
      updates.push(`name = $${index}`)
      values.push(input.name ?? null)
      index += 1
    }

    if (updates.length === 0) {
      return this.getProfile(input.user_id)
    }

    const result = await query<UserAccountProfile>(
      `
      UPDATE silver.user_account
      SET ${updates.join(', ')},
          last_seen_at = NOW()
      WHERE user_id = $1
      RETURNING name
      `,
      [input.user_id, ...values],
      this.pool,
    )

    return result.rows[0] ?? null
  }

  async getPrivacySettings(userId: string): Promise<UserPrivacySettings | null> {
    const result = await query<UserPrivacySettings>(
      `
      SELECT privacy_analytics_enabled AS analytics_enabled,
             FALSE AS marketing_enabled,
             privacy_personalization_enabled AS personalization_enabled,
             privacy_updated_at AS updated_at
      FROM silver.user_account
      WHERE user_id = $1
      `,
      [userId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updatePrivacySettings(input: UserPrivacyUpdateInput): Promise<UserPrivacySettings | null> {
    const result = await query<UserPrivacySettings>(
      `
      UPDATE silver.user_account
      SET privacy_analytics_enabled = $2,
          privacy_personalization_enabled = $3,
          privacy_updated_at = NOW(),
          last_seen_at = NOW()
      WHERE user_id = $1
      RETURNING privacy_analytics_enabled AS analytics_enabled,
                FALSE AS marketing_enabled,
                privacy_personalization_enabled AS personalization_enabled,
                privacy_updated_at AS updated_at
      `,
      [input.user_id, input.analytics_enabled, input.personalization_enabled],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async listAdminUsers(queryText?: string, limit = 50): Promise<UserAdminRecord[]> {
    const params: Array<string | number> = []
    const conditions: string[] = []

    if (queryText) {
      params.push(`%${queryText}%`)
      conditions.push(`(email ILIKE $${params.length} OR user_id::text ILIKE $${params.length})`)
    }

    params.push(limit)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query<UserAdminRecord>(
      `
      SELECT user_id,
             email,
             app_role,
             created_at,
             last_seen_at,
             privacy_analytics_enabled,
             privacy_personalization_enabled
      FROM silver.user_account
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length}
      `,
      params,
      this.pool,
    )
    return result.rows
  }

  async updateUserRole(input: UserRoleUpdateInput): Promise<UserAdminRecord | null> {
    const result = await query<UserAdminRecord>(
      `
      UPDATE silver.user_account
      SET app_role = $2,
          last_seen_at = NOW()
      WHERE user_id = $1
      RETURNING user_id,
                email,
                app_role,
                created_at,
                last_seen_at,
                privacy_analytics_enabled,
                privacy_personalization_enabled
      `,
      [input.user_id, input.app_role],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updateUserRoleByEmail(
    email: string,
    role: UserRoleUpdateInput['app_role'],
  ): Promise<UserAdminRecord | null> {
    const result = await query<UserAdminRecord>(
      `
      UPDATE silver.user_account
      SET app_role = $2,
          last_seen_at = NOW()
      WHERE LOWER(email) = LOWER($1)
      RETURNING user_id,
                email,
                app_role,
                created_at,
                last_seen_at,
                privacy_analytics_enabled,
                privacy_personalization_enabled
      `,
      [email, role],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}
