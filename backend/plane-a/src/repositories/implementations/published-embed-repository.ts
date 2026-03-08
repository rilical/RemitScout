import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IPublishedEmbedRepository,
  PublishedEmbedCreateInput,
  PublishedEmbedRow,
} from '../interfaces/published-embed-repository.interface'

export class PublishedEmbedRepository implements IPublishedEmbedRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: PublishedEmbedCreateInput): Promise<PublishedEmbedRow> {
    const result = await query<PublishedEmbedRow>(
      `INSERT INTO silver.published_chart_embed (
         owner_user_id,
         surface_kind,
         chart_key,
         index_key,
         title,
         theme,
         filters_json,
         payload_json
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       RETURNING
         id,
         owner_user_id,
         surface_kind,
         chart_key,
         index_key,
         title,
         theme,
         filters_json,
         payload_json,
         created_at,
         published_at,
         revoked_at`,
      [
        input.owner_user_id,
        input.surface_kind,
        input.chart_key ?? null,
        input.index_key ?? null,
        input.title,
        input.theme,
        JSON.stringify(input.filters_json ?? {}),
        JSON.stringify(input.payload_json),
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async getById(id: string): Promise<PublishedEmbedRow | null> {
    const result = await query<PublishedEmbedRow>(
      `SELECT
         id,
         owner_user_id,
         surface_kind,
         chart_key,
         index_key,
         title,
         theme,
         filters_json,
         payload_json,
         created_at,
         published_at,
         revoked_at
       FROM silver.published_chart_embed
       WHERE id = $1`,
      [id],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async listByOwnerUserId(userId: string, limit = 100, offset = 0): Promise<PublishedEmbedRow[]> {
    const result = await query<PublishedEmbedRow>(
      `SELECT
         id,
         owner_user_id,
         surface_kind,
         chart_key,
         index_key,
         title,
         theme,
         filters_json,
         payload_json,
         created_at,
         published_at,
         revoked_at
       FROM silver.published_chart_embed
       WHERE owner_user_id = $1
       ORDER BY published_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
      this.pool,
    )
    return result.rows
  }

  async countActiveByOwnerUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM silver.published_chart_embed
       WHERE owner_user_id = $1
         AND revoked_at IS NULL`,
      [userId],
      this.pool,
    )
    return Number(result.rows[0]?.count ?? 0)
  }

  async revoke(id: string, ownerUserId: string): Promise<PublishedEmbedRow | null> {
    const result = await query<PublishedEmbedRow>(
      `UPDATE silver.published_chart_embed
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1
         AND owner_user_id = $2
       RETURNING
         id,
         owner_user_id,
         surface_kind,
         chart_key,
         index_key,
         title,
         theme,
         filters_json,
         payload_json,
         created_at,
         published_at,
         revoked_at`,
      [id, ownerUserId],
      this.pool,
    )
    return result.rows[0] ?? null
  }
}
