export type RecentSearchRow = {
  id: string
  user_id: string | null
  from_country: string
  to_country: string
  amount: number
  method: string
  best_provider_name: string | null
  best_provider_recipient: number | null
  created_at: Date
}

export type RecentSearchInput = {
  user_id: string
  from_country: string
  to_country: string
  amount: number
  method: string
  best_provider_name?: string | null
  best_provider_recipient?: number | null
}

export interface IRecentSearchRepository {
  create(input: RecentSearchInput): Promise<RecentSearchRow>
  upsertRecent(
    input: RecentSearchInput,
    dedupeMinutes: number,
  ): Promise<RecentSearchRow>
  getByUser(userId: string): Promise<RecentSearchRow[]>
  getByUserAndLimit(userId: string, limit?: number): Promise<RecentSearchRow[]>
  delete(id: string): Promise<void>
  deleteByUser(userId: string): Promise<void>
  trimUserSearches(userId: string, keepCount: number): Promise<void>
  countByUser(userId: string): Promise<number>
}
