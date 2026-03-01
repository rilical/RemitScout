export interface TotalCollectionErrorRow {
  module_id: string
  display_name: string
  total_observations: number
  failure_count: number
  corridor_count: number
  last_observed_at: string | null
  parse_error_rate: number
  consecutive_failures: number
}

export interface TotalCollectionErrorResponse {
  rows: TotalCollectionErrorRow[]
  updatedAt: string | null
}

export interface MttdMttrEntry {
  module_id: string
  display_name: string
  mttd_minutes: number | null
  mttr_minutes: number | null
  period: string
}

export interface MttdMttrResponse {
  entries: MttdMttrEntry[]
  updatedAt: string | null
}

export interface CorrectionLedgerEntry {
  correction_id: string
  corridor_id: string
  field_name: string
  date: string
  old_value: number | null
  new_value: number | null
  reason: string
  corrected_by: string
  methodology_version: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface CorrectionLedgerResponse {
  corrections: CorrectionLedgerEntry[]
  total: number
  limit: number
  offset: number
}
