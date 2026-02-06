import type { FastifyInstance } from 'fastify'

import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { parseCorridorId } from '../../../shared/corridor'
import { recordRequest } from '../../../shared/api-metrics'
import { getErrorMessage, getErrorStack } from '../types/errors'

const logger = createLogger('plane-a.pulse-teaser')
const planeAPool = getPool(config.db.planeAUrl)

type PulseTeaserMover = {
  corridorId: string
  fromCountry: string
  toCountry: string
  sendCurrency: string
  recvCurrency: string
  currentAvgRate: number
  prevAvgRate: number
  deltaPct: number
  providerCount: number
  timestampBucket: string
}

type PulseTeaserResponse = {
  success: true
  updatedAt: string | null
  windowHours: number
  movers: PulseTeaserMover[]
}

const WINDOW_HOURS = 24
const DEFAULT_LIMIT = 6

const toIso = (value: unknown): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value as any)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const safeNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export const pulseTeaserRoutes = async (app: FastifyInstance) => {
  app.get('/pulse/teaser', async (request, reply): Promise<PulseTeaserResponse | { error: string; message?: string }> => {
    const startTime = Date.now()
    const limitRaw = typeof (request.query as any)?.limit === 'string'
      ? Number((request.query as any).limit)
      : typeof (request.query as any)?.limit === 'number'
        ? Number((request.query as any).limit)
        : null
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(20, Math.floor(limitRaw!))) : DEFAULT_LIMIT

    try {
      // Use the last two 4h buckets per corridor to compute a change signal.
      // Pull 48h to ensure we have a "prev" for most corridors while still being fast.
      const result = await query<{
        corridor_id: string
        current_bucket: Date
        current_avg_rate: unknown
        current_provider_count: number
        prev_avg_rate: unknown | null
      }>(
        `WITH ranked AS (
          SELECT
            corridor_id,
            timestamp_bucket,
            avg_rate,
            provider_count,
            ROW_NUMBER() OVER (PARTITION BY corridor_id ORDER BY timestamp_bucket DESC) AS rn
          FROM gold_export.corridor_rates
          WHERE timestamp_bucket >= NOW() - INTERVAL '48 hours'
        ),
        pivoted AS (
          SELECT
            corridor_id,
            MAX(CASE WHEN rn = 1 THEN timestamp_bucket END) AS current_bucket,
            MAX(CASE WHEN rn = 1 THEN avg_rate END) AS current_avg_rate,
            MAX(CASE WHEN rn = 1 THEN provider_count END) AS current_provider_count,
            MAX(CASE WHEN rn = 2 THEN avg_rate END) AS prev_avg_rate
          FROM ranked
          WHERE rn <= 2
          GROUP BY corridor_id
        )
        SELECT
          corridor_id,
          current_bucket,
          current_avg_rate,
          current_provider_count,
          prev_avg_rate
        FROM pivoted
        WHERE current_bucket IS NOT NULL
          AND current_bucket >= NOW() - INTERVAL '24 hours'`,
        [],
        planeAPool,
      )

      const movers: PulseTeaserMover[] = []

      for (const row of result.rows) {
        const parsed = parseCorridorId(row.corridor_id)
        if (!parsed) continue

        const currentAvg = safeNumber(row.current_avg_rate)
        const prevAvg = safeNumber(row.prev_avg_rate)
        const bucketIso = toIso(row.current_bucket)
        if (!bucketIso || currentAvg === null || prevAvg === null || prevAvg <= 0) continue

        const deltaPct = (currentAvg - prevAvg) / prevAvg
        if (!Number.isFinite(deltaPct)) continue

        movers.push({
          corridorId: row.corridor_id,
          fromCountry: parsed.sourceCountry.toUpperCase(),
          toCountry: parsed.destCountry.toUpperCase(),
          sendCurrency: parsed.sourceCurrency.toUpperCase(),
          recvCurrency: parsed.destCurrency.toUpperCase(),
          currentAvgRate: currentAvg,
          prevAvgRate: prevAvg,
          deltaPct,
          providerCount: row.current_provider_count ?? 0,
          timestampBucket: bucketIso,
        })
      }

      movers.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
      const limited = movers.slice(0, limit)
      const updatedAt = limited.reduce<string | null>((latest, item) => {
        if (!latest) return item.timestampBucket
        return item.timestampBucket > latest ? item.timestampBucket : latest
      }, null)

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/teaser', 200, durationSeconds)

      return {
        success: true,
        updatedAt,
        windowHours: WINDOW_HOURS,
        movers: limited,
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/teaser', 500, durationSeconds)

      logger.error('pulse_teaser_failed', {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to load Pulse teaser.' }
    }
  })
}

