import { Pool } from 'pg'
import { AuthUser } from '../auth/types'
import { query } from '../../../shared/db'
import { recordBusinessMetric } from '../../../shared/business-metrics'
import { UserAccountRepository } from '../repositories'
import { createLogger } from '../../../shared/logger'
import { getErrorMessage } from '../types/errors'
import { getLaunchUserByEmail, normalizeLaunchUserEmail } from '../../../shared/launch-users'

const logger = createLogger('plane-a.user-account')

const ensureLaunchUserProvisioning = async (pool: Pool, user: AuthUser): Promise<void> => {
  const launchUser = getLaunchUserByEmail(user.email)
  if (!launchUser) return

  const email = normalizeLaunchUserEmail(user.email)
  if (!email) return

  const conflictingAccounts = await query<{ user_id: string }>(
    `
    SELECT user_id
    FROM silver.user_account
    WHERE LOWER(email) = LOWER($1)
      AND user_id <> $2
    LIMIT 5
    `,
    [email, user.user_id],
    pool,
  )

  if (conflictingAccounts.rows.length > 0) {
    logger.warn('launch_user_email_rebound_to_new_user_id', {
      email,
      current_user_id: user.user_id,
      conflicting_user_ids: conflictingAccounts.rows.map(row => row.user_id),
    })
  }

  await query(
    `
    INSERT INTO silver.user_account (user_id, email, app_role, last_seen_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET email = EXCLUDED.email,
                  app_role = EXCLUDED.app_role,
                  last_seen_at = NOW()
    `,
    [user.user_id, email, launchUser.appRole],
    pool,
  )

  await query(
    `
    INSERT INTO silver.user_plan (user_id, plan_code, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (user_id)
    DO UPDATE SET plan_code = EXCLUDED.plan_code,
                  status = 'active',
                  updated_at = NOW()
    `,
    [user.user_id, launchUser.planCode],
    pool,
  )
}

export const upsertUserAccount = async (pool: Pool, user: AuthUser) => {
  const email = user.email || null
  const repo = new UserAccountRepository(pool)
  const result = await repo.upsertUserAccount({ user_id: user.user_id, email })
  try {
    await ensureLaunchUserProvisioning(pool, user)
  } catch (error) {
    logger.error('launch_user_provisioning_failed', {
      user_id: user.user_id,
      email: normalizeLaunchUserEmail(user.email),
      error: getErrorMessage(error),
    })
    throw error
  }
  if (result.created) {
    recordBusinessMetric('user_signups_total', 1)
  }
}
