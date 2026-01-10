import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type { ICorridorPriorityRepository } from '../interfaces/corridor-priority-repository.interface'

export class CorridorPriorityRepository implements ICorridorPriorityRepository {
  constructor(private readonly pool: Pool) {}

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
