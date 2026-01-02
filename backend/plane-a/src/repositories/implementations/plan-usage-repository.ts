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
}
