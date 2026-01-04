export type PopularCorridorInput = {
  route: string
  count24h: number
  topProvider: string | null
  feeRange: string | null
  speedRange: string | null
  bestFor: string | null
}

export type PopularCorridorAggregationRow = {
  route: string
  count_24h: number | string
  top_provider: string | null
  fee_range: string | null
  speed_range: string | null
  best_for: string | null
}

export interface IPopularCorridorRepository {
  clearAll(): Promise<void>
  insertCorridor(input: PopularCorridorInput): Promise<void>
  aggregatePopularCorridors(maxResults?: number): Promise<PopularCorridorAggregationRow[]>
}
