import type { Pool } from 'pg'
import { createPool, query } from '../shared/db'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { config } from '../shared/config'
import {
  DEFAULT_WEIGHT_MODEL,
  GLOBAL_WEIGHT_CORRIDOR_ID,
} from '../shared/weighting-model'

const logger = createLogger('script.provider-weighting-job')
initTracing('provider-weighting-job')

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = Math.max(60, toNumber(process.env.PROVIDER_WEIGHT_LOCK_TTL_SECONDS, 900))
const lookbackDays = Math.max(1, toNumber(process.env.PROVIDER_WEIGHT_WINDOW_DAYS, 30))
const minDays = Math.max(1, toNumber(process.env.PROVIDER_WEIGHT_MIN_DAYS, 3))
const minProviders = Math.max(1, toNumber(process.env.PROVIDER_WEIGHT_MIN_PROVIDERS, 3))
const minQuotes = Math.max(1, toNumber(process.env.PROVIDER_WEIGHT_MIN_QUOTES, 500))
const alpha = Math.max(0, toNumber(process.env.PROVIDER_WEIGHT_ALPHA, 0.4))
const beta = Math.max(0, toNumber(process.env.PROVIDER_WEIGHT_BETA, 0.4))
const gamma = Math.max(0, toNumber(process.env.PROVIDER_WEIGHT_GAMMA, 0.2))
const halfLifeMinutes = Math.max(1, toNumber(process.env.PROVIDER_WEIGHT_DECAY_HALF_LIFE_MINUTES, 180))
const weightModel = process.env.PROVIDER_WEIGHT_MODEL || DEFAULT_WEIGHT_MODEL
const decayLambda = Math.log(2) / halfLifeMinutes

const providerStatsQuery = `
WITH base AS (
  SELECT
    qr.corridor_id,
    lower(qr.provider_id) AS provider_id,
    qr.implied_fx_rate::double precision AS rate,
    qr.collected_at
  FROM silver.quote_record qr
  JOIN silver.ingestion_run ir
    ON ir.run_id = qr.ingestion_run_id
  JOIN silver.rights_matrix rm
    ON rm.provider_id = qr.provider_id
  JOIN silver.provider_corridor_capability pcc
    ON pcc.provider_id = qr.provider_id
   AND pcc.corridor_id = qr.corridor_id
  WHERE qr.status = 'ok'
    AND qr.implied_fx_rate IS NOT NULL
    AND qr.implied_fx_rate > 0
    AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
    AND ir.collector_type LIKE 'b2b_%'
    AND ir.status = 'success'
    AND pcc.is_supported = true
    AND rm.allowed_collect = true
    AND rm.allowed_b2b = true
    AND rm.allowed_resell_b2b = true
    AND rm.status = 'production'
    AND rm.stoplist_status = 'active'
    AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)
),
corridor_stats AS (
  SELECT
    corridor_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY rate)::double precision AS median_rate,
    stddev_pop(rate)::double precision AS std_rate,
    COUNT(*)::int AS quote_count,
    COUNT(DISTINCT provider_id)::int AS provider_count,
    MIN(collected_at) AS min_ts,
    MAX(collected_at) AS max_ts
  FROM base
  GROUP BY corridor_id
),
provider_stats AS (
  SELECT
    corridor_id,
    provider_id,
    AVG(rate)::double precision AS avg_rate,
    COUNT(*)::int AS provider_quotes,
    MAX(collected_at) AS last_collected,
    COUNT(DISTINCT date_trunc('hour', collected_at))::int AS active_hours
  FROM base
  GROUP BY corridor_id, provider_id
)
SELECT
  ps.corridor_id,
  ps.provider_id,
  ps.avg_rate,
  ps.provider_quotes,
  ps.last_collected,
  ps.active_hours,
  cs.median_rate,
  cs.std_rate,
  cs.quote_count,
  cs.provider_count,
  cs.min_ts,
  cs.max_ts
FROM provider_stats ps
JOIN corridor_stats cs
  ON cs.corridor_id = ps.corridor_id
`

const globalStatsQuery = `
WITH base AS (
  SELECT
    lower(qr.provider_id) AS provider_id,
    qr.implied_fx_rate::double precision AS rate,
    qr.collected_at
  FROM silver.quote_record qr
  JOIN silver.ingestion_run ir
    ON ir.run_id = qr.ingestion_run_id
  JOIN silver.rights_matrix rm
    ON rm.provider_id = qr.provider_id
  JOIN silver.provider_corridor_capability pcc
    ON pcc.provider_id = qr.provider_id
   AND pcc.corridor_id = qr.corridor_id
  WHERE qr.status = 'ok'
    AND qr.implied_fx_rate IS NOT NULL
    AND qr.implied_fx_rate > 0
    AND qr.collected_at >= NOW() - ($1 * INTERVAL '1 day')
    AND ir.collector_type LIKE 'b2b_%'
    AND ir.status = 'success'
    AND pcc.is_supported = true
    AND rm.allowed_collect = true
    AND rm.allowed_b2b = true
    AND rm.allowed_resell_b2b = true
    AND rm.status = 'production'
    AND rm.stoplist_status = 'active'
    AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)
),
global_stats AS (
  SELECT
    percentile_cont(0.5) WITHIN GROUP (ORDER BY rate)::double precision AS median_rate,
    stddev_pop(rate)::double precision AS std_rate,
    COUNT(*)::int AS quote_count,
    COUNT(DISTINCT provider_id)::int AS provider_count,
    MIN(collected_at) AS min_ts,
    MAX(collected_at) AS max_ts
  FROM base
),
global_provider AS (
  SELECT
    provider_id,
    AVG(rate)::double precision AS avg_rate,
    COUNT(*)::int AS provider_quotes,
    MAX(collected_at) AS last_collected,
    COUNT(DISTINCT date_trunc('hour', collected_at))::int AS active_hours
  FROM base
  GROUP BY provider_id
)
SELECT
  gp.provider_id,
  gp.avg_rate,
  gp.provider_quotes,
  gp.last_collected,
  gp.active_hours,
  gs.median_rate,
  gs.std_rate,
  gs.quote_count,
  gs.provider_count,
  gs.min_ts,
  gs.max_ts
FROM global_provider gp
CROSS JOIN global_stats gs
`

type ProviderStatRow = {
  corridor_id: string
  provider_id: string
  avg_rate: number | null
  provider_quotes: number
  last_collected: Date | string | null
  active_hours: number
  median_rate: number | null
  std_rate: number | null
  quote_count: number
  provider_count: number
  min_ts: Date | string | null
  max_ts: Date | string | null
}

type GlobalStatRow = {
  provider_id: string
  avg_rate: number | null
  provider_quotes: number
  last_collected: Date | string | null
  active_hours: number
  median_rate: number | null
  std_rate: number | null
  quote_count: number
  provider_count: number
  min_ts: Date | string | null
  max_ts: Date | string | null
}

type CorridorMeta = {
  quoteCount: number
  providerCount: number
  windowDays: number
  weightConfidence: number
  availableHours: number
}

const toDate = (value: Date | string | null): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const computeWindowDays = (minTs: Date | null, maxTs: Date | null) => {
  if (!minTs || !maxTs) return 0
  const deltaMs = Math.max(0, maxTs.getTime() - minTs.getTime())
  return Math.max(1, Math.ceil(deltaMs / (24 * 60 * 60 * 1000)))
}

const computeAvailableHours = (minTs: Date | null, maxTs: Date | null) => {
  if (!minTs || !maxTs) return 1
  const deltaMs = Math.max(0, maxTs.getTime() - minTs.getTime())
  return Math.max(1, deltaMs / (60 * 60 * 1000))
}

const computeConfidence = (windowDays: number, quoteCount: number, providerCount: number) => {
  if (windowDays < minDays || providerCount < minProviders) return 0
  const windowFactor = Math.min(1, windowDays / lookbackDays)
  const quoteFactor = Math.min(1, quoteCount / minQuotes)
  return Math.max(0, Math.min(1, windowFactor * quoteFactor))
}

const computeTierMultiplier = (persistence: number) => {
  if (persistence >= 0.9) return 1.5
  if (persistence >= 0.6) return 1.0
  return 0.5
}

const computeWeightRaw = (options: {
  avgRate: number | null
  medianRate: number | null
  stdRate: number | null
  providerQuotes: number
  availableHours: number
  ageMinutes: number
  tierMultiplier: number
}) => {
  const {
    avgRate,
    medianRate,
    stdRate,
    providerQuotes,
    availableHours,
    ageMinutes,
    tierMultiplier,
  } = options
  const frequency = availableHours > 0 ? providerQuotes / availableHours : providerQuotes
  const frequencyScore = Math.max(1e-6, Math.log1p(Math.max(0, frequency)))
  let zScore = 0
  if (
    avgRate !== null &&
    medianRate !== null &&
    stdRate !== null &&
    Number.isFinite(stdRate) &&
    stdRate > 0
  ) {
    zScore = (avgRate - medianRate) / stdRate
  }
  const spreadScore = Math.exp(-0.5 * zScore * zScore)
  const recencyScore = Math.exp(-decayLambda * Math.max(0, ageMinutes))
  return Math.pow(frequencyScore, alpha) *
    Math.pow(spreadScore, beta) *
    Math.pow(recencyScore, gamma) *
    tierMultiplier
}

const buildUpsertPayload = (rows: {
  corridorId: string
  providerId: string
  weight: number
  windowDays: number
  quoteCount: number
  providerCount: number
  weightConfidence: number
}[]) => {
  const now = new Date()
  const corridorIds: string[] = []
  const providerIds: string[] = []
  const weights: number[] = []
  const modelVersions: string[] = []
  const windowDays: number[] = []
  const quoteCounts: number[] = []
  const providerCounts: number[] = []
  const confidences: number[] = []
  const computedAts: Date[] = []

  for (const row of rows) {
    corridorIds.push(row.corridorId)
    providerIds.push(row.providerId)
    weights.push(row.weight)
    modelVersions.push(weightModel)
    windowDays.push(row.windowDays)
    quoteCounts.push(row.quoteCount)
    providerCounts.push(row.providerCount)
    confidences.push(row.weightConfidence)
    computedAts.push(now)
  }

  return {
    corridorIds,
    providerIds,
    weights,
    modelVersions,
    windowDays,
    quoteCounts,
    providerCounts,
    confidences,
    computedAts,
  }
}

const upsertWeights = async (pool: Pool, rows: {
  corridorId: string
  providerId: string
  weight: number
  windowDays: number
  quoteCount: number
  providerCount: number
  weightConfidence: number
}[]) => {
  if (rows.length === 0) return 0
  const payload = buildUpsertPayload(rows)
  const result = await query<{ upserted: number }>(
    `WITH upserted AS (
      INSERT INTO gold.provider_weight_snapshot (
        corridor_id,
        provider_id,
        method_profile,
        weight,
        model_version,
        window_days,
        quote_count,
        provider_count,
        weight_confidence,
        computed_at
      )
      SELECT
        corridor_id,
        provider_id,
        NULL::method_profile,
        weight,
        model_version,
        window_days,
        quote_count,
        provider_count,
        weight_confidence,
        computed_at
      FROM UNNEST(
        $1::text[],
        $2::text[],
        $3::double precision[],
        $4::text[],
        $5::int[],
        $6::int[],
        $7::int[],
        $8::double precision[],
        $9::timestamptz[]
      ) AS t(
        corridor_id,
        provider_id,
        weight,
        model_version,
        window_days,
        quote_count,
        provider_count,
        weight_confidence,
        computed_at
      )
      ON CONFLICT (corridor_id, provider_id, model_version, method_profile)
      DO UPDATE SET
        weight = EXCLUDED.weight,
        window_days = EXCLUDED.window_days,
        quote_count = EXCLUDED.quote_count,
        provider_count = EXCLUDED.provider_count,
        weight_confidence = EXCLUDED.weight_confidence,
        computed_at = EXCLUDED.computed_at
      RETURNING 1
    )
    SELECT COUNT(*)::int AS upserted FROM upserted`,
    [
      payload.corridorIds,
      payload.providerIds,
      payload.weights,
      payload.modelVersions,
      payload.windowDays,
      payload.quoteCounts,
      payload.providerCounts,
      payload.confidences,
      payload.computedAts,
    ],
    pool,
  )
  return result.rows[0]?.upserted ?? 0
}

export const runProviderWeightingJob = async (): Promise<void> => {
  const pool = createPool(config.db.planeCUrl)
  const lock = new WorkerLock('provider-weighting-job', lockTtlSeconds)
  const { isShutdownRequested } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
    onShutdown: async () => {
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', { error: error instanceof Error ? error.message : String(error) })
      })
      await pool.end()
    },
  })

  const lockOk = await lock.acquire()
  if (!lockOk) {
    logger.warn('lock_not_acquired', { lock: 'provider-weighting-job' })
    await pool.end()
    return
  }

  const start = Date.now()
  let success = false
  let upserted = 0
  try {
    const providerResult = await query<ProviderStatRow>(providerStatsQuery, [lookbackDays], pool)
    const globalResult = await query<GlobalStatRow>(globalStatsQuery, [lookbackDays], pool)
    const providerRows = providerResult.rows
    const globalRows = globalResult.rows

    if (providerRows.length === 0 || globalRows.length === 0) {
      logger.warn('no_weight_data', {
        provider_rows: providerRows.length,
        global_rows: globalRows.length,
      })
      return
    }

    const globalMetaRow = globalRows[0]
    const globalMin = toDate(globalMetaRow.min_ts)
    const globalMax = toDate(globalMetaRow.max_ts)
    const globalWindowDays = computeWindowDays(globalMin, globalMax)
    const globalAvailableHours = computeAvailableHours(globalMin, globalMax)
    const globalQuoteCount = globalMetaRow.quote_count
    const globalProviderCount = globalMetaRow.provider_count
    const globalConfidence = computeConfidence(globalWindowDays, globalQuoteCount, globalProviderCount)

    const tierMultiplierByProvider = new Map<string, number>()
    for (const row of globalRows) {
      const persistence = globalAvailableHours > 0 ? row.active_hours / globalAvailableHours : 0
      tierMultiplierByProvider.set(row.provider_id, computeTierMultiplier(persistence))
    }

    const globalWeightsRaw = new Map<string, number>()
    for (const row of globalRows) {
      const lastCollected = toDate(row.last_collected)
      const ageMinutes = lastCollected ? (Date.now() - lastCollected.getTime()) / 60000 : halfLifeMinutes
      const tierMultiplier = tierMultiplierByProvider.get(row.provider_id) ?? 1
      const raw = computeWeightRaw({
        avgRate: row.avg_rate,
        medianRate: row.median_rate,
        stdRate: row.std_rate,
        providerQuotes: row.provider_quotes,
        availableHours: globalAvailableHours,
        ageMinutes,
        tierMultiplier,
      })
      globalWeightsRaw.set(row.provider_id, raw)
    }
    const globalRawSum = Array.from(globalWeightsRaw.values()).reduce((a, b) => a + b, 0)
    const globalWeights = new Map<string, number>()
    for (const [providerId, raw] of globalWeightsRaw.entries()) {
      const normalized = globalRawSum > 0 ? raw / globalRawSum : 1 / globalWeightsRaw.size
      globalWeights.set(providerId, normalized)
    }

    const corridors = new Map<string, { meta: CorridorMeta; rows: ProviderStatRow[] }>()
    for (const row of providerRows) {
      const minTs = toDate(row.min_ts)
      const maxTs = toDate(row.max_ts)
      const windowDays = Math.min(lookbackDays, computeWindowDays(minTs, maxTs))
      const availableHours = computeAvailableHours(minTs, maxTs)
      const meta: CorridorMeta = {
        quoteCount: row.quote_count,
        providerCount: row.provider_count,
        windowDays,
        weightConfidence: computeConfidence(windowDays, row.quote_count, row.provider_count),
        availableHours,
      }
      const entry = corridors.get(row.corridor_id)
      if (!entry) {
        corridors.set(row.corridor_id, { meta, rows: [row] })
      } else {
        entry.rows.push(row)
      }
    }

    const rowsToUpsert: {
      corridorId: string
      providerId: string
      weight: number
      windowDays: number
      quoteCount: number
      providerCount: number
      weightConfidence: number
    }[] = []

    for (const [corridorId, entry] of corridors.entries()) {
      if (isShutdownRequested()) break
      const { meta, rows } = entry
      const rawWeights = new Map<string, number>()
      for (const row of rows) {
        const lastCollected = toDate(row.last_collected)
        const ageMinutes = lastCollected ? (Date.now() - lastCollected.getTime()) / 60000 : halfLifeMinutes
        const tierMultiplier = tierMultiplierByProvider.get(row.provider_id) ?? 1
        const raw = computeWeightRaw({
          avgRate: row.avg_rate,
          medianRate: row.median_rate,
          stdRate: row.std_rate,
          providerQuotes: row.provider_quotes,
          availableHours: meta.availableHours,
          ageMinutes,
          tierMultiplier,
        })
        rawWeights.set(row.provider_id, raw)
      }
      const rawSum = Array.from(rawWeights.values()).reduce((a, b) => a + b, 0)
      const normalizedFallback = rawWeights.size > 0 ? 1 / rawWeights.size : 1
      for (const [providerId, raw] of rawWeights.entries()) {
        const normalized = rawSum > 0 ? raw / rawSum : normalizedFallback
        rowsToUpsert.push({
          corridorId,
          providerId,
          weight: normalized,
          windowDays: meta.windowDays,
          quoteCount: meta.quoteCount,
          providerCount: meta.providerCount,
          weightConfidence: meta.weightConfidence,
        })
      }
    }

    for (const [providerId, weight] of globalWeights.entries()) {
      rowsToUpsert.push({
        corridorId: GLOBAL_WEIGHT_CORRIDOR_ID,
        providerId,
        weight,
        windowDays: Math.min(lookbackDays, globalWindowDays),
        quoteCount: globalQuoteCount,
        providerCount: globalProviderCount,
        weightConfidence: globalConfidence,
      })
    }

    upserted = await upsertWeights(pool, rowsToUpsert)
    success = true
    logger.info('provider_weights_upserted', {
      model_version: weightModel,
      corridors: corridors.size,
      rows: rowsToUpsert.length,
      upserted,
    })
  } catch (error) {
    logger.error('provider_weighting_job_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    const durationSeconds = (Date.now() - start) / 1000
    await recordBatchJobMetric('provider-weighting-job', success ? 'job_complete' : 'job_failure', durationSeconds, {
      model_version: weightModel,
      rows_upserted: String(upserted),
    })
    await lock.release().catch((releaseError) => {
      logger.warn('lock_release_failed', {
        error: releaseError instanceof Error ? releaseError.message : String(releaseError),
      })
    })
    await pool.end()
  }
}

if (require.main === module) {
  runProviderWeightingJob().catch((error) => {
    logger.error('provider_weighting_job_fatal', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
  })
}
