export type WatchlistItemInput = {
  owner_type: 'user' | 'guest'
  user_id?: string
  guest_id?: string
  target_type: string
  target_payload: Record<string, unknown>
  label?: string | null
}

export type WatchlistItemRow = {
  id: string
  owner_type: string
  user_id: string | null
  guest_id: string | null
  target_type: string
  target_payload: Record<string, unknown>
  label: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface IWatchlistRepository {
  listByUserId(userId: string): Promise<WatchlistItemRow[]>
  findById(id: string, userId: string): Promise<WatchlistItemRow | null>
  findByTarget(
    userId: string,
    targetType: string,
    targetPayload: Record<string, unknown>,
  ): Promise<WatchlistItemRow | null>
  create(input: WatchlistItemInput): Promise<WatchlistItemRow>
  update(id: string, userId: string, updates: { label?: string | null }): Promise<WatchlistItemRow | null>
  softDelete(id: string, userId: string): Promise<boolean>
  countByUserId(userId: string): Promise<number>
}


