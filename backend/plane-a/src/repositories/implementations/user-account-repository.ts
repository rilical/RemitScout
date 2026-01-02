import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IUserAccountRepository,
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
}
