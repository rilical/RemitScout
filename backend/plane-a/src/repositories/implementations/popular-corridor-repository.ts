import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IPopularCorridorRepository,
  PopularCorridorRecord,
} from '../interfaces/popular-corridor-repository.interface'

export class PopularCorridorRepository implements IPopularCorridorRepository {
  constructor(private readonly pool: Pool) {}

  async listPopularCorridors(): Promise<PopularCorridorRecord[]> {
    const result = await query<PopularCorridorRecord>(
      `SELECT route,
              count_24h,
              top_provider,
              fee_range,
              speed_range,
              best_for,
              updated_at
         FROM gold.popular_corridors
        ORDER BY count_24h DESC`,
      [],
      this.pool,
    )

    return result.rows
  }
}
