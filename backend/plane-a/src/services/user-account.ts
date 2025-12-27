import { Pool } from 'pg'
import { AuthUser } from '../auth/types'

export const upsertUserAccount = async (pool: Pool, user: AuthUser) => {
  const email = user.email || null
  await pool.query(
    `
    INSERT INTO silver.user_account (user_id, email, last_seen_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET email = EXCLUDED.email, last_seen_at = NOW()
    `,
    [user.user_id, email]
  )
}
