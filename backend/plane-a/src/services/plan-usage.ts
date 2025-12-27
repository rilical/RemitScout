import { Pool } from 'pg'

export const getUsageForUser = async (pool: Pool, userId: string) => {
  const result = await pool.query<{ scope: string; count: number }>(
    `
    SELECT scope, count
    FROM silver.plan_usage_counter
    WHERE user_id = $1
    `,
    [userId]
  )

  const usage: Record<string, number> = {}
  for (const row of result.rows) {
    usage[row.scope] = row.count
  }
  return usage
}
