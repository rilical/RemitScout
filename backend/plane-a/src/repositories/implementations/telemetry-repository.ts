import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ITelemetryRepository,
  TelemetrySearchInput,
  TelemetryClickInput,
  TelemetryConversionInput,
  TelemetrySessionInput,
  TelemetrySessionRow,
  TelemetryAnalyticsRow,
} from '../interfaces/telemetry-repository.interface'

export class TelemetryRepository implements ITelemetryRepository {
  constructor(private readonly pool: Pool) {}

  async recordSearchEvent(input: TelemetrySearchInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_search_event
         (anon_session_id, user_id, corridor_id, amount_bucket, payin, payout, utm, page_path, gclid, fbclid, msclkid, ttclid, li_fat_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)`,
      [
        input.session_id,
        input.user_id || null,
        input.corridor_id,
        input.amount_bucket,
        input.payin,
        input.payout,
        input.utm ? JSON.stringify(input.utm) : null,
        input.page_path || null,
        input.gclid ?? null,
        input.fbclid ?? null,
        input.msclkid ?? null,
        input.ttclid ?? null,
        input.li_fat_id ?? null,
      ],
      this.pool,
    )
  }

  async recordOutboundClick(input: TelemetryClickInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_outbound_click
         (anon_session_id, user_id, provider_id, corridor_id, target_url, page_path, utm, is_affiliate, gclid, fbclid, msclkid, ttclid, li_fat_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)`,
      [
        input.session_id,
        input.user_id || null,
        input.provider_id,
        input.corridor_id || null,
        input.target_url,
        input.page_path || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.is_affiliate ?? null,
        input.gclid ?? null,
        input.fbclid ?? null,
        input.msclkid ?? null,
        input.ttclid ?? null,
        input.li_fat_id ?? null,
      ],
      this.pool,
    )
  }

  async recordAffiliateConversion(input: TelemetryConversionInput): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_affiliate_conversion
         (anon_session_id, user_id, provider_id, corridor_id, conversion_value, conversion_currency, offer_id, source, page_path, utm, gclid, fbclid, msclkid, ttclid, li_fat_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15)`,
      [
        input.session_id,
        input.user_id || null,
        input.provider_id,
        input.corridor_id || null,
        input.conversion_value ?? null,
        input.conversion_currency ?? null,
        input.offer_id ?? null,
        input.source ?? null,
        input.page_path || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.gclid ?? null,
        input.fbclid ?? null,
        input.msclkid ?? null,
        input.ttclid ?? null,
        input.li_fat_id ?? null,
      ],
      this.pool,
    )
  }

  async createOrUpdateSession(input: TelemetrySessionInput): Promise<TelemetrySessionRow> {
    const result = await query<TelemetrySessionRow>(
      `INSERT INTO silver.telemetry_session
         (session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer, utm, gclid, fbclid, msclkid, ttclid, li_fat_id)
       VALUES ($1, $2, $3, NOW(), NOW(), 1, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
       ON CONFLICT (session_id) DO UPDATE
         SET last_activity = NOW(),
             user_id = COALESCE(EXCLUDED.user_id, silver.telemetry_session.user_id),
             anon_id = COALESCE(EXCLUDED.anon_id, silver.telemetry_session.anon_id),
             engagement_count = silver.telemetry_session.engagement_count + 1,
             first_page = COALESCE(silver.telemetry_session.first_page, EXCLUDED.first_page),
             referrer = COALESCE(silver.telemetry_session.referrer, EXCLUDED.referrer),
             utm = COALESCE(EXCLUDED.utm, silver.telemetry_session.utm),
             gclid = COALESCE(EXCLUDED.gclid, silver.telemetry_session.gclid),
             fbclid = COALESCE(EXCLUDED.fbclid, silver.telemetry_session.fbclid),
             msclkid = COALESCE(EXCLUDED.msclkid, silver.telemetry_session.msclkid),
             ttclid = COALESCE(EXCLUDED.ttclid, silver.telemetry_session.ttclid),
             li_fat_id = COALESCE(EXCLUDED.li_fat_id, silver.telemetry_session.li_fat_id)
       RETURNING session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer, utm, gclid, fbclid, msclkid, ttclid, li_fat_id`,
      [
        input.session_id,
        input.user_id || null,
        input.anon_id || null,
        input.first_page || null,
        input.referrer || null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.gclid ?? null,
        input.fbclid ?? null,
        input.msclkid ?? null,
        input.ttclid ?? null,
        input.li_fat_id ?? null,
      ],
      this.pool,
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('INSERT/upsert into telemetry_session returned no rows')
    }
    return row
  }

  async getSessionById(sessionId: string): Promise<TelemetrySessionRow | null> {
    const result = await query<TelemetrySessionRow>(
      `SELECT session_id, user_id, anon_id, created_at, last_activity, engagement_count, first_page, referrer, utm, gclid, fbclid, msclkid, ttclid, li_fat_id
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
	    gclid?: string | null
	    fbclid?: string | null
	    msclkid?: string | null
	    ttclid?: string | null
	    li_fat_id?: string | null
	    quoted_rate?: number | null
	    quoted_fee?: number | null
	  }): Promise<void> {
    await query(
      `INSERT INTO silver.telemetry_provider_visit
         (provider_id, corridor_id, user_id, anon_session_id, session_id, target_url, page_path, utm, gclid, fbclid, msclkid, ttclid, li_fat_id, quoted_rate, quoted_fee, visit_timestamp, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
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
        input.ttclid ?? null,
        input.li_fat_id ?? null,
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
