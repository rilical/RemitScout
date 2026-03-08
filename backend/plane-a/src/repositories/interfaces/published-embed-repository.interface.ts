export type PublishedEmbedSurfaceKind = 'pulse' | 'indices'

export type PublishedEmbedTheme = 'dark' | 'light'

export type PublishedEmbedCreateInput = {
  owner_user_id: string
  surface_kind: PublishedEmbedSurfaceKind
  chart_key?: string | null
  index_key?: string | null
  title: string
  theme: PublishedEmbedTheme
  filters_json?: Record<string, unknown> | null
  payload_json: Record<string, unknown>
}

export type PublishedEmbedRow = {
  id: string
  owner_user_id: string
  surface_kind: PublishedEmbedSurfaceKind
  chart_key: string | null
  index_key: string | null
  title: string
  theme: PublishedEmbedTheme
  filters_json: Record<string, unknown> | null
  payload_json: Record<string, unknown>
  created_at: Date
  published_at: Date
  revoked_at: Date | null
}

export interface IPublishedEmbedRepository {
  create(input: PublishedEmbedCreateInput): Promise<PublishedEmbedRow>
  getById(id: string): Promise<PublishedEmbedRow | null>
  listByOwnerUserId(userId: string, limit?: number, offset?: number): Promise<PublishedEmbedRow[]>
  countActiveByOwnerUserId(userId: string): Promise<number>
  revoke(id: string, ownerUserId: string): Promise<PublishedEmbedRow | null>
}
