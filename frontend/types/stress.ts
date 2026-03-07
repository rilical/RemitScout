export type StressLevel = 'normal' | 'elevated' | 'high' | 'critical'

export interface CorridorStressEntry {
  corridor_id: string
  stress_score: number | null
  stress_level: StressLevel
  date: string
  computed_at?: string | null
  confidence: string | null
}

export interface CorridorStressOverviewResponse {
  corridors: CorridorStressEntry[]
  updatedAt: string | null
  summary: StressSummary
}

export interface StressSummary {
  total_corridors: number
  normal: number
  elevated: number
  high: number
  critical: number
}

export interface StressControlState {
  total_modules: number
  adaptive_probing_paused_modules: number
  stress_probing_disabled_modules: number
  pause_active: boolean
  kill_switch_active: boolean
  updatedAt: string | null
  unavailable?: boolean
}
