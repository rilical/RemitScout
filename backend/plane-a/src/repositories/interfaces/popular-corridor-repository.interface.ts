export type PopularCorridorRecord = {
  route: string
  count_24h: number
  top_provider: string | null
  fee_range: string | null
  speed_range: string | null
  best_for: string | null
  updated_at: Date | null
}

export interface IPopularCorridorRepository {
  listPopularCorridors(): Promise<PopularCorridorRecord[]>
}
