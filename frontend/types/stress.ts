export type StressLevel = 'normal' | 'elevated' | 'high' | 'critical'

export interface CorridorStressEntry {
  corridor_id: string
  stress_score: number | null
  stress_level: StressLevel
  date: string
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
