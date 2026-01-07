import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IPlanUsageRepository,
  PlanUsageRecord,
} from '../interfaces/plan-usage-repository.interface'

export class PlanUsageRepository implements IPlanUsageRepository {
  constructor(private readonly pool: Pool) {}

  async getUsageForUser(userId: string): Promise<PlanUsageRecord[]> {
    const result = await query<PlanUsageRecord>(
      `
      SELECT scope, count
      FROM silver.plan_usage_counter
      WHERE user_id = $1
      `,
      [userId],
      this.pool,
    )

    return result.rows
  }

  async upsertUsageSnapshot(userId: string, scope: string, count: number, windowStart: Date): Promise<void> {
    await query(
      `
      INSERT INTO silver.plan_usage_counter (user_id, scope, window_start, count)
      VALUES ($1, $2, $3::date, $4)
      ON CONFLICT (user_id, scope, window_start)
      DO UPDATE SET count = EXCLUDED.count
      `,
      [userId, scope, windowStart.toISOString().slice(0, 10), count],
      this.pool,
    )
  }
}
