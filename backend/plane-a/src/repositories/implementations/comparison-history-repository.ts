import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ComparisonHistoryInput,
  ComparisonHistoryRow,
  IComparisonHistoryRepository,
} from '../interfaces/comparison-history-repository.interface'

export class ComparisonHistoryRepository implements IComparisonHistoryRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: ComparisonHistoryInput): Promise<ComparisonHistoryRow> {
    const result = await query<ComparisonHistoryRow>(
      `INSERT INTO silver.comparison_history
        (user_id, from_country, to_country, amount, method, path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, from_country, to_country, amount::double precision AS amount, method, path, created_at`,
      [
        input.user_id,
        input.from_country,
        input.to_country,
        input.amount,
        input.method,
        input.path ?? null,
      ],
      this.pool,
    )
    const row = result.rows[0]
    if (!row) {
      throw new Error('INSERT into comparison_history returned no rows')
    }
    return row
  }

  async listByUserId(
    userId: string,
    limit = 100,
    offset = 0,
  ): Promise<ComparisonHistoryRow[]> {
    const result = await query<ComparisonHistoryRow>(
      `SELECT id, user_id, from_country, to_country, amount::double precision AS amount, method, path, created_at
       FROM silver.comparison_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
      this.pool,
    )
    return result.rows
  }

  async listByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit = 100,
    offset = 0,
  ): Promise<ComparisonHistoryRow[]> {
    const result = await query<ComparisonHistoryRow>(
      `SELECT id, user_id, from_country, to_country, amount::double precision AS amount, method, path, created_at
       FROM silver.comparison_history
       WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC
       LIMIT $4 OFFSET $5`,
      [userId, startDate, endDate, limit, offset],
      this.pool,
    )
    return result.rows
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `DELETE FROM silver.comparison_history
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId],
      this.pool,
    )
    return result.rows.length > 0
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM silver.comparison_history
       WHERE user_id = $1`,
      [userId],
      this.pool,
    )
    return parseInt(result.rows[0]?.count || '0', 10)
  }
}
