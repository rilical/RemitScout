import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IWatchlistRepository,
  WatchlistItemInput,
  WatchlistItemRow,
} from '../interfaces/watchlist-repository.interface'

export class WatchlistRepository implements IWatchlistRepository {
  constructor(private readonly pool: Pool) {}

  async listByUserId(userId: string): Promise<WatchlistItemRow[]> {
    const result = await query<WatchlistItemRow>(
      `SELECT id, owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at, deleted_at
       FROM silver.watchlist_item
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [userId],
      this.pool,
    )
    return result.rows
  }

  async findById(id: string, userId: string): Promise<WatchlistItemRow | null> {
    const result = await query<WatchlistItemRow>(
      `SELECT id, owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at, deleted_at
       FROM silver.watchlist_item
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
      this.pool,
    )
    return result.rows[0] || null
  }

  async findByTarget(
    userId: string,
    targetType: string,
    targetPayload: Record<string, unknown>,
  ): Promise<WatchlistItemRow | null> {
    const result = await query<WatchlistItemRow>(
      `SELECT id, owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at, deleted_at
       FROM silver.watchlist_item
       WHERE user_id = $1 
         AND target_type = $2 
         AND target_payload @> $3::jsonb
         AND deleted_at IS NULL
       LIMIT 1`,
      [userId, targetType, JSON.stringify(targetPayload)],
      this.pool,
    )
    return result.rows[0] || null
  }

  async create(input: WatchlistItemInput): Promise<WatchlistItemRow> {
    const now = new Date()
    const result = await query<WatchlistItemRow>(
      `INSERT INTO silver.watchlist_item (owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $7)
       RETURNING id, owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at, deleted_at`,
      [
        input.owner_type,
        input.user_id || null,
        input.guest_id || null,
        input.target_type,
        JSON.stringify(input.target_payload),
        input.label || null,
        now,
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async update(id: string, userId: string, updates: { label?: string | null }): Promise<WatchlistItemRow | null> {
    const result = await query<WatchlistItemRow>(
      `UPDATE silver.watchlist_item
       SET label = COALESCE($1, label), updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, owner_type, user_id, guest_id, target_type, target_payload, label, created_at, updated_at, deleted_at`,
      [updates.label, id, userId],
      this.pool,
    )
    return result.rows[0] || null
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `UPDATE silver.watchlist_item
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, userId],
      this.pool,
    )
    return result.rows.length > 0
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM silver.watchlist_item
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
      this.pool,
    )
    return parseInt(result.rows[0]?.count || '0', 10)
  }
}


