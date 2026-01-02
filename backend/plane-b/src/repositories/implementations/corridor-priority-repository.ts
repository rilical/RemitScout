import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  CorridorPriorityRecord,
  ICorridorPriorityRepository,
} from '../interfaces/corridor-priority-repository.interface'

export class CorridorPriorityRepository implements ICorridorPriorityRepository {
  constructor(private readonly pool: Pool) {}

  async getProxyTier(corridorId: string): Promise<CorridorPriorityRecord | null> {
    const result = await query<CorridorPriorityRecord>(
      `SELECT proxy_tier
         FROM silver.corridor_priority
        WHERE corridor_id = $1`,
      [corridorId],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}
