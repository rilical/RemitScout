import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { XE_HEALTH_CORRIDORS } from '../../../../shared/xe-corridors'
import { requireAdmin } from '../../plugins/auth-plugin'

const planeAPool = getPool(config.db.planeAUrl)

const minutesSince = (value: string | Date | null) => {
  if (!value) return null
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.round((Date.now() - timestamp) / 60000)
}

export const xeHealthRoutes = async (app: FastifyInstance) => {
  app.get('/api/ops/xe/health', { preHandler: requireAdmin() }, async () => {
    const attemptsResult = await planeAPool.query(
      `SELECT DISTINCT ON (corridor_id)
         corridor_id,
         attempted_at,
         success,
         error_type,
         http_status,
         error_message,
         request_fingerprint
       FROM silver.quote_attempt
       WHERE provider_id = 'xe'
         AND corridor_id = ANY($1::text[])
       ORDER BY corridor_id, attempted_at DESC`,
      [XE_HEALTH_CORRIDORS],
    )

    const quotesResult = await planeAPool.query(
      `SELECT DISTINCT ON (corridor_id)
         corridor_id,
         payin,
         payout,
         collected_at,
         send_amount,
         fee_amount,
         promotional_fee_amount,
         total_debit_amount,
         receive_amount,
         implied_fx_rate,
         promotional_rate,
         base_rate,
         promotional_cap_amount,
         delivery_time_min_minutes,
         delivery_time_max_minutes,
         quality_flags,
         updated_at
       FROM silver.latest_quote_by_provider
       WHERE provider_id = 'xe'
         AND corridor_id = ANY($1::text[])
       ORDER BY corridor_id, collected_at DESC`,
      [XE_HEALTH_CORRIDORS],
    )

    const attemptsByCorridor = new Map(
      attemptsResult.rows.map((row) => [row.corridor_id as string, row]),
    )
    const quotesByCorridor = new Map(
      quotesResult.rows.map((row) => [row.corridor_id as string, row]),
    )

    const corridors = XE_HEALTH_CORRIDORS.map((corridorId) => {
      const attempt = attemptsByCorridor.get(corridorId) || null
      const quote = quotesByCorridor.get(corridorId) || null

      return {
        corridor_id: corridorId,
        last_attempt_at: attempt?.attempted_at ?? null,
        last_attempt_age_minutes: minutesSince(attempt?.attempted_at ?? null),
        last_attempt_success: attempt?.success ?? null,
        last_attempt_http_status: attempt?.http_status ?? null,
        last_attempt_error_type: attempt?.error_type ?? null,
        last_attempt_error_message: attempt?.error_message ?? null,
        last_attempt_request: attempt?.request_fingerprint ?? null,
        last_quote_at: quote?.collected_at ?? null,
        last_quote_age_minutes: minutesSince(quote?.collected_at ?? null),
        payin: quote?.payin ?? null,
        payout: quote?.payout ?? null,
        send_amount: quote?.send_amount ?? null,
        fee_amount: quote?.fee_amount ?? null,
        promotional_fee_amount: quote?.promotional_fee_amount ?? null,
        total_debit_amount: quote?.total_debit_amount ?? null,
        receive_amount: quote?.receive_amount ?? null,
        implied_fx_rate: quote?.implied_fx_rate ?? null,
        promotional_rate: quote?.promotional_rate ?? null,
        base_rate: quote?.base_rate ?? null,
        promotional_cap_amount: quote?.promotional_cap_amount ?? null,
        delivery_time_min_minutes: quote?.delivery_time_min_minutes ?? null,
        delivery_time_max_minutes: quote?.delivery_time_max_minutes ?? null,
        quality_flags: quote?.quality_flags ?? null,
        updated_at: quote?.updated_at ?? null,
      }
    })

    const freshWindowMinutes = 24 * 60
    const staleCorridors = corridors.filter((corridor) => {
      const age = corridor.last_quote_age_minutes
      return age === null || age > freshWindowMinutes
    })

    return {
      success: true,
      provider_id: 'xe',
      timestamp: new Date().toISOString(),
      corridors,
      summary: {
        corridor_count: corridors.length,
        stale_count: staleCorridors.length,
        fresh_window_minutes: freshWindowMinutes,
      },
    }
  })
}
