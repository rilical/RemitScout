import { Pool } from 'pg'
import { AuthUser } from '../auth/types'
import { recordBusinessMetric } from '../../../shared/business-metrics'
import { UserAccountRepository } from '../repositories'

export const upsertUserAccount = async (pool: Pool, user: AuthUser) => {
  const email = user.email || null
  const repo = new UserAccountRepository(pool)
  const result = await repo.upsertUserAccount({ user_id: user.user_id, email, app_role: null })
  if (result.created) {
    recordBusinessMetric('user_signups_total', 1)
  }
}
