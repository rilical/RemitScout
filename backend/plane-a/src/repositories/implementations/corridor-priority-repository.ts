import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type { ICorridorPriorityRepository } from '../interfaces/corridor-priority-repository.interface'

export class CorridorPriorityRepository implements ICorridorPriorityRepository {
  constructor(private readonly pool: Pool) {}

  async getPriorityInfo(
    corridorId: string,
  ): Promise<{ priorityTier: string | null; freshnessSloMinutes: number | null }> {
    const result = await query<{
      priority_tier: string | null
      freshness_slo_minutes: number | null
    }>(
      `SELECT priority_tier,
              freshness_slo_minutes
         FROM silver.corridor_priority
        WHERE corridor_id = $1
        LIMIT 1`,
      [corridorId],
      this.pool,
    )
    const row = result.rows[0]
    const freshness = row?.freshness_slo_minutes
    return {
      priorityTier: row?.priority_tier ?? null,
      freshnessSloMinutes: Number.isFinite(freshness) ? Number(freshness) : null,
    }
  }

  async getPriorityTier(corridorId: string): Promise<string | null> {
    const result = await query<{ priority_tier: string | null }>(
      `SELECT priority_tier
         FROM silver.corridor_priority
        WHERE corridor_id = $1
        LIMIT 1`,
      [corridorId],
      this.pool,
    )
    return result.rows[0]?.priority_tier ?? null
  }

  async getFreshnessSloMinutes(corridorId: string): Promise<number | null> {
    const result = await query<{ freshness_slo_minutes: number | null }>(
      `SELECT freshness_slo_minutes
         FROM silver.corridor_priority
        WHERE corridor_id = $1
        LIMIT 1`,
      [corridorId],
      this.pool,
    )
    const minutes = result.rows[0]?.freshness_slo_minutes
    return Number.isFinite(minutes) ? Number(minutes) : null
  }
}
