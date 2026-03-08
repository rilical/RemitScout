import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { parseCorridorId, formatCorridorId } from '../../../shared/corridor'
import { DEFAULT_AMOUNT_BUCKET } from '../../../shared/constants'
import { requireEntitlement } from '../plugins/auth-plugin'
import { ValidationError } from '../../../shared/errors'
import { apiKeyAccessConfig } from './api-key-access'

const logger = createLogger('plane-a.corridor-coverage')

const paramSchema = z.object({
  corridorId: z.string().min(3),
})

const querySchema = z.object({
  amount_bucket: z.coerce.number().int().positive().optional(),
})

type ProviderFreshness = {
  providerId: string
  providerName: string | null
  lastObservedAt: string
  ageMinutes: number
}

type CoverageResponse = {
  corridorId: string
  amountBucket: number
  providerCount: number
  providers: ProviderFreshness[]
  confidence: 'high' | 'medium' | 'low' | 'none'
  publishable: boolean
  publishGateReasons: string[]
  lastUpdated: string | null
}

export const corridorCoverageRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool } = app.container

  app.get(
    '/corridors/:corridorId/coverage',
    {
      preHandler: requireEntitlement('api_access'),
      config: apiKeyAccessConfig({ audience: 'institutional', requiredScope: 'corridors:read' }),
    },
    async (request, reply) => {
      const params = paramSchema.safeParse(request.params)
      if (!params.success) {
        throw new ValidationError('Invalid corridor ID', {
          details: { error: 'bad_request', details: params.error.issues },
        })
      }

      const corridorParts = parseCorridorId(params.data.corridorId)
      if (!corridorParts) {
        throw new ValidationError('Invalid corridor ID format', {
          details: {
            error: 'invalid_corridor_id',
            message: 'Corridor ID must be in format: XX-YY-AAA-BBB (e.g., US-MX-USD-MXN)',
          },
        })
      }

      const normalizedCorridorId = formatCorridorId({
        sourceCountry: corridorParts.sourceCountry.toUpperCase(),
        destCountry: corridorParts.destCountry.toUpperCase(),
        sourceCurrency: corridorParts.sourceCurrency.toUpperCase(),
        destCurrency: corridorParts.destCurrency.toUpperCase(),
      })

      const qs = querySchema.safeParse(request.query)
      const amountBucket = qs.success
        ? qs.data.amount_bucket ?? DEFAULT_AMOUNT_BUCKET
        : DEFAULT_AMOUNT_BUCKET

      try {
        // Get per-provider freshness for the corridor
        const providerResult = await query<{
          provider_id: string
          provider_name: string | null
          last_observed_at: Date
          age_minutes: number
        }>(
          `WITH eligible_providers AS (
             SELECT provider_id
             FROM silver.rights_matrix
             WHERE allowed_collect IS TRUE
               AND allowed_b2b IS TRUE
               AND LOWER(COALESCE(stoplist_status, '')) = 'active'
               AND LOWER(COALESCE(status, '')) = 'production'
           )
           SELECT
             o.provider_id,
             p.name AS provider_name,
             MAX(o.observed_at) AS last_observed_at,
             EXTRACT(EPOCH FROM (NOW() - MAX(o.observed_at)))::int / 60 AS age_minutes
           FROM silver.observation o
           JOIN eligible_providers ep ON ep.provider_id = o.provider_id
           LEFT JOIN silver.provider p ON p.provider_id = o.provider_id
           WHERE o.corridor_id = $1
             AND o.amount_bucket = $2
             AND o.type = 'quote'
             AND o.observed_at >= NOW() - INTERVAL '24 hours'
           GROUP BY o.provider_id, p.name
           ORDER BY last_observed_at DESC`,
          [normalizedCorridorId, amountBucket],
          planeAPool,
        )

        const providers: ProviderFreshness[] = providerResult.rows.map((row) => ({
          providerId: row.provider_id,
          providerName: row.provider_name,
          lastObservedAt: row.last_observed_at.toISOString(),
          ageMinutes: row.age_minutes,
        }))

        const providerCount = providers.length
        const lastUpdated = providers.length > 0 ? providers[0].lastObservedAt : null

        // Determine confidence level
        let confidence: 'high' | 'medium' | 'low' | 'none'
        const maxAge = providers.length > 0
          ? Math.max(...providers.map((p) => p.ageMinutes))
          : Infinity

        if (providerCount >= 5 && maxAge <= 30) confidence = 'high'
        else if (providerCount >= 3 && maxAge <= 120) confidence = 'medium'
        else if (providerCount >= 1) confidence = 'low'
        else confidence = 'none'

        // Check publisher gate (min 3 providers for publishability)
        const publishGateReasons: string[] = []
        if (providerCount < 3) {
          publishGateReasons.push('insufficient_providers')
        }

        // Check for provider dominance if we have enough data
        if (providerCount >= 2) {
          const dominanceResult = await query<{
            top_share: number
            top_two_share: number
          }>(
            `WITH eligible_providers AS (
               SELECT provider_id
               FROM silver.rights_matrix
               WHERE allowed_collect IS TRUE
                 AND allowed_b2b IS TRUE
                 AND LOWER(COALESCE(stoplist_status, '')) = 'active'
                 AND LOWER(COALESCE(status, '')) = 'production'
             ),
             provider_counts AS (
               SELECT provider_id, COUNT(*) AS cnt
               FROM silver.observation
               WHERE provider_id IN (SELECT provider_id FROM eligible_providers)
                 AND corridor_id = $1
                 AND amount_bucket = $2
                 AND type = 'quote'
                 AND observed_at >= NOW() - INTERVAL '24 hours'
               GROUP BY provider_id
             ),
             total AS (
               SELECT SUM(cnt)::numeric AS total FROM provider_counts
             )
             SELECT
               MAX(cnt::numeric / total) AS top_share,
               (SELECT SUM(top2.cnt)::numeric / MAX(t2.total)
                FROM (SELECT cnt FROM provider_counts ORDER BY cnt DESC LIMIT 2) top2,
                     total t2) AS top_two_share
             FROM provider_counts, total`,
            [normalizedCorridorId, amountBucket],
            planeAPool,
          )

          const row = dominanceResult.rows[0]
          if (row) {
            if (row.top_share > 0.5) publishGateReasons.push('dominance_top_provider')
            if (row.top_two_share > 0.75) publishGateReasons.push('dominance_top_two')
          }
        }

        const publishable = publishGateReasons.length === 0

        const response: CoverageResponse = {
          corridorId: normalizedCorridorId,
          amountBucket,
          providerCount,
          providers,
          confidence,
          publishable,
          publishGateReasons,
          lastUpdated,
        }

        return response
      } catch (error) {
        logger.error('corridor_coverage_failed', {
          corridor_id: normalizedCorridorId,
          error: error instanceof Error ? error.message : String(error),
        })
        reply.code(500)
        return { error: 'internal_error', message: 'Failed to retrieve corridor coverage.' }
      }
    },
  )
}
