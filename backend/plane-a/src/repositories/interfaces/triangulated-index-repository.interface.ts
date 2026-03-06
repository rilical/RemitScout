export type TriangulatedIndexRow = {
  corridor_id: string
  stress_score: number | null
  stress_level: string
  date: Date
  amount_bucket: number
  method_profile: string
  methodology_version: string | null
  teer: number | null
  rci: number | null
  rvi_bps: number | null
  confidence: string | null
  contributing_signals: unknown[]
}

export type CorridorStressRow = {
  corridor_id: string
  stress_score: number | null
  stress_level: string
  date: Date
  confidence: string | null
}

export interface ITriangulatedIndexRepository {
  getSeries(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
    startDate: Date
    endDate: Date
    methodology?: string
  }): Promise<TriangulatedIndexRow[]>

  getStressOverview(): Promise<CorridorStressRow[]>
}
