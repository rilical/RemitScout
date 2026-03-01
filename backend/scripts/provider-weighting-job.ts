import type { Pool } from 'pg'
import { createPool, query } from '../shared/db'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { config } from '../shared/config'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import {
  loadModuleCatalog,
  type ModuleCatalogEntry,
  type ModuleVolumePolicy,
  type ModuleVolumeStrategy,
} from '../shared/module-catalog'
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
const defaultWeightModel = process.env.PROVIDER_WEIGHT_MODEL || DEFAULT_WEIGHT_MODEL
const decayLambda = Math.log(2) / halfLifeMinutes

const DEFAULT_FALLBACK_CHAIN: ModuleVolumeStrategy[] = [
  'reported',
  'inferred_proxy',
  'synthetic_seed',
  'equal_weight',
]

const STRATEGY_MODEL_VERSION_DEFAULTS: Record<ModuleVolumeStrategy, string> = {
  synthetic_seed: 'synthetic_seed_v1',
  reported: 'reported_v1',
  inferred_proxy: 'inferred_proxy_v1',
  equal_weight: 'equal_weight_v1',
}

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

const eligibleProvidersByCorridorQuery = `
SELECT
  pcc.corridor_id,
  lower(pcc.provider_id) AS provider_id
FROM silver.provider_corridor_capability pcc
JOIN silver.rights_matrix rm
  ON rm.provider_id = pcc.provider_id
WHERE pcc.is_supported = true
  AND rm.allowed_collect = true
  AND rm.allowed_b2b = true
  AND rm.allowed_resell_b2b = true
  AND rm.status = 'production'
  AND rm.stoplist_status = 'active'
  AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)
`

const eligibleGlobalProvidersQuery = `
SELECT DISTINCT
  lower(rm.provider_id) AS provider_id
FROM silver.rights_matrix rm
WHERE rm.allowed_collect = true
  AND rm.allowed_b2b = true
  AND rm.allowed_resell_b2b = true
  AND rm.status = 'production'
  AND rm.stoplist_status = 'active'
  AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)
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

type EligibleCorridorRow = {
  corridor_id: string
  provider_id: string
}

type EligibleGlobalRow = {
  provider_id: string
}

type CorridorMeta = {
  quoteCount: number
  providerCount: number
  windowDays: number
  weightConfidence: number
  availableHours: number
}

type ResolvedWeight = {
  providerId: string
  rawScore: number
  confidence: number
  modelVersion: string
  strategy: ModuleVolumeStrategy
}

type StrategyAttemptResult =
  | {
      ok: true
      rawScore: number
      confidence: number
      modelVersion: string
    }
  | {
      ok: false
      reason: 'disabled' | 'input_missing' | 'input_stale' | 'invalid_input'
    }

type StrategyContext = {
  policy: ModuleVolumePolicy
  providerId: string
  corridorId: string
  liveScore: number | null
  liveConfidence: number
  equalWeightRaw: number
}

type StrategyResolutionCounters = {
  resolved: Map<string, number>
  fallback: Map<string, number>
  missing: Map<string, number>
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

const clamp01 = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

const dedupeStrategies = (strategies: ModuleVolumeStrategy[]) => {
  const seen = new Set<ModuleVolumeStrategy>()
  const out: ModuleVolumeStrategy[] = []
  for (const strategy of strategies) {
    if (seen.has(strategy)) continue
    seen.add(strategy)
    out.push(strategy)
  }
  return out
}

const modelVersionForStrategy = (
  strategy: ModuleVolumeStrategy,
  policy: ModuleVolumePolicy,
) => {
  if (policy.strategy === strategy && typeof policy.model_version === 'string' && policy.model_version.trim()) {
    return policy.model_version.trim()
  }
  return STRATEGY_MODEL_VERSION_DEFAULTS[strategy]
}

const resolveSeed = (
  policy: ModuleVolumePolicy,
  corridorId: string,
  equalWeightRaw: number,
) => {
  const overrides = policy.synthetic_seed.corridor_overrides || []
  const override = overrides.find((entry) => entry.corridor_id === corridorId)
  const rawWeight = override ? Number(override.weight) : Number(policy.synthetic_seed.default_weight)
  const rawConfidence = override
    ? Number(override.confidence)
    : Number(policy.synthetic_seed.default_confidence)
  const seedWeight = clamp01(rawWeight, equalWeightRaw)
  const seedConfidence = clamp01(rawConfidence, 0.5)
  if (!Number.isFinite(seedWeight)) {
    return null
  }
  return {
    seedWeight,
    seedConfidence,
  }
}

const attemptStrategy = (
  strategy: ModuleVolumeStrategy,
  context: StrategyContext,
): StrategyAttemptResult => {
  if (strategy === 'synthetic_seed') {
    const resolvedSeed = resolveSeed(context.policy, context.corridorId, context.equalWeightRaw)
    if (!resolvedSeed) {
      return { ok: false, reason: 'invalid_input' }
    }
    const { seedWeight, seedConfidence } = resolvedSeed
    if (context.liveScore !== null) {
      const liveConfidence = clamp01(context.liveConfidence, 0)
      const blended = (liveConfidence * context.liveScore) + ((1 - liveConfidence) * seedWeight)
      return {
        ok: true,
        rawScore: Math.max(1e-9, blended),
        confidence: clamp01((liveConfidence + seedConfidence) / 2, seedConfidence),
        modelVersion: modelVersionForStrategy('synthetic_seed', context.policy),
      }
    }
    return {
      ok: true,
      rawScore: Math.max(1e-9, seedWeight),
      confidence: seedConfidence,
      modelVersion: modelVersionForStrategy('synthetic_seed', context.policy),
    }
  }

  if (strategy === 'reported') {
    if (!context.policy.reported.enabled) {
      return { ok: false, reason: 'disabled' }
    }
    // Scaffold only in this release cut.
    return { ok: false, reason: 'input_missing' }
  }

  if (strategy === 'inferred_proxy') {
    if (!context.policy.inferred_proxy.enabled) {
      return { ok: false, reason: 'disabled' }
    }
    // Scaffold only in this release cut.
    return { ok: false, reason: 'input_missing' }
  }

  if (strategy === 'equal_weight') {
    return {
      ok: true,
      rawScore: Math.max(1e-9, context.equalWeightRaw),
      confidence: 0.5,
      modelVersion: modelVersionForStrategy('equal_weight', context.policy),
    }
  }

  return { ok: false, reason: 'invalid_input' }
}

const incrementCounter = (map: Map<string, number>, key: string) => {
  map.set(key, (map.get(key) ?? 0) + 1)
}

const resolveStrategyAwareWeight = (
  context: StrategyContext,
  counters: StrategyResolutionCounters,
): ResolvedWeight => {
  const fallbackChain = Array.isArray(context.policy.fallback_chain) && context.policy.fallback_chain.length > 0
    ? context.policy.fallback_chain
    : DEFAULT_FALLBACK_CHAIN
  const chain = dedupeStrategies([context.policy.strategy, ...fallbackChain])

  for (let i = 0; i < chain.length; i += 1) {
    const strategy = chain[i]
    const result = attemptStrategy(strategy, context)
    if (result.ok) {
      incrementCounter(counters.resolved, strategy)
      return {
        providerId: context.providerId,
        rawScore: result.rawScore,
        confidence: result.confidence,
        modelVersion: result.modelVersion,
        strategy,
      }
    }

    incrementCounter(counters.missing, strategy)
    const next = chain[i + 1]
    if (next) {
      incrementCounter(counters.fallback, `${strategy}|${next}|${result.reason}`)
    }
  }

  // Hard fallback should never be needed, but keeps output deterministic if catalog is malformed.
  incrementCounter(counters.fallback, 'unknown|equal_weight|invalid_input')
  const hardFallback = attemptStrategy('equal_weight', context)
  return {
    providerId: context.providerId,
    rawScore: hardFallback.ok ? hardFallback.rawScore : 1,
    confidence: hardFallback.ok ? hardFallback.confidence : 0.5,
    modelVersion: hardFallback.ok ? hardFallback.modelVersion : STRATEGY_MODEL_VERSION_DEFAULTS.equal_weight,
    strategy: 'equal_weight',
  }
}

const emitStrategyMetrics = (counters: StrategyResolutionCounters) => {
  for (const [strategy, count] of counters.resolved.entries()) {
    recordCloudWatchMetric({
      name: 'volume_strategy_resolved_total',
      value: count,
      unit: 'Count',
      dimensions: { strategy },
    })
  }

  for (const [tuple, count] of counters.fallback.entries()) {
    const [from, to, reason] = tuple.split('|')
    recordCloudWatchMetric({
      name: 'volume_strategy_fallback_total',
      value: count,
      unit: 'Count',
      dimensions: {
        from: from || 'unknown',
        to: to || 'unknown',
        reason: reason || 'unknown',
      },
    })
  }

  for (const [strategy, count] of counters.missing.entries()) {
    recordCloudWatchMetric({
      name: 'volume_strategy_input_missing_total',
      value: count,
      unit: 'Count',
      dimensions: { strategy },
    })
  }
}

const defaultVolumePolicy = (
  providerCount: number,
): ModuleVolumePolicy => ({
  strategy: 'synthetic_seed',
  model_version: defaultWeightModel,
  fallback_chain: [...DEFAULT_FALLBACK_CHAIN],
  synthetic_seed: {
    default_weight: providerCount > 0 ? 1 / providerCount : 1,
    default_confidence: 0.5,
    source_note: 'weighting_job_default_seed',
    corridor_overrides: [],
  },
  reported: {
    enabled: false,
    source_ref: null,
    freshness_slo_hours: 24,
  },
  inferred_proxy: {
    enabled: false,
    factor_name: 'volume_proxy',
    lookback_days: 30,
  },
})

const buildModulePolicyMap = () => {
  const catalog = loadModuleCatalog()
  const productionModules = catalog.modules.filter((module) => module.status === 'production')
  const byProvider = new Map<string, ModuleCatalogEntry>()
  for (const module of productionModules) {
    if (!byProvider.has(module.provider_id)) {
      byProvider.set(module.provider_id, module)
    }
  }
  return {
    byProvider,
    productionProviderCount: byProvider.size,
  }
}

export const providerWeightingInternals = {
  attemptStrategy,
  resolveStrategyAwareWeight,
  defaultVolumePolicy,
}

const buildUpsertPayload = (rows: {
  corridorId: string
  providerId: string
  weight: number
  modelVersion: string
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
    modelVersions.push(row.modelVersion)
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
  modelVersion: string
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
    const eligibleCorridorResult = await query<EligibleCorridorRow>(eligibleProvidersByCorridorQuery, [], pool)
    const eligibleGlobalResult = await query<EligibleGlobalRow>(eligibleGlobalProvidersQuery, [], pool)
    const providerRows = providerResult.rows
    const globalRows = globalResult.rows
    const eligibleCorridorRows = eligibleCorridorResult.rows
    const eligibleGlobalRows = eligibleGlobalResult.rows

    if (eligibleCorridorRows.length === 0 && eligibleGlobalRows.length === 0) {
      logger.warn('no_weight_data', {
        reason: 'no_eligible_provider_rows',
        provider_rows: providerRows.length,
        global_rows: globalRows.length,
      })
      return
    }

    const { byProvider: moduleByProvider, productionProviderCount } = buildModulePolicyMap()
    const strategyCounters: StrategyResolutionCounters = {
      resolved: new Map<string, number>(),
      fallback: new Map<string, number>(),
      missing: new Map<string, number>(),
    }

    const globalMetaRow = globalRows[0] ?? null
    const globalMin = toDate(globalMetaRow?.min_ts ?? null)
    const globalMax = toDate(globalMetaRow?.max_ts ?? null)
    const globalWindowDays = globalMetaRow
      ? computeWindowDays(globalMin, globalMax)
      : 0
    const globalAvailableHours = globalMetaRow
      ? computeAvailableHours(globalMin, globalMax)
      : 1
    const globalQuoteCount = globalMetaRow?.quote_count ?? 0
    const globalProviderCount = globalMetaRow?.provider_count ?? 0
    const globalConfidence = computeConfidence(globalWindowDays, globalQuoteCount, globalProviderCount)

    const tierMultiplierByProvider = new Map<string, number>()
    for (const row of globalRows) {
      const persistence = globalAvailableHours > 0 ? row.active_hours / globalAvailableHours : 0
      tierMultiplierByProvider.set(row.provider_id, computeTierMultiplier(persistence))
    }

    const globalLiveRaw = new Map<string, number>()
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
      globalLiveRaw.set(row.provider_id, raw)
    }
    const globalLiveRawSum = Array.from(globalLiveRaw.values()).reduce((a, b) => a + b, 0)
    const globalLiveScores = new Map<string, number>()
    for (const [providerId, raw] of globalLiveRaw.entries()) {
      const normalized = globalLiveRawSum > 0
        ? raw / globalLiveRawSum
        : (globalLiveRaw.size > 0 ? 1 / globalLiveRaw.size : 0)
      globalLiveScores.set(providerId, normalized)
    }

    const corridors = new Map<string, {
      meta: CorridorMeta
      eligibleProviders: Set<string>
      liveRows: Map<string, ProviderStatRow>
    }>()

    for (const row of eligibleCorridorRows) {
      const existing = corridors.get(row.corridor_id)
      if (existing) {
        existing.eligibleProviders.add(row.provider_id)
        continue
      }
      corridors.set(row.corridor_id, {
        meta: {
          quoteCount: 0,
          providerCount: 0,
          windowDays: 0,
          weightConfidence: 0,
          availableHours: 1,
        },
        eligibleProviders: new Set([row.provider_id]),
        liveRows: new Map(),
      })
    }

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
        corridors.set(row.corridor_id, {
          meta,
          eligibleProviders: new Set([row.provider_id]),
          liveRows: new Map([[row.provider_id, row]]),
        })
      } else {
        entry.liveRows.set(row.provider_id, row)
        entry.eligibleProviders.add(row.provider_id)
        entry.meta = meta
      }
    }

    const rowsToUpsert: {
      corridorId: string
      providerId: string
      weight: number
      modelVersion: string
      windowDays: number
      quoteCount: number
      providerCount: number
      weightConfidence: number
    }[] = []

    for (const [corridorId, entry] of corridors.entries()) {
      if (isShutdownRequested()) break
      const { meta } = entry
      const providerIds = Array.from(entry.eligibleProviders)
      if (providerIds.length === 0) continue

      const equalWeightRaw = providerIds.length > 0 ? 1 / providerIds.length : 1
      const liveRawByProvider = new Map<string, number>()
      for (const providerId of providerIds) {
        const row = entry.liveRows.get(providerId)
        if (!row) continue
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
        liveRawByProvider.set(providerId, raw)
      }

      const liveRawSum = Array.from(liveRawByProvider.values()).reduce((a, b) => a + b, 0)
      const liveScores = new Map<string, number>()
      for (const [providerId, raw] of liveRawByProvider.entries()) {
        const normalized = liveRawSum > 0
          ? raw / liveRawSum
          : (liveRawByProvider.size > 0 ? 1 / liveRawByProvider.size : 0)
        liveScores.set(providerId, normalized)
      }

      const resolved = providerIds.map((providerId) => {
        const module = moduleByProvider.get(providerId)
        const policy = module?.volume ?? defaultVolumePolicy(providerIds.length)
        return resolveStrategyAwareWeight(
          {
            policy,
            providerId,
            corridorId,
            liveScore: liveScores.get(providerId) ?? null,
            liveConfidence: meta.weightConfidence,
            equalWeightRaw,
          },
          strategyCounters,
        )
      })

      const resolvedRawSum = resolved.reduce((sum, row) => sum + row.rawScore, 0)
      const normalizedFallback = resolved.length > 0 ? 1 / resolved.length : 1

      for (const row of resolved) {
        const normalized = resolvedRawSum > 0 ? row.rawScore / resolvedRawSum : normalizedFallback
        rowsToUpsert.push({
          corridorId,
          providerId: row.providerId,
          weight: normalized,
          modelVersion: row.modelVersion,
          windowDays: meta.windowDays,
          quoteCount: meta.quoteCount,
          providerCount: providerIds.length,
          weightConfidence: clamp01(row.confidence, meta.weightConfidence),
        })
      }
    }

    const globalProviderSet = new Set<string>(eligibleGlobalRows.map((row) => row.provider_id))
    if (globalProviderSet.size === 0) {
      for (const providerId of moduleByProvider.keys()) {
        globalProviderSet.add(providerId)
      }
    }
    for (const providerId of globalLiveScores.keys()) {
      globalProviderSet.add(providerId)
    }

    const globalProviderIds = Array.from(globalProviderSet)
    if (globalProviderIds.length > 0) {
      const equalWeightRaw = 1 / globalProviderIds.length
      const resolvedGlobal = globalProviderIds.map((providerId) => {
        const module = moduleByProvider.get(providerId)
        const policy = module?.volume ?? defaultVolumePolicy(globalProviderIds.length)
        return resolveStrategyAwareWeight(
          {
            policy,
            providerId,
            corridorId: GLOBAL_WEIGHT_CORRIDOR_ID,
            liveScore: globalLiveScores.get(providerId) ?? null,
            liveConfidence: globalConfidence,
            equalWeightRaw,
          },
          strategyCounters,
        )
      })
      const globalResolvedRawSum = resolvedGlobal.reduce((sum, row) => sum + row.rawScore, 0)
      const normalizedFallback = resolvedGlobal.length > 0 ? 1 / resolvedGlobal.length : 1
      for (const row of resolvedGlobal) {
        rowsToUpsert.push({
          corridorId: GLOBAL_WEIGHT_CORRIDOR_ID,
          providerId: row.providerId,
          weight: globalResolvedRawSum > 0 ? row.rawScore / globalResolvedRawSum : normalizedFallback,
          modelVersion: row.modelVersion,
          windowDays: Math.min(lookbackDays, globalWindowDays),
          quoteCount: globalQuoteCount,
          providerCount: globalProviderIds.length,
          weightConfidence: clamp01(row.confidence, globalConfidence),
        })
      }
    }

    upserted = await upsertWeights(pool, rowsToUpsert)
    emitStrategyMetrics(strategyCounters)

    const mapToObject = (map: Map<string, number>) => Object.fromEntries([...map.entries()].sort())
    success = true
    logger.info('provider_weights_upserted', {
      default_model_version: defaultWeightModel,
      corridors: corridors.size,
      rows: rowsToUpsert.length,
      upserted,
      production_modules: productionProviderCount,
      strategy_resolved: mapToObject(strategyCounters.resolved),
      strategy_fallback: mapToObject(strategyCounters.fallback),
      strategy_input_missing: mapToObject(strategyCounters.missing),
    })
  } catch (error) {
    logger.error('provider_weighting_job_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    const durationSeconds = (Date.now() - start) / 1000
    await recordBatchJobMetric('provider-weighting-job', success ? 'job_complete' : 'job_failure', durationSeconds, {
      model_version: defaultWeightModel,
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
