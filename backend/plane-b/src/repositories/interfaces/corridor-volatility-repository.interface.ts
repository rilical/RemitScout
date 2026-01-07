export type CorridorVolatilityRecord = {
  corridor_id: string
  volatility_score: number
  sample_count: number
  mean_rate: number
  stddev_rate: number
  calculated_at: Date
}

export interface ICorridorVolatilityRepository {
  getVolatilityScore(corridorId: string): Promise<CorridorVolatilityRecord | null>

  getVolatilityScores(corridorIds: string[]): Promise<Map<string, CorridorVolatilityRecord>>

  calculateVolatilityScore(corridorId: string): Promise<CorridorVolatilityRecord | null>

  upsertVolatilityForCorridors(corridorIds: string[]): Promise<number>
}
