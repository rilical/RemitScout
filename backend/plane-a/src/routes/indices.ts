import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { parseCorridorId, formatCorridorId } from '../../../shared/corridor'
import {
  getExportTierInfo,
  isUsdOriginCorridor,
  TIER_1_CADENCE_SECONDS,
  TIER_2_CADENCE_SECONDS,
} from '../../../shared/corridor-tiers'
import { DEFAULT_WEIGHT_MODEL, INDICES_METHODOLOGY_VERSION } from '../../../shared/weighting-model'
import { DEFAULT_AMOUNT_BUCKET } from '../../../shared/constants'
import { requireEntitlement } from '../plugins/auth-plugin'
import { ValidationError } from '../../../shared/errors'

const logger = createLogger('plane-a.indices')
const indicesCache = createTtlCache<IndicesSeriesResponse>({ namespace: 'plane_a:indices' })
const indicesEmbedSnapshotCache = createTtlCache<IndicesEmbedSnapshotResponse>({
  namespace: 'plane_a:indices_embed_snapshot',
})
const INDICES_EMBED_SNAPSHOT_TTL_MS = 30 * 24 * 60 * 60 * 1000
const envName = config.envName.toLowerCase()
const isVitestRuntime = Boolean(process.env.VITEST_WORKER_ID || process.env.VITEST)
// Note: VITEST_WORKER_ID and VITEST are test-runner vars, not app config. They must remain as process.env reads.
const allowUnauthedIndices =
  !isVitestRuntime && (envName === 'dev' || config.env === 'development')
const apiAccessGuard = allowUnauthedIndices ? undefined : requireEntitlement('api_access')

const METHOD_PROFILES = ['standard_bank', 'standard_card', 'cash_pickup', 'mobile_wallet', 'airtime_topup', 'card_delivery', 'home_delivery'] as const

const querySchema = z.object({
  corridor_id: z.string().min(3),
  amount_bucket: z.coerce.number().int().positive().optional(),
  method_profile: z.enum(METHOD_PROFILES).optional(),
  days: z.coerce.number().int().positive().optional(),
  as_of: z.string().optional(),
  methodology: z.string().optional(),
})

const embedSnapshotBodySchema = z.object({
  corridor_id: z.string().min(3),
  amount_bucket: z.coerce.number().int().positive().optional(),
  method_profile: z.enum(METHOD_PROFILES).optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
})

type IndicesSeriesPoint = {
  date: string
  teer: number | null
  rci: number | null
  rvi_bps: number | null
  providerCountBinned: number | null
  providerCount: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
  midMarketRate: number | null
  weightConfidence: number | null
  weightWindowDays: number | null
}

type IndicesSeriesResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  methodologyVersion: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  lastUpdated: string | null
  dataTier: 1 | 2
  cadenceMinutes: number
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  series: IndicesSeriesPoint[]
  dataWindow: DataWindowInfo
}

type IndicesEmbedSnapshotResponse = {
  snapshotId: string
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  methodologyVersion: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  lastUpdated: string | null
  dataTier: 1 | 2
  cadenceMinutes: number
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  series: IndicesSeriesPoint[]
  dataWindow: DataWindowInfo
  createdAt: string
  expiresAt: string
}

type IndicesLatestPoint = {
  date: string
  teer: number | null
  rci: number | null
  rvi_bps: number | null
  providerCountBinned: number | null
  providerCount: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
  midMarketRate: number | null
  weightConfidence: number | null
  weightWindowDays: number | null
}

type IndicesLatestResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  methodologyVersion: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  lastUpdated: string | null
  dataTier: 1 | 2
  cadenceMinutes: number
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  point: IndicesLatestPoint
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
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  dataWindow: DataWindowInfo
}

type DataWindowInfo = {
  requestedDays: number
  availableDays: number | null
  returnedDays: number
  availableStartDate: string | null
  availableEndDate: string | null
  startDate: string
  endDate: string
  capped: boolean
}

const toDateOnly = (value: Date) => value.toISOString().split('T')[0]
const embedSnapshotIdPattern = /^[a-f0-9]{32}$/i

/**
 * Get tier info for API responses.
 * 
 * Export model (Tier 2 includes Tier 1 data):
 * - USD corridors: collected every 10 min (Tier 1), available in both Tier 1 and Tier 2 exports
 * - Non-USD corridors: collected every 3 hours (Tier 2), available only in Tier 2 exports
 * 
 * For API clarity, we return both:
 * - collectionCadenceMinutes: actual collection cadence (tier 1 = 10 min, tier 2 = 180 min)
 * - exportCadenceMinutes: export SLA cadence for the API tier
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

const getCollectionCadenceMinutes = (collectionTier: 'tier_1' | 'tier_2') =>
  Math.round(
    (collectionTier === 'tier_1' ? TIER_1_CADENCE_SECONDS : TIER_2_CADENCE_SECONDS) / 60,
  )

export const indicesRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const goldIndicesRepository = repositories.goldIndices

  app.get('/indices/series', apiAccessGuard ? { preHandler: apiAccessGuard } : {}, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const corridorId = parsed.data.corridor_id
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
            throw new ValidationError('Invalid request', { details: { error: 'invalid_corridor_id', message: 'Corridor ID must be in format: XX-YY-AAA-BBB (e.g., US-MX-USD-MXN)' } })
    }
    const normalizedCorridorId = formatCorridorId({
      sourceCountry: corridorParts.sourceCountry.toUpperCase(),
      destCountry: corridorParts.destCountry.toUpperCase(),
      sourceCurrency: corridorParts.sourceCurrency.toUpperCase(),
      destCurrency: corridorParts.destCurrency.toUpperCase(),
    })
    const amountBucket = parsed.data.amount_bucket ?? DEFAULT_AMOUNT_BUCKET
    const methodProfile = parsed.data.method_profile ?? 'standard_bank'
    const requestedWindowDays = Math.min(Math.max(parsed.data.days ?? 30, 1), 365)

    const tierInfo = getDataTierForCorridor(normalizedCorridorId, 2) // Tier 2 API context - includes all corridors
    const { tier: dataTier, cadenceMinutes: exportCadenceMinutes, collectionTier, isUsdOrigin } =
      tierInfo
    const collectionCadenceMinutes = getCollectionCadenceMinutes(collectionTier)

    try {
      const availabilityRow = await goldIndicesRepository.getAvailability({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
      })
      const minDate = availabilityRow?.min_date ? new Date(availabilityRow.min_date) : null
      const maxDate = availabilityRow?.max_date ? new Date(availabilityRow.max_date) : null
      const totalCount = availabilityRow?.total_count ?? 0
      const availableDays = (minDate && maxDate)
        ? Math.max(1, Math.floor((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
        : null

      const now = new Date()
      const effectiveEndDate = (maxDate && maxDate < now) ? maxDate : now
      const effectiveWindowDays = availableDays && availableDays > 0
        ? Math.min(requestedWindowDays, availableDays)
        : requestedWindowDays

      const startDate = new Date(effectiveEndDate)
      startDate.setUTCDate(startDate.getUTCDate() - (effectiveWindowDays - 1))
      if (minDate && startDate < minDate) {
        startDate.setTime(minDate.getTime())
      }

      const dataWindowBase = {
        requestedDays: requestedWindowDays,
        availableDays,
        availableStartDate: minDate ? toDateOnly(minDate) : null,
        availableEndDate: maxDate ? toDateOnly(maxDate) : null,
        startDate: toDateOnly(startDate),
        endDate: toDateOnly(effectiveEndDate),
        capped: Boolean(availableDays && availableDays < requestedWindowDays),
      }

      const cacheKey = `${normalizedCorridorId}:${amountBucket}:${methodProfile}:${effectiveWindowDays}:${dataWindowBase.endDate}`
      const cached = await indicesCache.get(cacheKey)
      if (cached) {
        const cachedResponse = cached as IndicesSeriesResponse & { dataWindow?: DataWindowInfo }
        if (!cachedResponse.dataWindow) {
          cachedResponse.dataWindow = {
            ...dataWindowBase,
            returnedDays: Array.isArray(cachedResponse.series)
              ? cachedResponse.series.length
              : 0,
          }
        }
        reply.header('X-Data-Tier', String(dataTier))
        reply.header('X-Data-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Collection-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Export-Cadence-Minutes', String(exportCadenceMinutes))
        reply.header('X-Collection-Tier', collectionTier)
        reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
        reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
        cachedResponse.exportCadenceMinutes = exportCadenceMinutes
        cachedResponse.collectionCadenceMinutes = collectionCadenceMinutes
        cachedResponse.cadenceMinutes = collectionCadenceMinutes
        return cachedResponse
      }
      const rows = await goldIndicesRepository.getIndicesSeries({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        startDate,
        endDate: effectiveEndDate,
      })

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
          reason: corridorExists || totalCount > 0 ? 'no_data' : 'corridor_not_tracked',
          message: corridorExists
            ? `No data available for ${normalizedCorridorId} with amount_bucket=${amountBucket} and method_profile=${methodProfile} in the requested time range.`
            : `Corridor ${normalizedCorridorId} is not currently tracked. Contact support to request coverage.`,
          dataTier,
          cadenceMinutes: collectionCadenceMinutes,
          exportCadenceMinutes,
          collectionCadenceMinutes,
          collectionTier,
          isUsdOrigin,
          dataWindow: {
            ...dataWindowBase,
            returnedDays: 0,
          },
        }

        reply.header('X-Data-Tier', String(dataTier))
        reply.header('X-Data-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Collection-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Export-Cadence-Minutes', String(exportCadenceMinutes))
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
        rows.find((row) => row.weighting_model)?.weighting_model || DEFAULT_WEIGHT_MODEL
      const methodologyVersion =
        rows.find((row) => row.methodology_version)?.methodology_version || INDICES_METHODOLOGY_VERSION
      const weightConfidence = rows.find((row) => row.weight_confidence !== null)?.weight_confidence ?? null
      const weightWindowDays = rows.find((row) => row.weight_window_days !== null)?.weight_window_days ?? null

      const response: IndicesSeriesResponse = {
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        weightingModel,
        methodologyVersion,
        weightConfidence,
        weightWindowDays,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
        dataTier,
        cadenceMinutes: collectionCadenceMinutes,
        exportCadenceMinutes,
        collectionCadenceMinutes,
        collectionTier,
        isUsdOrigin,
        series: rows.map((row) => ({
          date: row.date instanceof Date ? toDateOnly(row.date) : String(row.date),
          teer: row.teer_rate ?? null,
          rci: row.rci_ratio ?? null,
          rvi_bps: row.rvi_bps ?? null,
          providerCountBinned: row.provider_count_binned ?? null,
          providerCount: row.provider_count ?? null,
          suppressionFlag: row.suppression_flag,
          suppressionReason: row.suppression_reason ?? null,
          midMarketRate: row.mid_market_rate ?? null,
          weightConfidence: row.weight_confidence ?? null,
          weightWindowDays: row.weight_window_days ?? null,
        })),
        dataWindow: {
          ...dataWindowBase,
          returnedDays: rows.length,
        },
      }

      const ttlMs = collectionCadenceMinutes * 60 * 1000
      await indicesCache.set(cacheKey, response, ttlMs)
      reply.header('X-Data-Tier', String(dataTier))
      reply.header('X-Data-Cadence-Minutes', String(collectionCadenceMinutes))
      reply.header('X-Collection-Cadence-Minutes', String(collectionCadenceMinutes))
      reply.header('X-Export-Cadence-Minutes', String(exportCadenceMinutes))
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

  // Public embed endpoint — no auth, clamped to 30 days, aggressive cache
  app.get('/public/indices/series', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const corridorId = parsed.data.corridor_id
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
      throw new ValidationError('Invalid request', { details: { error: 'invalid_corridor_id', message: 'Corridor ID must be in format: XX-YY-AAA-BBB (e.g., US-MX-USD-MXN)' } })
    }
    const normalizedCorridorId = formatCorridorId({
      sourceCountry: corridorParts.sourceCountry.toUpperCase(),
      destCountry: corridorParts.destCountry.toUpperCase(),
      sourceCurrency: corridorParts.sourceCurrency.toUpperCase(),
      destCurrency: corridorParts.destCurrency.toUpperCase(),
    })
    const amountBucket = parsed.data.amount_bucket ?? DEFAULT_AMOUNT_BUCKET
    const methodProfile = parsed.data.method_profile ?? 'standard_bank'
    const requestedWindowDays = Math.min(Math.max(parsed.data.days ?? 30, 1), 30) // Clamped to 30 days max for public access

    const tierInfo = getDataTierForCorridor(normalizedCorridorId, 2)
    const { tier: dataTier, cadenceMinutes: exportCadenceMinutes, collectionTier, isUsdOrigin } = tierInfo
    const collectionCadenceMinutes = getCollectionCadenceMinutes(collectionTier)

    try {
      const publicCacheKey = `public:${normalizedCorridorId}:${amountBucket}:${methodProfile}:${requestedWindowDays}`
      const cached = await indicesCache.get(publicCacheKey)
      if (cached) {
        reply.header('X-Data-Tier', String(dataTier))
        reply.header('X-Cache', 'HIT')
        reply.header('Cache-Control', 'public, max-age=600')
        return cached
      }

      const availabilityRow = await goldIndicesRepository.getAvailability({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
      })
      const minDate = availabilityRow?.min_date ? new Date(availabilityRow.min_date) : null
      const maxDate = availabilityRow?.max_date ? new Date(availabilityRow.max_date) : null
      const availableDays = (minDate && maxDate)
        ? Math.max(1, Math.floor((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
        : null

      const now = new Date()
      const effectiveEndDate = (maxDate && maxDate < now) ? maxDate : now
      const effectiveWindowDays = availableDays && availableDays > 0
        ? Math.min(requestedWindowDays, availableDays)
        : requestedWindowDays

      const startDate = new Date(effectiveEndDate)
      startDate.setUTCDate(startDate.getUTCDate() - (effectiveWindowDays - 1))
      if (minDate && startDate < minDate) {
        startDate.setTime(minDate.getTime())
      }

      const rows = await goldIndicesRepository.getIndicesSeries({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        startDate,
        endDate: effectiveEndDate,
      })

      if (rows.length === 0) {
        reply.code(404)
        return {
          corridorId: normalizedCorridorId,
          dataAvailable: false,
          reason: 'no_data',
          message: `No data available for ${normalizedCorridorId} in the requested time range.`,
        }
      }

      const lastUpdated = rows.reduce<Date | null>((latest, row) => {
        if (!row.created_at) return latest
        if (!latest || row.created_at > latest) return row.created_at
        return latest
      }, null)

      const weightingModel = rows.find((row) => row.weighting_model)?.weighting_model || DEFAULT_WEIGHT_MODEL
      const methodologyVersion = rows.find((row) => row.methodology_version)?.methodology_version || INDICES_METHODOLOGY_VERSION

      const response: IndicesSeriesResponse = {
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        weightingModel,
        methodologyVersion,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
        dataTier,
        cadenceMinutes: collectionCadenceMinutes,
        exportCadenceMinutes,
        collectionCadenceMinutes,
        collectionTier,
        isUsdOrigin,
        series: rows.map((row) => ({
          date: row.date instanceof Date ? toDateOnly(row.date) : String(row.date),
          teer: row.teer_rate ?? null,
          rci: row.rci_ratio ?? null,
          rvi_bps: row.rvi_bps ?? null,
          providerCountBinned: row.provider_count_binned ?? null,
          providerCount: row.provider_count ?? null,
          suppressionFlag: row.suppression_flag,
          suppressionReason: row.suppression_reason ?? null,
          midMarketRate: row.mid_market_rate ?? null,
          weightConfidence: row.weight_confidence ?? null,
          weightWindowDays: row.weight_window_days ?? null,
        })),
        dataWindow: {
          requestedDays: requestedWindowDays,
          availableDays,
          availableStartDate: minDate ? toDateOnly(minDate) : null,
          availableEndDate: maxDate ? toDateOnly(maxDate) : null,
          startDate: toDateOnly(startDate),
          endDate: toDateOnly(effectiveEndDate),
          returnedDays: rows.length,
          capped: Boolean(availableDays && availableDays < requestedWindowDays),
        },
      }

      // 10-minute cache for public endpoint
      await indicesCache.set(publicCacheKey, response, 10 * 60 * 1000)
      reply.header('X-Data-Tier', String(dataTier))
      reply.header('X-Cache', 'MISS')
      reply.header('Cache-Control', 'public, max-age=600')
      return response
    } catch (error) {
      logger.error('public_indices_series_failed', {
        corridor_id: normalizedCorridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to retrieve index data.' }
    }
  })

  app.post('/indices/embed-snapshots', { preHandler: requireEntitlement('pulse_full') }, async (request, reply) => {
    const parsed = embedSnapshotBodySchema.safeParse(request.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const corridorId = parsed.data.corridor_id
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
      throw new ValidationError('Invalid request', {
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
    const amountBucket = parsed.data.amount_bucket ?? DEFAULT_AMOUNT_BUCKET
    const methodProfile = parsed.data.method_profile ?? 'standard_bank'
    const requestedWindowDays = Math.min(Math.max(parsed.data.days ?? 30, 1), 365)

    const tierInfo = getDataTierForCorridor(normalizedCorridorId, 2)
    const { tier: dataTier, cadenceMinutes: exportCadenceMinutes, collectionTier, isUsdOrigin } = tierInfo
    const collectionCadenceMinutes = getCollectionCadenceMinutes(collectionTier)

    try {
      const existsResult = await query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM gold_export.cdp_daily WHERE corridor_id = $1 LIMIT 1`,
        [normalizedCorridorId],
        planeAPool,
      )
      const corridorTracked = (existsResult.rows[0]?.count ?? 0) > 0
      if (!corridorTracked) {
        reply.code(404)
        return {
          error: 'corridor_not_tracked',
          message: `Corridor ${normalizedCorridorId} is not available in Gold export.`,
        }
      }

      const availabilityRow = await goldIndicesRepository.getAvailability({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
      })
      const minDate = availabilityRow?.min_date ? new Date(availabilityRow.min_date) : null
      const maxDate = availabilityRow?.max_date ? new Date(availabilityRow.max_date) : null
      const availableDays = (minDate && maxDate)
        ? Math.max(1, Math.floor((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
        : null

      const now = new Date()
      const effectiveEndDate = (maxDate && maxDate < now) ? maxDate : now
      const effectiveWindowDays = availableDays && availableDays > 0
        ? Math.min(requestedWindowDays, availableDays)
        : requestedWindowDays

      const startDate = new Date(effectiveEndDate)
      startDate.setUTCDate(startDate.getUTCDate() - (effectiveWindowDays - 1))
      if (minDate && startDate < minDate) {
        startDate.setTime(minDate.getTime())
      }

      const rows = await goldIndicesRepository.getIndicesSeries({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        startDate,
        endDate: effectiveEndDate,
      })

      if (rows.length === 0) {
        reply.code(404)
        return {
          error: 'no_data',
          message: `No data available for ${normalizedCorridorId} in the requested time range.`,
        }
      }

      const lastUpdated = rows.reduce<Date | null>((latest, row) => {
        if (!row.created_at) return latest
        if (!latest || row.created_at > latest) return row.created_at
        return latest
      }, null)

      const weightingModel = rows.find((row) => row.weighting_model)?.weighting_model || DEFAULT_WEIGHT_MODEL
      const methodologyVersion = rows.find((row) => row.methodology_version)?.methodology_version || INDICES_METHODOLOGY_VERSION
      const createdAt = new Date().toISOString()
      const expiresAt = new Date(Date.now() + INDICES_EMBED_SNAPSHOT_TTL_MS).toISOString()
      const snapshotId = randomUUID().replace(/-/g, '')

      const snapshot: IndicesEmbedSnapshotResponse = {
        snapshotId,
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        weightingModel,
        methodologyVersion,
        weightConfidence: rows.at(-1)?.weight_confidence ?? null,
        weightWindowDays: rows.at(-1)?.weight_window_days ?? null,
        lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
        dataTier,
        cadenceMinutes: collectionCadenceMinutes,
        exportCadenceMinutes,
        collectionCadenceMinutes,
        collectionTier,
        isUsdOrigin,
        series: rows.map((row) => ({
          date: row.date instanceof Date ? toDateOnly(row.date) : String(row.date),
          teer: row.teer_rate ?? null,
          rci: row.rci_ratio ?? null,
          rvi_bps: row.rvi_bps ?? null,
          providerCountBinned: row.provider_count_binned ?? null,
          providerCount: row.provider_count ?? null,
          suppressionFlag: row.suppression_flag,
          suppressionReason: row.suppression_reason ?? null,
          midMarketRate: row.mid_market_rate ?? null,
          weightConfidence: row.weight_confidence ?? null,
          weightWindowDays: row.weight_window_days ?? null,
        })),
        dataWindow: {
          requestedDays: requestedWindowDays,
          availableDays,
          availableStartDate: minDate ? toDateOnly(minDate) : null,
          availableEndDate: maxDate ? toDateOnly(maxDate) : null,
          startDate: toDateOnly(startDate),
          endDate: toDateOnly(effectiveEndDate),
          returnedDays: rows.length,
          capped: Boolean(availableDays && availableDays < requestedWindowDays),
        },
        createdAt,
        expiresAt,
      }

      await indicesEmbedSnapshotCache.set(snapshotId, snapshot, INDICES_EMBED_SNAPSHOT_TTL_MS)

      return {
        success: true,
        snapshotId,
        createdAt,
        expiresAt,
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        returnedDays: rows.length,
      }
    } catch (error) {
      logger.error('indices_embed_snapshot_create_failed', {
        corridor_id: normalizedCorridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to create embed snapshot.' }
    }
  })

  app.get('/public/indices/embed-snapshots/:snapshotId', async (request, reply) => {
    const snapshotId = String((request.params as { snapshotId?: string }).snapshotId || '').trim()
    if (!embedSnapshotIdPattern.test(snapshotId)) {
      throw new ValidationError('Invalid request', {
        details: {
          error: 'invalid_snapshot_id',
        },
      })
    }

    const snapshot = await indicesEmbedSnapshotCache.get(snapshotId)
    if (!snapshot) {
      reply.code(404)
      return {
        error: 'not_found',
        message: 'Embed snapshot not found or expired.',
      }
    }

    reply.header('Cache-Control', 'public, max-age=300')
    return snapshot
  })

  app.get('/indices/latest', apiAccessGuard ? { preHandler: apiAccessGuard } : {}, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const corridorId = parsed.data.corridor_id
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
            throw new ValidationError('Invalid request', { details: { error: 'invalid_corridor_id', message: 'Corridor ID must be in format: XX-YY-AAA-BBB (e.g., US-MX-USD-MXN)' } })
    }
    const normalizedCorridorId = formatCorridorId({
      sourceCountry: corridorParts.sourceCountry.toUpperCase(),
      destCountry: corridorParts.destCountry.toUpperCase(),
      sourceCurrency: corridorParts.sourceCurrency.toUpperCase(),
      destCurrency: corridorParts.destCurrency.toUpperCase(),
    })
    const amountBucket = parsed.data.amount_bucket ?? DEFAULT_AMOUNT_BUCKET
    const methodProfile = parsed.data.method_profile ?? 'standard_bank'

    const tierInfo = getDataTierForCorridor(normalizedCorridorId, 2)
    const { tier: dataTier, cadenceMinutes: exportCadenceMinutes, collectionTier, isUsdOrigin } =
      tierInfo
    const collectionCadenceMinutes = getCollectionCadenceMinutes(collectionTier)

    try {
      const latest = await goldIndicesRepository.getIndicesLatest({
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
      })

      if (!latest) {
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
            ? `No data available for ${normalizedCorridorId} with amount_bucket=${amountBucket} and method_profile=${methodProfile}.`
            : `Corridor ${normalizedCorridorId} is not currently tracked. Contact support to request coverage.`,
          dataTier,
          cadenceMinutes: collectionCadenceMinutes,
          exportCadenceMinutes,
          collectionCadenceMinutes,
          collectionTier,
          isUsdOrigin,
          dataWindow: {
            requestedDays: 1,
            availableDays: null,
            returnedDays: 0,
            availableStartDate: null,
            availableEndDate: null,
            startDate: toDateOnly(new Date()),
            endDate: toDateOnly(new Date()),
            capped: false,
          },
        }

        reply.header('X-Data-Tier', String(dataTier))
        reply.header('X-Data-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Collection-Cadence-Minutes', String(collectionCadenceMinutes))
        reply.header('X-Export-Cadence-Minutes', String(exportCadenceMinutes))
        reply.header('X-Collection-Tier', collectionTier)
        reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
        reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
        reply.code(corridorExists ? 200 : 404)
        return response
      }

      const weightingModel = latest.weighting_model || DEFAULT_WEIGHT_MODEL
      const methodologyVersion = latest.methodology_version || INDICES_METHODOLOGY_VERSION
      const response: IndicesLatestResponse = {
        corridorId: normalizedCorridorId,
        amountBucket,
        methodProfile,
        weightingModel,
        methodologyVersion,
        weightConfidence: latest.weight_confidence ?? null,
        weightWindowDays: latest.weight_window_days ?? null,
        lastUpdated: latest.created_at ? latest.created_at.toISOString() : null,
        dataTier,
        cadenceMinutes: collectionCadenceMinutes,
        exportCadenceMinutes,
        collectionCadenceMinutes,
        collectionTier,
        isUsdOrigin,
        point: {
          date: latest.date instanceof Date ? toDateOnly(latest.date) : String(latest.date),
          teer: latest.teer_rate ?? null,
          rci: latest.rci_ratio ?? null,
          rvi_bps: latest.rvi_bps ?? null,
          providerCountBinned: latest.provider_count_binned ?? null,
          providerCount: latest.provider_count ?? null,
          suppressionFlag: latest.suppression_flag,
          suppressionReason: latest.suppression_reason ?? null,
          midMarketRate: latest.mid_market_rate ?? null,
          weightConfidence: latest.weight_confidence ?? null,
          weightWindowDays: latest.weight_window_days ?? null,
        },
      }

      reply.header('X-Data-Tier', String(dataTier))
      reply.header('X-Data-Cadence-Minutes', String(collectionCadenceMinutes))
      reply.header('X-Collection-Cadence-Minutes', String(collectionCadenceMinutes))
      reply.header('X-Export-Cadence-Minutes', String(exportCadenceMinutes))
      reply.header('X-Collection-Tier', collectionTier)
      reply.header('X-Corridor-Origin', corridorParts.sourceCountry.toUpperCase())
      reply.header('X-USD-Origin', isUsdOrigin ? '1' : '0')
      return response
    } catch (error) {
      logger.error('indices_latest_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to retrieve latest index data.' }
    }
  })

  app.get('/indices/corridors', apiAccessGuard ? { preHandler: apiAccessGuard } : {}, async (request, reply) => {
    try {
      const corridorsAllowed = request.institutionalClient?.corridors_allowed ?? null
      const filterByAllowed = corridorsAllowed !== null

      const whereClause = filterByAllowed
        ? 'WHERE amount_bucket = $1 AND corridor_id = ANY($2::text[])'
        : 'WHERE amount_bucket = $1'
      const params = filterByAllowed
        ? [DEFAULT_AMOUNT_BUCKET, corridorsAllowed]
        : [DEFAULT_AMOUNT_BUCKET]

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
         ${whereClause}
         GROUP BY corridor_id
         ORDER BY corridor_id`,
        params,
        planeAPool,
      )

      const corridors = result.rows.map((row) => {
        const tierInfo = getDataTierForCorridor(row.corridor_id, 2)
        const collectionCadenceMinutes = getCollectionCadenceMinutes(tierInfo.collectionTier)
        const exportCadenceMinutes = tierInfo.cadenceMinutes
        return {
          corridorId: row.corridor_id,
          sourceCountry: row.source_country,
          destCountry: row.dest_country,
          sourceCurrency: row.source_currency,
          destCurrency: row.dest_currency,
          dataTier: tierInfo.tier,
          cadenceMinutes: collectionCadenceMinutes,
          exportCadenceMinutes,
          collectionCadenceMinutes,
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
        note: 'Tier 2 export includes ALL corridors (Tier 1 is a subset of Tier 2; Tier 2 is not a subset of Tier 1). collectionCadenceMinutes reflects actual scrape cadence (10/180). exportCadenceMinutes reflects Tier 2 SLA (3 hours) for the API.',
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

  app.get('/indices/triangulated/:corridorId', apiAccessGuard ? { preHandler: apiAccessGuard } : {}, async (request, reply) => {
    const { corridorId } = request.params as { corridorId: string }
    const qs = request.query as {
      amount_bucket?: string
      method_profile?: string
      as_of?: string
      methodology?: string
    }

    const amountBucket = Number(qs.amount_bucket ?? DEFAULT_AMOUNT_BUCKET)
    if (!Number.isFinite(amountBucket) || amountBucket <= 0) {
      throw new ValidationError('Invalid amount_bucket', { details: { error: 'bad_request' } })
    }

    const methodProfile = qs.method_profile ?? 'bank_transfer:bank_deposit'
    const asOf = qs.as_of ?? new Date().toISOString().slice(0, 10)
    const methodology = qs.methodology ?? 'triangulation_v1'

    const result = await query<{
      corridor_id: string
      amount_bucket: number
      method_profile: string
      date: string
      leg1_corridor: string
      leg2_corridor: string
      leg1_teer: number | null
      leg2_teer: number | null
      triangulated_teer: number | null
      triangulated_rci: number | null
      stress_score: number | null
      confidence: string
      methodology_version: string
      created_at: Date
    }>(
      `SELECT * FROM gold_export.triangulated_index
       WHERE corridor_id = $1
         AND amount_bucket = $2
         AND method_profile = $3
         AND date <= $4
         AND methodology_version = $5
       ORDER BY date DESC
       LIMIT 30`,
      [corridorId, amountBucket, methodProfile, asOf, methodology],
      planeAPool,
    )

    return {
      corridorId,
      amountBucket,
      methodProfile,
      methodology,
      asOf,
      series: result.rows.map((r) => ({
        date: r.date,
        leg1Corridor: r.leg1_corridor,
        leg2Corridor: r.leg2_corridor,
        leg1Teer: r.leg1_teer,
        leg2Teer: r.leg2_teer,
        triangulatedTeer: r.triangulated_teer,
        triangulatedRci: r.triangulated_rci,
        stressScore: r.stress_score,
        confidence: r.confidence,
      })),
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
