export type TotalCollectionErrorRow = {
  module_id: string
  display_name: string
  total_observations: number
  failure_count: number
  corridor_count: number
  last_observed_at: Date | null
  parse_error_rate: number
  consecutive_failures: number
}

export type MttdMttrRow = {
  module_id: string
  display_name: string
  mttd_minutes: number | null
  mttr_minutes: number | null
  period: string
}

export interface IDataQualityRepository {
  getTotalCollectionError(): Promise<TotalCollectionErrorRow[]>
  getMttdMttr(): Promise<MttdMttrRow[]>
}
