import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { parseCorridorId, formatCorridorId } from '../../../shared/corridor'
import {
  getCorridorTier,
  getExportTierInfo,
  isUsdOriginCorridor,
  TIER_1_CADENCE_SECONDS,
  TIER_2_CADENCE_SECONDS,
} from '../../../shared/corridor-tiers'
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
  dataTier: 1 | 2
  cadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  series: IndicesSeriesPoint[]
}

type DataAvailabilityResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  dataAvailable: false
  reason: 'no_data' | 'corridor_not_tracked' | 'gold_table_empty'
  message: string
  dataTier: 1 | 2
  cadenceMinutes: number
}

const toDateOnly = (value: Date) => value.toISOString().split('T')[0]

/**
 * Get tier info for API responses.
 * 
 * Export model (Tier 2 includes Tier 1 data):
 * - USD corridors: collected every 10 min (Tier 1), available in both Tier 1 and Tier 2 exports
 * - Non-USD corridors: collected every 3 hours (Tier 2), available only in Tier 2 exports
 * 
 * When serving in Tier 2 context, all corridors report Tier 2 cadence (3 hours)
 * as the SLA guarantee, even though USD data is fresher.
 */
const getDataTierForCorridor = (
  corridorId: string,
  apiTier: 1 | 2 = 2,
): {
  tier: 1 | 2
  cadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
} => {
  const info = getExportTierInfo(corridorId, apiTier)
  return {
    tier: info.exportTier,
    cadenceMinutes: info.cadenceMinutes,
    collectionTier: info.collectionTier,
    isUsdOrigin: isUsdOriginCorridor(corridorId),
  }
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
      return { error: 'invalid_corridor_id', message: 'Corridor ID must be in format: XX-YY-AAA-BBB (e.g., US-MX-USD-MXN)' }
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

    const tierInfo = getDataTierForCorridor(normalizedCorridorId, 2) // Tier 2 API context - includes all corridors
    const { tier: dataTier, cadenceMinutes, collectionTier, isUsdOrigin } = tierInfo

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setUTCDate(startDate.getUTCDate() - (windowDays - 1))

    const cacheKey = `${normalizedCorridorId}:${amountBucket}:${methodProfile}:${windowDays}`
    const cached = await indicesCache.get(cacheKey)
    if (cached) {
      reply.header('X-Data-Tier', String(dataTier))
      reply.header('X-Data-Cadence-Minutes', String(cadenceMinutes))
      reply.header('X-Collection-Tier', collectionTier)
      reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
      reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
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

      if (rows.length === 0) {
        const existsResult = await query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM gold_export.cdp_daily WHERE corridor_id = $1 LIMIT 1`,
          [normalizedCorridorId],
          planeAPool,
        )
        const corridorExists = (existsResult.rows[0]?.count ?? 0) > 0

        const response: DataAvailabilityResponse = {
          corridorId: normalizedCorridorId,
          amountBucket,
          methodProfile,
          dataAvailable: false,
          reason: corridorExists ? 'no_data' : 'corridor_not_tracked',
          message: corridorExists
            ? `No data available for ${normalizedCorridorId} with amount_bucket=${amountBucket} and method_profile=${methodProfile} in the requested time range.`
            : `Corridor ${normalizedCorridorId} is not currently tracked. Contact support to request coverage.`,
          dataTier,
          cadenceMinutes,
        }

        reply.header('X-Data-Tier', String(dataTier))
        reply.header('X-Data-Cadence-Minutes', String(cadenceMinutes))
        reply.header('X-Collection-Tier', collectionTier)
        reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
        reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
        reply.code(corridorExists ? 200 : 404)
        return response
      }

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
        dataTier,
        cadenceMinutes,
        collectionTier,
        isUsdOrigin,
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

      const ttlMs = cadenceMinutes * 60 * 1000
      await indicesCache.set(cacheKey, response, ttlMs)
      reply.header('X-Data-Tier', String(dataTier))
      reply.header('X-Data-Cadence-Minutes', String(cadenceMinutes))
      reply.header('X-Collection-Tier', collectionTier)
      reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
      reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
      return response
    } catch (error) {
      const isConnectionError = error instanceof Error && (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout') ||
        error.message.includes('connection')
      )

      logger.error('indices_series_failed', {
        corridor_id: normalizedCorridorId,
        amount_bucket: amountBucket,
        method_profile: methodProfile,
        error: error instanceof Error ? error.message : String(error),
      })

      if (isConnectionError) {
        reply.code(503)
        return {
          error: 'service_unavailable',
          message: 'Gold data service is temporarily unavailable. Please retry.',
          retryAfter: 30,
        }
      }

      reply.code(500)
      return { error: 'internal_error', message: 'Failed to retrieve index data.' }
    }
  })

  app.get('/indices/corridors', { preHandler: requireEntitlement('api_access') }, async (request, reply) => {
    try {
      const result = await query<{
        corridor_id: string
        source_country: string
        dest_country: string
        source_currency: string
        dest_currency: string
        data_points: number
        last_updated: Date
      }>(
        `SELECT
           corridor_id,
           SPLIT_PART(corridor_id, '-', 1) AS source_country,
           SPLIT_PART(corridor_id, '-', 2) AS dest_country,
           SPLIT_PART(corridor_id, '-', 3) AS source_currency,
           SPLIT_PART(corridor_id, '-', 4) AS dest_currency,
           COUNT(*)::int AS data_points,
           MAX(created_at) AS last_updated
         FROM gold_export.cdp_daily
         WHERE amount_bucket = 500
         GROUP BY corridor_id
         ORDER BY corridor_id`,
        [],
        planeAPool,
      )

      const corridors = result.rows.map((row) => {
        const tierInfo = getDataTierForCorridor(row.corridor_id, 2)
        return {
          corridorId: row.corridor_id,
          sourceCountry: row.source_country,
          destCountry: row.dest_country,
          sourceCurrency: row.source_currency,
          destCurrency: row.dest_currency,
          dataTier: tierInfo.tier,
          cadenceMinutes: tierInfo.cadenceMinutes,
          collectionTier: tierInfo.collectionTier,
          isUsdOrigin: tierInfo.isUsdOrigin,
          dataPoints: row.data_points,
          lastUpdated: row.last_updated?.toISOString() ?? null,
        }
      })

      const usdOriginCount = corridors.filter((c) => c.isUsdOrigin).length
      const nonUsdCount = corridors.length - usdOriginCount

      return {
        totalCorridors: corridors.length,
        usdOriginCount,
        nonUsdCount,
        collectionTier1Count: usdOriginCount,
        collectionTier2Count: nonUsdCount,
        note: 'Tier 2 export includes ALL corridors. USD-origin corridors are collected every 10 min but served at Tier 2 cadence (3 hours) as the SLA guarantee.',
        corridors,
      }
    } catch (error) {
      logger.error('indices_corridors_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to retrieve corridor list.' }
    }
  })

  app.get('/indices/health', async (_request, reply) => {
    try {
      const result = await query<{ count: number; latest: Date | null }>(
        `SELECT COUNT(*)::int AS count, MAX(created_at) AS latest FROM gold_export.cdp_daily WHERE date >= NOW() - INTERVAL '7 days'`,
        [],
        planeAPool,
      )
      const row = result.rows[0]
      const healthy = (row?.count ?? 0) > 0

      reply.code(healthy ? 200 : 503)
      return {
        status: healthy ? 'healthy' : 'degraded',
        goldTablePopulated: healthy,
        recentDataPoints: row?.count ?? 0,
        latestUpdate: row?.latest?.toISOString() ?? null,
        message: healthy
          ? 'Gold export data is available and recent.'
          : 'Gold export table has no recent data. Indices may be stale or unavailable.',
      }
    } catch (error) {
      logger.error('indices_health_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(503)
      return {
        status: 'unavailable',
        goldTablePopulated: false,
        recentDataPoints: 0,
        latestUpdate: null,
        message: 'Unable to connect to Gold export database.',
      }
    }
  })
}
