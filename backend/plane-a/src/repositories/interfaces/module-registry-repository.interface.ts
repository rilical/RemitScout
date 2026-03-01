export type ModuleRegistryRow = {
  module_id: string
  display_name: string
  provider_id: string
  collector_type: string
  status: 'candidate' | 'sandbox' | 'beta' | 'production' | 'deprecated' | 'quarantined'
  quarantine_reason: string | null
  quarantined_at: Date | null
  last_success_at: Date | null
  last_failure_at: Date | null
  parse_error_rate: number
  consecutive_failures: number
  last_health_check_at: Date | null
  updated_at: Date
}

export type ModuleCorridorDetailRow = {
  corridor_id: string
  last_observation_at: Date | null
  observation_count_24h: number
  error_count_24h: number
  freshness_seconds: number | null
}

export interface IModuleRegistryRepository {
  getAll(): Promise<ModuleRegistryRow[]>
  getById(moduleId: string): Promise<ModuleRegistryRow | null>
  getCorridorDetail(moduleId: string): Promise<ModuleCorridorDetailRow[]>
}
