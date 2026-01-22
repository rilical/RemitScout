import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { parseCorridorId, formatCorridorId } from '../../../shared/corridor'
import { PROVIDER_WEIGHTING_MODEL } from '../../../shared/provider-weights'
import { requireEntitlement } from '../plugins/auth-plugin'

const logger = createLogger('plane-a.indices')
const planeAPool = getPool(config.db.planeAUrl)
const indicesCache = createTtlCache<IndicesSeriesResponse>({ namespace: 'plane_a:indices' })

const querySchema = z.object({
  corridor_id: z.string().min(3),
  amount_bucket: z.coerce.number().int().positive().optional(),
  method_profile: z.enum(['standard_bank', 'standard_card', 'cash_pickup']).optional(),
  days: z.coerce.number().int().positive().optional(),
})

type IndicesSeriesPoint = {
  date: string
  teer: number | null
  rci: number | null
  rvi: number | null
  providerCountBinned: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
}

type IndicesSeriesResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  lastUpdated: string | null
  series: IndicesSeriesPoint[]
}

const toDateOnly = (value: Date) => value.toISOString().split('T')[0]

const normalizeScopes = (scopes?: string[]) => {
  if (!scopes) return []
  return scopes.map((scope) => scope.trim().toLowerCase()).filter(Boolean)
}

export const indicesRoutes = async (app: FastifyInstance) => {
  app.get('/indices/series', { preHandler: requireEntitlement('api_access') }, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const corridorId = parsed.data.corridor_id
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
      reply.code(400)
      return { error: 'invalid_corridor_id' }
    }
    const normalizedCorridorId = formatCorridorId({
      sourceCountry: corridorParts.sourceCountry.toUpperCase(),
      destCountry: corridorParts.destCountry.toUpperCase(),
      sourceCurrency: corridorParts.sourceCurrency.toUpperCase(),
      destCurrency: corridorParts.destCurrency.toUpperCase(),
    })
    const amountBucket = parsed.data.amount_bucket ?? 500
    const methodProfile = parsed.data.method_profile ?? 'standard_bank'
    const windowDays = Math.min(Math.max(parsed.data.days ?? 30, 1), 365)

    const scopes = normalizeScopes(request.apiKey?.scopes)
    if (scopes.includes('tier:1')) {
      reply.code(403)
      return { error: 'tier_disabled', message: 'Tier 1 API access is disabled.' }
    }
    const apiTier = scopes.includes('tier:3') ? 3 : 2
    const cadenceHours =
      apiTier === 3
        ? config.planeA.enterpriseApiTier3CadenceHours
        : config.planeA.enterpriseApiTier2CadenceHours

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setUTCDate(startDate.getUTCDate() - (windowDays - 1))

    const cacheKey = `${normalizedCorridorId}:${amountBucket}:${methodProfile}:${windowDays}:tier${apiTier}`
    const cached = await indicesCache.get(cacheKey)
    if (cached) {
      reply.header('X-Data-Tier', `tier${apiTier}`)
      reply.header('X-Data-Cadence-Hours', String(cadenceHours))
      return cached
    }

    try {
      const result = await query<{
        date: Date
        corridor_id: string
        amount_bucket: number
        method_profile: string
        teer_rate: number | null
        rci_ratio: number | null
        rvi_value: number | null
        provider_count_binned: number | null
        suppression_flag: boolean
        suppression_reason: string | null
        weighting_model: string | null
        created_at: Date
      }>(
        `SELECT date,
                corridor_id,
                amount_bucket,
                method_profile,
                teer_rate::double precision AS teer_rate,
                rci_ratio::double precision AS rci_ratio,
                rvi_value::double precision AS rvi_value,
                provider_count_binned,
                suppression_flag,
                suppression_reason,
                weighting_model,
                created_at
         FROM gold_export.cdp_daily
         WHERE corridor_id = $1
           AND amount_bucket = $2
           AND method_profile = $3
           AND date >= $4
         ORDER BY date ASC`,
        [normalizedCorridorId, amountBucket, methodProfile, startDate],
        planeAPool,
      )

      const rows = result.rows
      const lastUpdated = rows.reduce<Date | null>((latest, row) => {
        if (!row.created_at) return latest
        if (!latest || row.created_at > latest) return row.created_at
        return latest
      }, null)

      const weightingModel =
        rows.find((row) => row.weighting_model)?.weighting_model || PROVIDER_WEIGHTING_MODEL

      const response: IndicesSeriesResponse = {
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        weightingModel,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
        series: rows.map((row) => ({
          date: row.date instanceof Date ? toDateOnly(row.date) : String(row.date),
          teer: row.teer_rate ?? null,
          rci: row.rci_ratio ?? null,
          rvi: row.rvi_value ?? null,
          providerCountBinned: row.provider_count_binned ?? null,
          suppressionFlag: row.suppression_flag,
          suppressionReason: row.suppression_reason ?? null,
        })),
      }

      const ttlMs = Math.max(1, cadenceHours) * 60 * 60 * 1000
      await indicesCache.set(cacheKey, response, ttlMs)
      reply.header('X-Data-Tier', `tier${apiTier}`)
      reply.header('X-Data-Cadence-Hours', String(cadenceHours))
      return response
    } catch (error) {
      logger.error('indices_series_failed', {
        corridor_id: normalizedCorridorId,
        amount_bucket: amountBucket,
        method_profile: methodProfile,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
