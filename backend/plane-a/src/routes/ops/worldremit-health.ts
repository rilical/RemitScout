import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { getHealthCorridors } from '../../../../shared/health-corridors'
import { requireAdmin } from '../../plugins/auth-plugin'
import { LatestQuoteRepository, QuoteAttemptRepository } from '../../repositories'

const planeAPool = getPool(config.db.planeAUrl)
const quoteAttemptRepository = new QuoteAttemptRepository(planeAPool)
const latestQuoteRepository = new LatestQuoteRepository(planeAPool)
const logger = createLogger('plane-a.ops.worldremit-health')

const minutesSince = (value: string | Date | null) => {
  if (!value) return null
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.round((Date.now() - timestamp) / 60000)
}

export const worldRemitHealthRoutes = async (app: FastifyInstance) => {
  app.get('/api/ops/worldremit/health', { preHandler: requireAdmin() }, async (request, reply) => {
    const healthCorridors = getHealthCorridors('worldremit')
    if (!healthCorridors || healthCorridors.length === 0) {
      logger.warn('worldremit_health_no_corridors')
      reply.code(500)
      return {
        error: 'configuration_error',
        message: 'No health corridors configured',
      }
    }

    try {
      const attempts = await quoteAttemptRepository.listLatestAttemptsByProvider(
        'worldremit',
        healthCorridors,
      )

      const quotes = await latestQuoteRepository.listLatestByProvider(
        'worldremit',
        healthCorridors,
      )

      const attemptsByCorridor = new Map(
        attempts.map((row) => [row.corridor_id as string, row]),
      )
      const quotesByCorridor = new Map(
        quotes.map((row) => [row.corridor_id as string, row]),
      )

      const corridors = healthCorridors.map((corridorId) => {
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

      logger.debug('worldremit_health_success', {
        corridor_count: corridors.length,
        stale_count: staleCorridors.length,
      })

      return {
        success: true,
        provider_id: 'worldremit',
        timestamp: new Date().toISOString(),
        corridors,
        summary: {
          corridor_count: corridors.length,
          stale_count: staleCorridors.length,
          fresh_window_minutes: freshWindowMinutes,
        },
      }
    } catch (error: any) {
      logger.error('worldremit_health_failed', {
        error: error.message,
        stack: error.stack,
      })
      reply.code(500)
      return {
        error: 'internal_error',
        message: 'Failed to fetch WorldRemit health data',
      }
    }
  })
}
