import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IModuleRegistryRepository,
  ModuleCorridorDetailRow,
  ModuleRegistryRow,
} from '../interfaces/module-registry-repository.interface'

export class ModuleRegistryRepository implements IModuleRegistryRepository {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<ModuleRegistryRow[]> {
    const result = await query<ModuleRegistryRow>(
      `SELECT module_id, display_name, provider_id, collector_type,
              status, quarantine_reason, quarantined_at,
              last_success_at, last_failure_at, parse_error_rate,
              consecutive_failures, last_health_check_at, updated_at
         FROM silver.module_registry
        ORDER BY display_name`,
      [],
      this.pool,
    )
    return result.rows
  }

  async getById(moduleId: string): Promise<ModuleRegistryRow | null> {
    const result = await query<ModuleRegistryRow>(
      `SELECT module_id, display_name, provider_id, collector_type,
              status, quarantine_reason, quarantined_at,
              last_success_at, last_failure_at, parse_error_rate,
              consecutive_failures, last_health_check_at, updated_at
         FROM silver.module_registry
        WHERE module_id = $1`,
      [moduleId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async getCorridorDetail(moduleId: string): Promise<ModuleCorridorDetailRow[]> {
    const result = await query<ModuleCorridorDetailRow>(
      `SELECT corridor_id,
              MAX(observed_at) AS last_observation_at,
              COUNT(*) FILTER (WHERE observed_at > NOW() - INTERVAL '24 hours')::int AS observation_count_24h,
              COUNT(*) FILTER (WHERE type = 'failure' AND observed_at > NOW() - INTERVAL '24 hours')::int AS error_count_24h,
              EXTRACT(EPOCH FROM (NOW() - MAX(observed_at)))::int AS freshness_seconds
         FROM silver.observation
        WHERE module_id = $1 AND corridor_id IS NOT NULL
        GROUP BY corridor_id
        ORDER BY corridor_id
        LIMIT 200`,
      [moduleId],
      this.pool,
    )
    return result.rows
  }
}
