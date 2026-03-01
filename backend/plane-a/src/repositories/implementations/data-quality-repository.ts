import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IDataQualityRepository,
  MttdMttrRow,
  TotalCollectionErrorRow,
} from '../interfaces/data-quality-repository.interface'

export class DataQualityRepository implements IDataQualityRepository {
  constructor(private readonly pool: Pool) {}

  async getTotalCollectionError(): Promise<TotalCollectionErrorRow[]> {
    const result = await query<TotalCollectionErrorRow>(
      `SELECT mr.module_id,
              mr.display_name,
              COALESCE(stats.total_observations, 0) AS total_observations,
              COALESCE(stats.failure_count, 0) AS failure_count,
              COALESCE(stats.corridor_count, 0) AS corridor_count,
              COALESCE(stats.last_observed_at, mr.last_success_at) AS last_observed_at,
              mr.parse_error_rate,
              mr.consecutive_failures
         FROM silver.module_registry mr
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS total_observations,
                  COUNT(*) FILTER (WHERE type = 'failure')::int AS failure_count,
                  COUNT(DISTINCT corridor_id)::int AS corridor_count,
                  MAX(observed_at) AS last_observed_at
             FROM silver.observation o
            WHERE o.module_id = mr.module_id
              AND o.observed_at > NOW() - INTERVAL '24 hours'
         ) stats ON TRUE
        ORDER BY mr.display_name`,
      [],
      this.pool,
    )
    return result.rows
  }

  async getMttdMttr(): Promise<MttdMttrRow[]> {
    const result = await query<MttdMttrRow>(
      `SELECT mr.module_id,
              mr.display_name,
              AVG(EXTRACT(EPOCH FROM (fb.created_at - fb.first_failure_at)) / 60)
                FILTER (WHERE fb.first_failure_at IS NOT NULL) AS mttd_minutes,
              AVG(EXTRACT(EPOCH FROM (fb.updated_at - fb.created_at)) / 60)
                FILTER (WHERE fb.repair_outcome IN ('applied', 'rejected', 'failed')) AS mttr_minutes,
              '7d' AS period
         FROM silver.module_registry mr
         LEFT JOIN silver.failure_bundle fb ON fb.module_id = mr.module_id
              AND fb.created_at > NOW() - INTERVAL '7 days'
        GROUP BY mr.module_id, mr.display_name
        ORDER BY mr.display_name`,
      [],
      this.pool,
    )
    return result.rows
  }
}
