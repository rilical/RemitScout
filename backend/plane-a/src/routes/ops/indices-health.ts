import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAdmin } from '../../plugins/auth-plugin'
import { HEALTH_CORRIDORS } from '../../../../shared/health-corridors'

const logger = createLogger('plane-a.ops.indices-health')
const planeAPool = getPool(config.db.planeAUrl)

const tier0Corridors = Array.from(new Set(Object.values(HEALTH_CORRIDORS).flat()))

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const indicesHealthRoutes = (app: FastifyInstance) => {
  app.get('/ops/indices/health', { preHandler: requireAdmin() }, async (_request, reply) => {
    if (tier0Corridors.length === 0) {
      reply.code(500)
      return {
        status: 'error',
        error: 'no_tier0_corridors',
        message: 'Tier-0 corridor set is empty.',
      }
    }

    const amountBucket = 500
    const methodProfile = 'standard_bank'

    try {
      const result = await planeAPool.query<{
        total: number | null
        available: number | null
        suppressed: number | null
        min_provider_count: number | null
        weight_confidence_p10: number | null
        latest_date: string | null
      }>(
        `WITH latest AS (
           SELECT DISTINCT ON (corridor_id)
             corridor_id,
             date,
             suppression_flag,
             provider_count,
             weight_confidence
           FROM gold_export.cdp_daily
           WHERE corridor_id = ANY($1::text[])
             AND amount_bucket = $2
             AND method_profile = $3
           ORDER BY corridor_id, date DESC
         )
         SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE suppression_flag IS FALSE)::int AS available,
           COUNT(*) FILTER (WHERE suppression_flag IS TRUE)::int AS suppressed,
           MIN(provider_count)::int AS min_provider_count,
           percentile_cont(0.1) WITHIN GROUP (ORDER BY weight_confidence)::double precision
             AS weight_confidence_p10,
           MAX(date)::text AS latest_date
         FROM latest`,
        [tier0Corridors, amountBucket, methodProfile],
      )

      const row = result.rows[0]
      const total = Number(row?.total ?? 0)
      const available = Number(row?.available ?? 0)
      const suppressed = Number(row?.suppressed ?? 0)
      const missing = Math.max(0, tier0Corridors.length - total)
      const availableRatio = total > 0 ? available / total : 0
      const suppressedRatio = total > 0 ? suppressed / total : 0
      const minProviderCount = toNumber(row?.min_provider_count)
      const weightConfidenceP10 = toNumber(row?.weight_confidence_p10)

      const reasons: string[] = []
      if (missing > 0) reasons.push('missing_corridors')
      if (availableRatio < 0.8) reasons.push('low_available_ratio')
      if (suppressedRatio > 0.2) reasons.push('high_suppressed_ratio')
      if (minProviderCount !== null && minProviderCount < 3) reasons.push('low_provider_count')
      if (weightConfidenceP10 !== null && weightConfidenceP10 < 0.3) reasons.push('low_weight_confidence')

      const status = reasons.length > 0 ? 'degraded' : 'ok'

      return {
        status,
        timestamp: new Date().toISOString(),
        summary: {
          corridors_expected: tier0Corridors.length,
          corridors_observed: total,
          corridors_missing: missing,
          available_ratio: availableRatio,
          suppressed_ratio: suppressedRatio,
          min_provider_count: minProviderCount,
          weight_confidence_p10: weightConfidenceP10,
          latest_date: row?.latest_date ?? null,
          amount_bucket: amountBucket,
          method_profile: methodProfile,
        },
        reasons,
      }
    } catch (error) {
      logger.error('indices_health_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { status: 'error', error: 'indices_health_failed' }
    }
  })
}
