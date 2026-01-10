import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IProviderVisitRepository,
  ProviderVisitCreateInput,
  ProviderVisitFeedbackInput,
  ProviderVisitRow,
} from '../interfaces/provider-visit-repository.interface'

export class ProviderVisitRepository implements IProviderVisitRepository {
  constructor(private readonly pool: Pool) {}

  async createVisit(input: ProviderVisitCreateInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_provider_visit
         (provider_id, corridor_id, user_id, anon_session_id, session_id, target_url, page_path, utm, gclid, fbclid, msclkid, quoted_rate, quoted_fee, visit_timestamp, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [
        input.provider_id,
        input.corridor_id || null,
        input.user_id || null,
        input.anon_session_id || null,
        input.session_id,
        input.target_url || null,
        input.page_path || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.gclid ?? null,
        input.fbclid ?? null,
        input.msclkid ?? null,
        input.quoted_rate ?? null,
        input.quoted_fee ?? null,
      ],
      this.pool,
    )
  }

  async getVisitById(id: string): Promise<ProviderVisitRow | null> {
    const result = await query<ProviderVisitRow>(
      `SELECT v.id,
              v.provider_id,
              p.display_name AS provider_name,
              v.corridor_id,
              v.user_id,
              v.anon_session_id,
              v.session_id,
              v.visit_timestamp,
              v.target_url,
              v.page_path,
              v.utm,
              v.gclid,
              v.fbclid,
              v.msclkid,
              v.quoted_rate,
              v.quoted_fee,
              v.completed_transfer,
              v.transfer_amount,
              v.transfer_date,
              v.actual_rate,
              v.actual_fee,
              v.rate_difference_pct,
              v.feedback_rating,
              v.feedback_notes,
              v.feedback_timestamp,
              v.returned_at
       FROM silver.telemetry_provider_visit v
       LEFT JOIN silver.provider p ON p.provider_id = v.provider_id
       WHERE v.id = $1`,
      [id],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async listPendingFeedback(
    userId: string,
    limit = 3,
    lookbackDays = 30,
  ): Promise<ProviderVisitRow[]> {
    const result = await query<ProviderVisitRow>(
      `SELECT v.id,
              v.provider_id,
              p.display_name AS provider_name,
              v.corridor_id,
              v.user_id,
              v.anon_session_id,
              v.session_id,
              v.visit_timestamp,
              v.target_url,
              v.page_path,
              v.utm,
              v.gclid,
              v.fbclid,
              v.msclkid,
              v.quoted_rate,
              v.quoted_fee,
              v.completed_transfer,
              v.transfer_amount,
              v.transfer_date,
              v.actual_rate,
              v.actual_fee,
              v.rate_difference_pct,
              v.feedback_rating,
              v.feedback_notes,
              v.feedback_timestamp,
              v.returned_at
       FROM silver.telemetry_provider_visit v
       LEFT JOIN silver.provider p ON p.provider_id = v.provider_id
       WHERE v.user_id = $1
         AND v.completed_transfer IS NULL
         AND v.feedback_timestamp IS NULL
         AND v.returned_at IS NULL
         AND v.visit_timestamp >= NOW() - ($2 || ' days')::interval
       ORDER BY v.visit_timestamp DESC
       LIMIT $3`,
      [userId, String(lookbackDays), limit],
      this.pool,
    )

    return result.rows
  }

  async markReturned(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await query(
      `UPDATE silver.telemetry_provider_visit
       SET returned_at = NOW(),
           updated_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [ids],
      this.pool,
    )
  }

  async recordFeedback(
    id: string,
    userId: string,
    input: ProviderVisitFeedbackInput,
  ): Promise<boolean> {
    const result = await query<{ id: string }>(
      `UPDATE silver.telemetry_provider_visit
       SET completed_transfer = $3,
           transfer_amount = $4,
           transfer_date = $5,
           actual_rate = $6,
           actual_fee = $7,
           rate_difference_pct = $8,
           feedback_rating = $9,
           feedback_notes = $10,
           feedback_timestamp = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [
        id,
        userId,
        input.completed_transfer,
        input.transfer_amount ?? null,
        input.transfer_date ?? null,
        input.actual_rate ?? null,
        input.actual_fee ?? null,
        input.rate_difference_pct ?? null,
        input.feedback_rating ?? null,
        input.feedback_notes ?? null,
      ],
      this.pool,
    )

    return Boolean(result.rowCount)
  }
}
