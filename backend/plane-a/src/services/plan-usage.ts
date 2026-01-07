import { Pool } from 'pg'
import { PlanUsageRepository } from '../repositories'

export const getUsageForUser = async (pool: Pool, userId: string) => {
  const repo = new PlanUsageRepository(pool)
  const rows = await repo.getUsageForUser(userId)

  const usage: Record<string, number> = {}
  for (const row of rows) {
    usage[row.scope] = row.count
  }
  return usage
}

export const upsertUsageSnapshot = async (
  pool: Pool,
  userId: string,
  scope: string,
  count: number,
) => {
  const repo = new PlanUsageRepository(pool)
  await repo.upsertUsageSnapshot(userId, scope, count, new Date())
}
