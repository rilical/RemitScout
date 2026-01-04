import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import { COUNTRIES } from '../../../../shared/countries-currencies'
import type {
  CorridorTrend,
  EngagementMetric,
  FavoriteProvider,
  HeatmapData,
  IAnalyticsRepository,
  PopularCorridor,
  ProviderCTR,
  RevenueMetric,
  SavingsMetric,
  SessionMetric,
  UserBehaviorPattern,
} from '../interfaces/analytics-repository.interface'

const countryNameMap = new Map(COUNTRIES.map((country) => [country.code, country.name]))

const buildTrend = (current: number, previous: number) => {
  if (previous === 0 && current === 0) {
    return { trend: 'stable' as const, trend_percentage: 0 }
  }
  if (previous === 0) {
    return { trend: 'up' as const, trend_percentage: 100 }
  }
  const delta = ((current - previous) / previous) * 100
  const trend = Math.abs(delta) < 5 ? 'stable' : delta > 0 ? 'up' : 'down'
  return { trend, trend_percentage: Number(delta.toFixed(1)) }
}

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly pool: Pool) {}

  async getPopularCorridors(params: {
    startDate: Date
    endDate: Date
    limit?: number
  }): Promise<PopularCorridor[]> {
    const limit = params.limit ?? 20
    const durationMs = params.endDate.getTime() - params.startDate.getTime()
    const prevStart = new Date(params.startDate.getTime() - durationMs)
    const prevEnd = params.startDate

    const current = await query<{
      corridor_id: string
      from_country: string
      to_country: string
      search_count: number
      click_count: number
      unique_users: number
    }>(
      `WITH search_counts AS (
        SELECT corridor_id,
               COUNT(*)::int AS search_count,
               COUNT(DISTINCT COALESCE(user_id::text, anon_session_id))::int AS unique_users
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY corridor_id
      ),
      click_counts AS (
        SELECT corridor_id,
               COUNT(*)::int AS click_count
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
          AND corridor_id IS NOT NULL
        GROUP BY corridor_id
      )
      SELECT sc.corridor_id,
             split_part(sc.corridor_id, '-', 1) AS from_country,
             split_part(sc.corridor_id, '-', 2) AS to_country,
             sc.search_count,
             COALESCE(cc.click_count, 0) AS click_count,
             sc.unique_users
      FROM search_counts sc
      LEFT JOIN click_counts cc ON cc.corridor_id = sc.corridor_id
      ORDER BY sc.search_count DESC
      LIMIT $3`,
      [params.startDate, params.endDate, limit],
      this.pool,
    )

    const previous = await query<{ corridor_id: string; search_count: number }>(
      `SELECT corridor_id, COUNT(*)::int AS search_count
       FROM silver.telemetry_search_event
       WHERE ts >= $1 AND ts <= $2
       GROUP BY corridor_id`,
      [prevStart, prevEnd],
      this.pool,
    )

    const prevMap = new Map(previous.rows.map((row) => [row.corridor_id, row.search_count]))

    return current.rows.map((row) => {
      const prev = prevMap.get(row.corridor_id) ?? 0
      const { trend, trend_percentage } = buildTrend(row.search_count, prev)
      return {
        corridor_id: row.corridor_id,
        from_country: row.from_country,
        to_country: row.to_country,
        search_count: row.search_count,
        click_count: row.click_count,
        unique_users: row.unique_users,
        trend,
        trend_percentage,
      }
    })
  }

  async getCorridorTrends(params: {
    corridorId?: string
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<CorridorTrend[]> {
    const corridorId = params.corridorId ?? null
    const result = await query<{
      time_bucket: Date
      corridor_id: string
      search_count: number
      click_count: number
    }>(
      `WITH search_counts AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               corridor_id,
               COUNT(*)::int AS search_count
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
          AND ($4::text IS NULL OR corridor_id = $4)
        GROUP BY 1, 2
      ),
      click_counts AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               corridor_id,
               COUNT(*)::int AS click_count
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
          AND corridor_id IS NOT NULL
          AND ($4::text IS NULL OR corridor_id = $4)
        GROUP BY 1, 2
      )
      SELECT COALESCE(s.time_bucket, c.time_bucket) AS time_bucket,
             COALESCE(s.corridor_id, c.corridor_id) AS corridor_id,
             COALESCE(s.search_count, 0) AS search_count,
             COALESCE(c.click_count, 0) AS click_count
      FROM search_counts s
      FULL JOIN click_counts c
        ON s.time_bucket = c.time_bucket AND s.corridor_id = c.corridor_id
      ORDER BY time_bucket ASC, corridor_id ASC`,
      [params.startDate, params.endDate, params.bucket, corridorId],
      this.pool,
    )

    return result.rows
  }

  async getFavoriteProviders(params: {
    startDate: Date
    endDate: Date
    limit?: number
  }): Promise<FavoriteProvider[]> {
    const limit = params.limit ?? 20
    const result = await query<{
      provider_id: string
      provider_name: string | null
      click_count: number
      search_count: number
      click_through_rate: number
      unique_users: number
    }>(
      `WITH search_total AS (
        SELECT COUNT(*)::int AS search_count
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
      ),
      clicks AS (
        SELECT provider_id,
               COUNT(*)::int AS click_count,
               COUNT(DISTINCT COALESCE(user_id::text, anon_session_id))::int AS unique_users
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
        GROUP BY provider_id
      )
      SELECT c.provider_id,
             p.display_name AS provider_name,
             c.click_count,
             st.search_count,
             CASE
               WHEN st.search_count > 0
               THEN ROUND(c.click_count::numeric / st.search_count * 100, 2)
               ELSE 0
             END AS click_through_rate,
             c.unique_users
      FROM clicks c
      CROSS JOIN search_total st
      LEFT JOIN silver.provider p ON p.provider_id = c.provider_id
      ORDER BY c.click_count DESC
      LIMIT $3`,
      [params.startDate, params.endDate, limit],
      this.pool,
    )

    return result.rows
  }

  async getProviderClickThroughRates(params: {
    providerId?: string
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<ProviderCTR[]> {
    const providerId = params.providerId ?? null
    const result = await query<{
      provider_id: string
      provider_name: string | null
      clicks: number
      searches: number
      ctr: number
      time_bucket: Date
    }>(
      `WITH clicks AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               provider_id,
               COUNT(*)::int AS clicks
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
          AND ($4::text IS NULL OR provider_id = $4)
        GROUP BY 1, 2
      ),
      searches AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               COUNT(*)::int AS searches
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY 1
      )
      SELECT c.provider_id,
             p.display_name AS provider_name,
             c.clicks,
             COALESCE(s.searches, 0) AS searches,
             CASE
               WHEN COALESCE(s.searches, 0) > 0
               THEN ROUND(c.clicks::numeric / s.searches * 100, 2)
               ELSE 0
             END AS ctr,
             c.time_bucket
      FROM clicks c
      LEFT JOIN searches s ON s.time_bucket = c.time_bucket
      LEFT JOIN silver.provider p ON p.provider_id = c.provider_id
      ORDER BY c.time_bucket ASC, c.provider_id ASC`,
      [params.startDate, params.endDate, params.bucket, providerId],
      this.pool,
    )

    return result.rows
  }

  async getEngagementMetrics(params: {
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<EngagementMetric[]> {
    const result = await query<{
      time_bucket: Date
      avg_session_duration: number
      avg_searches_per_session: number
      avg_clicks_per_session: number
      active_users: number
      returning_users: number
    }>(
      `WITH sessions AS (
        SELECT date_trunc($3, last_activity) AS time_bucket,
               session_id,
               user_id,
               anon_id,
               created_at,
               last_activity,
               engagement_count
        FROM silver.telemetry_session
        WHERE last_activity >= $1 AND last_activity <= $2
      ),
      searches AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               anon_session_id,
               COUNT(*)::int AS search_count
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY 1, 2
      ),
      clicks AS (
        SELECT date_trunc($3, ts) AS time_bucket,
               anon_session_id,
               COUNT(*)::int AS click_count
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
        GROUP BY 1, 2
      ),
      user_bucket AS (
        SELECT date_trunc($3, last_activity) AS time_bucket,
               user_id,
               COUNT(*)::int AS session_count
        FROM silver.telemetry_session
        WHERE last_activity >= $1 AND last_activity <= $2
          AND user_id IS NOT NULL
        GROUP BY 1, 2
      ),
      returning AS (
        SELECT time_bucket,
               COUNT(*) FILTER (WHERE session_count > 1)::int AS returning_users
        FROM user_bucket
        GROUP BY time_bucket
      )
      SELECT s.time_bucket,
             COALESCE(AVG(EXTRACT(EPOCH FROM (s.last_activity - s.created_at))), 0)::float AS avg_session_duration,
             COALESCE(AVG(COALESCE(se.search_count, 0)), 0)::float AS avg_searches_per_session,
             COALESCE(AVG(COALESCE(cl.click_count, 0)), 0)::float AS avg_clicks_per_session,
             COUNT(DISTINCT COALESCE(s.user_id::text, s.anon_id))::int AS active_users,
             COALESCE(r.returning_users, 0)::int AS returning_users
      FROM sessions s
      LEFT JOIN searches se ON se.time_bucket = s.time_bucket AND se.anon_session_id = s.anon_id
      LEFT JOIN clicks cl ON cl.time_bucket = s.time_bucket AND cl.anon_session_id = s.anon_id
      LEFT JOIN returning r ON r.time_bucket = s.time_bucket
      GROUP BY s.time_bucket, r.returning_users
      ORDER BY s.time_bucket ASC`,
      [params.startDate, params.endDate, params.bucket],
      this.pool,
    )

    return result.rows
  }

  async getSessionMetrics(params: {
    startDate: Date
    endDate: Date
  }): Promise<SessionMetric> {
    const result = await query<SessionMetric>(
      `WITH sessions AS (
        SELECT session_id,
               user_id,
               anon_id,
               created_at,
               last_activity,
               engagement_count
        FROM silver.telemetry_session
        WHERE last_activity >= $1 AND last_activity <= $2
      ),
      searches AS (
        SELECT anon_session_id,
               COUNT(*)::int AS search_count
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY anon_session_id
      )
      SELECT COUNT(*)::int AS total_sessions,
             COUNT(DISTINCT COALESCE(user_id::text, anon_id))::int AS unique_users,
             COALESCE(AVG(EXTRACT(EPOCH FROM (last_activity - created_at))), 0)::float AS avg_session_duration,
             COALESCE(AVG(COALESCE(searches.search_count, 0)), 0)::float AS avg_searches_per_session,
             CASE
               WHEN COUNT(*) > 0
               THEN ROUND(100.0 * SUM(CASE WHEN engagement_count <= 1 THEN 1 ELSE 0 END) / COUNT(*), 2)
               ELSE 0
             END AS bounce_rate
      FROM sessions s
      LEFT JOIN searches ON searches.anon_session_id = s.anon_id`,
      [params.startDate, params.endDate],
      this.pool,
    )

    return result.rows[0] ?? {
      total_sessions: 0,
      unique_users: 0,
      avg_session_duration: 0,
      avg_searches_per_session: 0,
      bounce_rate: 0,
    }
  }

  async getGeographicHeatmap(params: {
    startDate: Date
    endDate: Date
    aggregation: 'country' | 'city'
  }): Promise<HeatmapData[]> {
    const result = await query<{
      country_code: string
      search_count: number
      click_count: number
      unique_users: number
    }>(
      `WITH search_counts AS (
        SELECT split_part(corridor_id, '-', 1) AS country_code,
               COUNT(*)::int AS search_count,
               COUNT(DISTINCT COALESCE(user_id::text, anon_session_id))::int AS unique_users
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY 1
      ),
      click_counts AS (
        SELECT split_part(corridor_id, '-', 1) AS country_code,
               COUNT(*)::int AS click_count
        FROM silver.telemetry_outbound_click
        WHERE ts >= $1 AND ts <= $2
          AND corridor_id IS NOT NULL
        GROUP BY 1
      )
      SELECT sc.country_code,
             sc.search_count,
             COALESCE(cc.click_count, 0) AS click_count,
             sc.unique_users
      FROM search_counts sc
      LEFT JOIN click_counts cc ON cc.country_code = sc.country_code
      ORDER BY sc.search_count DESC`,
      [params.startDate, params.endDate],
      this.pool,
    )

    return result.rows.map((row) => ({
      country_code: row.country_code,
      country_name: countryNameMap.get(row.country_code) ?? null,
      search_count: row.search_count,
      click_count: row.click_count,
      unique_users: row.unique_users,
    }))
  }

  async getSavingsMetrics(params: {
    startDate: Date
    endDate: Date
    corridorId?: string
  }): Promise<{ summary: SavingsMetric; by_corridor: SavingsMetric[] }> {
    const corridorId = params.corridorId ?? null
    const summaryResult = await query<{
      total_searches: number
      total_savings_fees: number
      total_savings_delta: number
      avg_savings_per_search: number
      best_provider_savings: number
      worst_provider_cost: number
    }>(
      `WITH searched_corridors AS (
        SELECT DISTINCT corridor_id
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
          AND ($3::text IS NULL OR corridor_id = $3)
      ),
      fee_ranges AS (
        SELECT lqp.corridor_id,
               MIN(lqp.fee_amount) AS min_fee,
               MAX(lqp.fee_amount) AS max_fee
        FROM silver.latest_quote_by_provider lqp
        JOIN searched_corridors sc ON sc.corridor_id = lqp.corridor_id
        WHERE lqp.status = 'ok'
          AND lqp.collected_at >= $1 AND lqp.collected_at <= $2
        GROUP BY lqp.corridor_id
      ),
      corridor_savings AS (
        SELECT corridor_id,
               COALESCE(max_fee, 0) - COALESCE(min_fee, 0) AS fee_delta,
               COALESCE(max_fee, 0) AS worst_fee
        FROM fee_ranges
      ),
      totals AS (
        SELECT COUNT(*)::int AS total_searches
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
          AND ($3::text IS NULL OR corridor_id = $3)
      )
      SELECT totals.total_searches,
             COALESCE(SUM(fee_delta), 0)::float AS total_savings_fees,
             COALESCE(SUM(fee_delta), 0)::float AS total_savings_delta,
             CASE
               WHEN totals.total_searches > 0
               THEN COALESCE(SUM(fee_delta), 0)::float / totals.total_searches
               ELSE 0
             END AS avg_savings_per_search,
             COALESCE(SUM(fee_delta), 0)::float AS best_provider_savings,
             COALESCE(SUM(worst_fee), 0)::float AS worst_provider_cost
      FROM corridor_savings
      CROSS JOIN totals`,
      [params.startDate, params.endDate, corridorId],
      this.pool,
    )

    const byCorridorResult = await query<{
      corridor_id: string
      total_savings_fees: number
      total_savings_delta: number
      best_provider_savings: number
      worst_provider_cost: number
      total_searches: number
      avg_savings_per_search: number
    }>(
      `WITH fee_ranges AS (
        SELECT lqp.corridor_id,
               MIN(lqp.fee_amount) AS min_fee,
               MAX(lqp.fee_amount) AS max_fee
        FROM silver.latest_quote_by_provider lqp
        WHERE lqp.status = 'ok'
          AND lqp.collected_at >= $1 AND lqp.collected_at <= $2
          AND ($3::text IS NULL OR lqp.corridor_id = $3)
        GROUP BY lqp.corridor_id
      ),
      search_counts AS (
        SELECT corridor_id, COUNT(*)::int AS total_searches
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
          AND ($3::text IS NULL OR corridor_id = $3)
        GROUP BY corridor_id
      )
      SELECT fr.corridor_id,
             COALESCE(fr.max_fee, 0) - COALESCE(fr.min_fee, 0) AS total_savings_fees,
             COALESCE(fr.max_fee, 0) - COALESCE(fr.min_fee, 0) AS total_savings_delta,
             COALESCE(fr.max_fee, 0) - COALESCE(fr.min_fee, 0) AS best_provider_savings,
             COALESCE(fr.max_fee, 0) AS worst_provider_cost,
             COALESCE(sc.total_searches, 0) AS total_searches,
             CASE
               WHEN COALESCE(sc.total_searches, 0) > 0
               THEN (COALESCE(fr.max_fee, 0) - COALESCE(fr.min_fee, 0)) / sc.total_searches
               ELSE 0
             END AS avg_savings_per_search
      FROM fee_ranges fr
      JOIN search_counts sc ON sc.corridor_id = fr.corridor_id
      ORDER BY total_savings_fees DESC`,
      [params.startDate, params.endDate, corridorId],
      this.pool,
    )

    const summary = summaryResult.rows[0] ?? {
      total_searches: 0,
      total_savings_fees: 0,
      total_savings_delta: 0,
      avg_savings_per_search: 0,
      best_provider_savings: 0,
      worst_provider_cost: 0,
    }

    return {
      summary,
      by_corridor: byCorridorResult.rows,
    }
  }

  async getUserBehaviorPatterns(params: {
    startDate: Date
    endDate: Date
    patternType: 'search_frequency' | 'corridor_preferences' | 'amount_distribution'
  }): Promise<UserBehaviorPattern[]> {
    if (params.patternType === 'search_frequency') {
      const result = await query<{
        bucket: string
        frequency: number
        percentage: number
      }>(
        `WITH counts AS (
          SELECT COALESCE(user_id::text, anon_session_id) AS user_key,
                 COUNT(*)::int AS search_count
          FROM silver.telemetry_search_event
          WHERE ts >= $1 AND ts <= $2
          GROUP BY 1
        ),
        buckets AS (
          SELECT CASE
                   WHEN search_count <= 3 THEN '1-3'
                   WHEN search_count <= 10 THEN '4-10'
                   WHEN search_count <= 20 THEN '11-20'
                   ELSE '21+'
                 END AS bucket,
                 COUNT(*)::int AS frequency
          FROM counts
          GROUP BY 1
        ),
        totals AS (
          SELECT COUNT(*)::int AS total_users FROM counts
        )
        SELECT b.bucket,
               b.frequency,
               CASE
                 WHEN totals.total_users > 0
                 THEN ROUND(100.0 * b.frequency / totals.total_users, 2)
                 ELSE 0
               END AS percentage
        FROM buckets b
        CROSS JOIN totals
        ORDER BY b.bucket`,
        [params.startDate, params.endDate],
        this.pool,
      )

      return result.rows.map((row) => ({
        pattern_type: 'search_frequency',
        pattern_data: { bucket: row.bucket },
        frequency: row.frequency,
        percentage: row.percentage,
      }))
    }

    if (params.patternType === 'corridor_preferences') {
      const result = await query<{
        corridor_id: string
        frequency: number
        percentage: number
      }>(
        `WITH counts AS (
          SELECT corridor_id,
                 COUNT(*)::int AS frequency
          FROM silver.telemetry_search_event
          WHERE ts >= $1 AND ts <= $2
          GROUP BY corridor_id
        ),
        totals AS (
          SELECT SUM(frequency)::int AS total_searches FROM counts
        )
        SELECT c.corridor_id,
               c.frequency,
               CASE
                 WHEN totals.total_searches > 0
                 THEN ROUND(100.0 * c.frequency / totals.total_searches, 2)
                 ELSE 0
               END AS percentage
        FROM counts c
        CROSS JOIN totals
        ORDER BY c.frequency DESC
        LIMIT 50`,
        [params.startDate, params.endDate],
        this.pool,
      )

      return result.rows.map((row) => ({
        pattern_type: 'corridor_preferences',
        pattern_data: { corridor_id: row.corridor_id },
        frequency: row.frequency,
        percentage: row.percentage,
      }))
    }

    const result = await query<{
      amount_bucket: number
      frequency: number
      percentage: number
    }>(
      `WITH counts AS (
        SELECT amount_bucket,
               COUNT(*)::int AS frequency
        FROM silver.telemetry_search_event
        WHERE ts >= $1 AND ts <= $2
        GROUP BY amount_bucket
      ),
      totals AS (
        SELECT SUM(frequency)::int AS total_searches FROM counts
      )
      SELECT c.amount_bucket,
             c.frequency,
             CASE
               WHEN totals.total_searches > 0
               THEN ROUND(100.0 * c.frequency / totals.total_searches, 2)
               ELSE 0
             END AS percentage
      FROM counts c
      CROSS JOIN totals
      ORDER BY c.amount_bucket ASC`,
      [params.startDate, params.endDate],
      this.pool,
    )

    return result.rows.map((row) => ({
      pattern_type: 'amount_distribution',
      pattern_data: { amount_bucket: row.amount_bucket },
      frequency: row.frequency,
      percentage: row.percentage,
    }))
  }

  async getRevenueMetrics(params: {
    startDate: Date
    endDate: Date
    providerId?: string
    corridorId?: string
    limit?: number
  }): Promise<RevenueMetric[]> {
    const limit = params.limit ?? 200
    const providerId = params.providerId ?? null
    const corridorId = params.corridorId ?? null

    const result = await query<RevenueMetric>(
      `SELECT toc.provider_id,
              p.display_name AS provider_name,
              toc.corridor_id,
              COUNT(*)::int AS total_clicks,
              COUNT(*) FILTER (WHERE COALESCE(toc.is_affiliate, false))::int AS affiliate_clicks,
              COUNT(DISTINCT COALESCE(toc.user_id::text, toc.anon_session_id))::int AS unique_users,
              CASE
                WHEN COUNT(*) > 0
                THEN ROUND(
                  COUNT(*) FILTER (WHERE COALESCE(toc.is_affiliate, false))::numeric
                  / COUNT(*)::numeric * 100,
                  2
                )
                ELSE 0
              END AS affiliate_rate
       FROM silver.telemetry_outbound_click toc
       LEFT JOIN silver.provider p ON p.provider_id = toc.provider_id
       WHERE toc.ts >= $1 AND toc.ts <= $2
         AND ($3::text IS NULL OR toc.provider_id = $3)
         AND ($4::text IS NULL OR toc.corridor_id = $4)
       GROUP BY toc.provider_id, p.display_name, toc.corridor_id
       ORDER BY affiliate_clicks DESC, total_clicks DESC
       LIMIT $5`,
      [params.startDate, params.endDate, providerId, corridorId, limit],
      this.pool,
    )

    return result.rows
  }
}
