import type { Pool } from 'pg'
import { query } from '../../../shared/db'
import type { IPublisherRepository } from './publisher-repository.interface'

export class PublisherRepository implements IPublisherRepository {
  constructor(private readonly pool: Pool) {}

  async getContributorCount(corridorId: string): Promise<number> {
    const result = await query<{ contributor_count: number }>(
      `SELECT COUNT(DISTINCT provider_id)::int AS contributor_count
         FROM silver.provider_corridor_capability pcc
         JOIN silver.rights_matrix rm
           ON rm.provider_id = pcc.provider_id
        WHERE pcc.corridor_id = $1
          AND pcc.is_supported = true
          AND rm.allowed_collect = true
          AND rm.allowed_b2b = true
          AND rm.stoplist_status = 'active'`,
      [corridorId],
      this.pool,
    )
    return result.rows[0]?.contributor_count ?? 0
  }
}
