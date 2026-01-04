import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ITelemetryRepository,
  TelemetrySearchInput,
  TelemetryClickInput,
  TelemetrySessionInput,
  TelemetrySessionRow,
  TelemetryAnalyticsRow,
} from '../interfaces/telemetry-repository.interface'

export class TelemetryRepository implements ITelemetryRepository {
  constructor(private readonly pool: Pool) {}

  async recordSearchEvent(input: TelemetrySearchInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_search_event
         (anon_session_id, user_id, corridor_id, amount_bucket, payin, payout, utm, page_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [
        input.session_id,
        input.user_id || null,
        input.corridor_id,
        input.amount_bucket,
        input.payin,
        input.payout,
        input.utm ? JSON.stringify(input.utm) : null,
        input.page_path || null,
      ],
      this.pool,
    )
  }

  async recordOutboundClick(input: TelemetryClickInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_outbound_click
         (anon_session_id, user_id, provider_id, corridor_id, target_url, page_path, utm, is_affiliate)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [
        input.session_id,
        input.user_id || null,
        input.provider_id,
        input.corridor_id || null,
        input.target_url,
        input.page_path || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.is_affiliate ?? null,
      ],
      this.pool,
    )
  }

  async createOrUpdateSession(input: TelemetrySessionInput): Promise<TelemetrySessionRow> {
    const result = await query<TelemetrySessionRow>(
      `INSERT INTO silver.telemetry_session
         (session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer)
       VALUES ($1, $2, $3, NOW(), NOW(), 1, $4, $5)
       ON CONFLICT (session_id) DO UPDATE
         SET last_activity = NOW(),
             user_id = COALESCE(EXCLUDED.user_id, silver.telemetry_session.user_id),
             anon_id = COALESCE(EXCLUDED.anon_id, silver.telemetry_session.anon_id),
             engagement_count = silver.telemetry_session.engagement_count + 1,
             first_page = COALESCE(silver.telemetry_session.first_page, EXCLUDED.first_page),
             referrer = COALESCE(silver.telemetry_session.referrer, EXCLUDED.referrer)
       RETURNING session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer`,
      [
        input.session_id,
        input.user_id || null,
        input.anon_id || null,
        input.first_page || null,
        input.referrer || null,
      ],
      this.pool,
    )

    return result.rows[0]
  }

  async getSessionById(sessionId: string): Promise<TelemetrySessionRow | null> {
    const result = await query<TelemetrySessionRow>(
      `SELECT session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer
       FROM silver.telemetry_session
       WHERE session_id = $1`,
      [sessionId],
      this.pool,
    )
    return result.rows[0] || null
  }

  async recordProviderVisit(input: {
    provider_id: string
    corridor_id?: string | null
    user_id?: string | null
    anon_session_id?: string | null
    session_id: string
    target_url?: string | null
    page_path?: string | null
    utm?: Record<string, unknown> | null
    quoted_rate?: number | null
    quoted_fee?: number | null
  }): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_provider_visit
         (provider_id, corridor_id, user_id, anon_session_id, session_id, target_url, page_path, utm, quoted_rate, quoted_fee, visit_timestamp, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, NOW(), NOW())`,
      [
        input.provider_id,
        input.corridor_id || null,
        input.user_id || null,
        input.anon_session_id || null,
        input.session_id,
        input.target_url || null,
        input.page_path || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.quoted_rate ?? null,
        input.quoted_fee ?? null,
      ],
      this.pool,
    )
  }

  async getAnalyticsAggregate(input: {
    metric_name: string
    since?: Date
  }): Promise<TelemetryAnalyticsRow[]> {
    const params: Array<string | Date> = [input.metric_name]
    const conditions: string[] = ['metric_name = $1']
    if (input.since) {
      params.push(input.since)
      conditions.push(`time_bucket >= $${params.length}`)
    }

    const result = await query<TelemetryAnalyticsRow>(
      `SELECT metric_name, metric_value, time_bucket, dimensions, computed_at
       FROM silver.telemetry_analytics_aggregate
       WHERE ${conditions.join(' AND ')}
       ORDER BY time_bucket DESC`,
      params,
      this.pool,
    )

    return result.rows
  }
}
