import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IPopularCorridorRepository,
  PopularCorridorRecord,
} from '../interfaces/popular-corridor-repository.interface'

export class PopularCorridorRepository implements IPopularCorridorRepository {
  constructor(private readonly pool: Pool) {}

  async listPopularCorridors(limit: number = 6): Promise<PopularCorridorRecord[]> {
    // First try to get from gold table (pre-aggregated)
    const goldResult = await query<PopularCorridorRecord>(
      `SELECT route,
              count_24h,
              top_provider,
              fee_range,
              speed_range,
              best_for,
              updated_at
         FROM gold.popular_corridors
        ORDER BY count_24h DESC
        LIMIT $1`,
      [limit],
      this.pool,
    )

    // If we have data from gold table, return it
    if (goldResult.rows.length > 0) {
      return goldResult.rows
    }

    // If gold table is empty, query telemetry directly (real-time from searches)
    const telemetryResult = await query<{
      route: string
      count_24h: number
      top_provider: string | null
    }>(
      `WITH route_searches AS (
        SELECT
          split_part(corridor_id, '-', 1) || ' → ' || split_part(corridor_id, '-', 2) AS route,
          COUNT(*)::int AS count_24h
        FROM silver.telemetry_search_event
        WHERE ts >= NOW() - INTERVAL '24 hours'
        GROUP BY corridor_id
        ORDER BY count_24h DESC
        LIMIT $1
      )
      SELECT 
        route,
        count_24h,
        NULL AS top_provider
      FROM route_searches`,
      [limit],
      this.pool,
    )

    // Transform telemetry results to match PopularCorridorRecord format
    return telemetryResult.rows.map(row => ({
      route: row.route,
      count_24h: row.count_24h,
      top_provider: row.top_provider,
      fee_range: null,
      speed_range: null,
      best_for: null,
      updated_at: null,
    }))
  }
}
