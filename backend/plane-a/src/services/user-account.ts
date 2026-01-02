import { Pool } from 'pg'
import { AuthUser } from '../auth/types'
import { UserAccountRepository } from '../repositories'

export const upsertUserAccount = async (pool: Pool, user: AuthUser) => {
  const email = user.email || null
  const repo = new UserAccountRepository(pool)
  await repo.upsertUserAccount({ user_id: user.user_id, email })
}
