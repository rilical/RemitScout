import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IRecentSearchRepository,
  RecentSearchInput,
  RecentSearchRow,
} from '../interfaces/recent-search-repository.interface'

export class RecentSearchRepository implements IRecentSearchRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: RecentSearchInput): Promise<RecentSearchRow> {
    const result = await query<RecentSearchRow>(
      `INSERT INTO silver.recent_searches (
        user_id,
        from_country,
        to_country,
        amount,
        method,
        best_provider_name,
        best_provider_recipient
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, from_country, to_country, amount, method,
                best_provider_name, best_provider_recipient, created_at`,
      [
        input.user_id,
        input.from_country,
        input.to_country,
        input.amount,
        input.method,
        input.best_provider_name ?? null,
        input.best_provider_recipient ?? null,
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async upsertRecent(input: RecentSearchInput, dedupeMinutes: number): Promise<RecentSearchRow> {
    const result = await query<RecentSearchRow>(
      `WITH existing AS (
        SELECT id
        FROM silver.recent_searches
        WHERE user_id = $1
          AND from_country = $2
          AND to_country = $3
          AND amount = $4
          AND method = $5
          AND created_at >= NOW() - ($8 || ' minutes')::interval
        ORDER BY created_at DESC
        LIMIT 1
      ),
      updated AS (
        UPDATE silver.recent_searches
        SET created_at = NOW(),
            best_provider_name = COALESCE($6, best_provider_name),
            best_provider_recipient = COALESCE($7, best_provider_recipient)
        WHERE id IN (SELECT id FROM existing)
        RETURNING id, user_id, from_country, to_country, amount, method,
                  best_provider_name, best_provider_recipient, created_at
      ),
      inserted AS (
        INSERT INTO silver.recent_searches (
          user_id, from_country, to_country, amount, method, best_provider_name, best_provider_recipient
        )
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE NOT EXISTS (SELECT 1 FROM existing)
        RETURNING id, user_id, from_country, to_country, amount, method,
                  best_provider_name, best_provider_recipient, created_at
      )
      SELECT * FROM updated
      UNION ALL
      SELECT * FROM inserted
      LIMIT 1`,
      [
        input.user_id,
        input.from_country,
        input.to_country,
        input.amount,
        input.method,
        input.best_provider_name ?? null,
        input.best_provider_recipient ?? null,
        dedupeMinutes,
      ],
      this.pool,
    )
    return result.rows[0]
  }

  async getByUser(userId: string): Promise<RecentSearchRow[]> {
    const result = await query<RecentSearchRow>(
      `SELECT id, user_id, from_country, to_country, amount, method,
              best_provider_name, best_provider_recipient, created_at
       FROM silver.recent_searches
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
      this.pool,
    )
    return result.rows
  }

  async getByUserAndLimit(userId: string, limit = 20): Promise<RecentSearchRow[]> {
    const result = await query<RecentSearchRow>(
      `SELECT id, user_id, from_country, to_country, amount, method,
              best_provider_name, best_provider_recipient, created_at
       FROM silver.recent_searches
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
      this.pool,
    )
    return result.rows
  }

  async delete(id: string): Promise<void> {
    await query(
      `DELETE FROM silver.recent_searches WHERE id = $1`,
      [id],
      this.pool,
    )
  }

  async deleteByUser(userId: string): Promise<void> {
    await query(
      `DELETE FROM silver.recent_searches WHERE user_id = $1`,
      [userId],
      this.pool,
    )
  }

  async trimUserSearches(userId: string, keepCount: number): Promise<void> {
    await query(
      `DELETE FROM silver.recent_searches
       WHERE user_id = $1
         AND id IN (
           SELECT id
           FROM silver.recent_searches
           WHERE user_id = $1
           ORDER BY created_at DESC
           OFFSET $2
         )`,
      [userId, keepCount],
      this.pool,
    )
  }

  async countByUser(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM silver.recent_searches
       WHERE user_id = $1`,
      [userId],
      this.pool,
    )
    return Number(result.rows[0]?.count ?? 0)
  }
}
