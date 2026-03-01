export type ModuleStatus = 'candidate' | 'sandbox' | 'beta' | 'production' | 'deprecated' | 'quarantined'

export interface ModuleHealthEntry {
  module_id: string
  display_name: string
  provider_id: string
  collector_type: string
  status: ModuleStatus
  quarantine_reason: string | null
  quarantined_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  parse_error_rate: number
  consecutive_failures: number
  last_health_check_at: string | null
  updated_at: string
}

export interface ModuleRegistryResponse {
  modules: ModuleHealthEntry[]
  updatedAt: string | null
}

export interface ModuleDetailResponse {
  module: ModuleHealthEntry
  corridors: ModuleCorridorDetail[]
  updatedAt: string | null
}

export interface ModuleCorridorDetail {
  corridor_id: string
  last_observation_at: string | null
  observation_count_24h: number
  error_count_24h: number
  freshness_seconds: number | null
}
