import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IUserAccountRepository,
  UserAccountProfile,
  UserAccountProfileUpdateInput,
  UserAccountUpsertInput,
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
      SELECT name, avatar_url
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

    if (Object.prototype.hasOwnProperty.call(input, 'avatar_url')) {
      updates.push(`avatar_url = $${index}`)
      values.push(input.avatar_url ?? null)
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
      RETURNING name, avatar_url
      `,
      [input.user_id, ...values],
      this.pool,
    )

    return result.rows[0] ?? null
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserAccountProfile | null> {
    return this.updateProfile({ user_id: userId, avatar_url: avatarUrl })
  }
}
