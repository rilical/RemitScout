/**
 * B2B Sweep Scheduler - Plans due B2B tier sweeps and enqueues shard tasks.
 *
 * Designed to run on a tight interval (e.g., every minute) so corridors are
 * queued as soon as their tier cadence expires.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend b2b:sweep-scheduler
 * ```
 *
 * **Environment Variables**:
 * - `B2B_SWEEP_SCHEDULER_LOOP`: Set to `1` to run continuously
 * - `B2B_SWEEP_SCHEDULER_LOOP_DELAY_MS`: Delay between runs (default: 60000)
 * - `B2B_SWEEP_SCHEDULER_LOCK_TTL_SECONDS`: Lock TTL (default: 60)
 */

import { setTimeout as sleep } from 'timers/promises'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from '../shared/health-server'
import { getQueueAgeSeconds, getQueueStats, sendBatchJsonMessages, sendJsonMessage } from '../shared/sqs'
import { partitionCorridors } from '../shared/sharding'
import { parseCorridorId } from '../shared/corridor'
import { getCountryByCode } from '../shared/countries-currencies'
import { createShutdownHandler } from '../shared/shutdown'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { emitOpsEvent } from '../shared/ops-events'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing } from '../shared/tracing'
import { wrapEnvelope } from '../shared/queue-staleness'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { providerRegistry as _providerRegistry, type ProviderRegistryEntry as _ProviderRegistryEntry } from '../plane-b/src/providers'
import {
  B2bSweepRepository,
  FreshnessReportRepository,
  LatestQuoteRepository,
  ProviderCapabilityRepository,
  RightsMatrixRepository,
} from '../plane-b/src/repositories'
import {
  getCorridorTier as _getCorridorTier,
  TIER_1_CADENCE_SECONDS,
  TIER_2_CADENCE_SECONDS,
  TIER_1_SLO_MINUTES,
  TIER_2_SLO_MINUTES,
  type CorridorTier,
} from '../shared/corridor-tiers'
import { buildB2bAmountResolver } from '../plane-b/src/services/b2b-amount'
import { filterQueuesByRightsMatrix as _filterQueuesByRightsMatrix } from '../plane-b/src/services/rights-matrix-filter'
import {
  getMacroLanes,
  B2B_FIXED_AMOUNT_USD,
  isMacroCorridor as _isMacroCorridor,
  type PayoutMethod,
} from '../shared/macro-corridors'
import { normalizeMacroLanesForSweep } from './b2b-sweep-plan'
import { isRightsMatrixCorridorEligible } from '../shared/rights-matrix-corridor'
import {
  getCompletedSweepReferenceTime,
  getSweepCadenceDriftMinutes,
  isSweepTierDue,
} from '../shared/b2b-sweep-cadence'
import { resolveIngestFanoutQueueState } from '../shared/ingest-fanout-queues'

type _PriorityQueues = {
  tier1: string[]
  tier2: string[]
  all: string[]
}

type FreshnessReportRow = {
  corridorId: string
  amountBucket: number
  ageMinutes: number | null
  sloMinutes: number | null
  isStale: boolean
}

type PriorityTierPlan = {
  corridors: string[]
  eligibleCorridors: string[]
  freshness: {
    staleCorridors: string[]
    freshCorridors: string[]
    filteredCorridors: string[]
  }
  partitions: string[][]
  targetShards: number
  rpmOverride: number
  perCorridorRpmOverride: number
  requiredRpm: number | null
  maxRpm: number | null
}

type IngestFanoutMessage = {
  providerId: string
  collectorType: string
  corridors: string[]
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  priorityTier?: string
  shardIndex?: number
  requestedAt: string
  sweepRunId?: string
}

type _TierKey = 'tier1' | 'tier2'

type IngestFanoutProviderTask = {
  providerId: string
  collectorType: string
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  priorityTier?: string
}

type _IngestFanoutCorridorMessage = {
  version: 'corridor_v1'
  corridorId: string
  providers: IngestFanoutProviderTask[]
  requestedAt: string
  sweepRunId?: string
}

const logger = createLogger('script.b2b-sweep-scheduler')
initTracing('b2b-sweep-scheduler')
initErrorTracking('b2b-sweep-scheduler')
const ingestFanoutMode = config.queues.ingestFanout.mode
const ingestFanoutQueueUrl = config.queues.ingestFanout.url
const ingestFanoutQueueTier1Url = config.queues.ingestFanout.tier1Url
const ingestFanoutQueueTier2Url = config.queues.ingestFanout.tier2Url
const ingestFanoutQueueState = resolveIngestFanoutQueueState({
  mode: ingestFanoutMode,
  url: ingestFanoutQueueUrl,
  tier1Url: ingestFanoutQueueTier1Url,
  tier2Url: ingestFanoutQueueTier2Url,
})
const ingestFanoutTiered = ingestFanoutQueueState.tieredConfigured
const ingestFanoutTierMisconfigured = ingestFanoutQueueState.tierMisconfigured
const ingestFanoutEnabled = ingestFanoutQueueState.enabledForQueueProducer

const b2bAmountByProvider: Record<string, number> = {
  remitly: config.planeB.remitly.b2bAmount,
  wise: config.planeB.wise.b2bAmount,
  xe: config.planeB.xe.b2bAmount,
  transfergo: config.planeB.transfergo.b2bAmount,
  paysend: config.planeB.paysend.b2bAmount,
  pangea: config.planeB.pangea.b2bAmount,
  orbitremit: config.planeB.orbitremit.b2bAmount,
  bossmoney: config.planeB.bossmoney.b2bAmount,
  worldremit: config.planeB.worldremit.b2bAmount,
  westernunion: config.planeB.westernunion.b2bAmount,
  ria: config.planeB.ria.b2bAmount,
  dahabshiil: config.planeB.dahabshiil.b2bAmount,
  sendwave: config.planeB.sendwave.b2bAmount,
  mukuru: config.planeB.mukuru.b2bAmount,
  xoom: config.planeB.xoom.b2bAmount,
  instarem: config.planeB.instarem.b2bAmount,
  wirebarley: config.planeB.wirebarley.b2bAmount,
  alansari: config.planeB.alansari.b2bAmount,
  intermex: config.planeB.intermex.b2bAmount,
  koronapay: config.planeB.koronapay.b2bAmount,
  remitbee: config.planeB.remitbee.b2bAmount,
  singx: config.planeB.singx.b2bAmount,
  placid: config.planeB.placid.b2bAmount,
}
const _resolveB2bAmount = (providerId: string) => {
  return b2bAmountByProvider[providerId] ?? config.planeB.remitly.b2bAmount
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const loopEnabled = toBoolean(process.env.B2B_SWEEP_SCHEDULER_LOOP)
const loopDelayMs = Math.max(1000, toNumber(process.env.B2B_SWEEP_SCHEDULER_LOOP_DELAY_MS, 60000))
const healthEnabled = process.env.WORKER_HEALTH_ENABLED !== '0'
const healthPort = toNumber(process.env.HEALTH_PORT, 8080)
const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
let healthServer: { close: () => Promise<void> } | null = null
const schedulerJitterMs = Math.max(
  0,
  toNumber(process.env.B2B_SWEEP_SCHEDULER_JITTER_MS, 0),
)
const lockTtlSeconds = toNumber(process.env.B2B_SWEEP_SCHEDULER_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const staleRunMaxAgeMsOverride = toNumber(
  process.env.B2B_SWEEP_SCHEDULER_STALE_RUN_MAX_AGE_MS,
  NaN,
)

const canaryModeEnabled = toBoolean(process.env.B2B_SWEEP_CANARY_MODE)
const canaryForceDue = toBoolean(process.env.B2B_SWEEP_CANARY_FORCE_DUE, true)
const canaryMaxLanes = Math.max(0, toNumber(process.env.B2B_SWEEP_CANARY_MAX_LANES, 0))
const canaryIntervalSeconds = Math.max(
  60,
  toNumber(process.env.B2B_SWEEP_CANARY_INTERVAL_SECONDS, 600),
)
const canaryCorridors = (process.env.B2B_SWEEP_CANARY_CORRIDORS || '')
  .split(',')
  .map(value => value.trim().toUpperCase())
  .filter(Boolean)

const defaultB2bPayinMethod = 'bank_transfer'
const defaultB2bPayoutMethod = 'bank_deposit'
const b2bPayinMethodByProvider: Record<string, string> = {
  koronapay: 'debit_card',
  paysend: 'debit_card',
  remitbee: 'debit_card',
  sendwave: 'debit_card',
  intermex: 'debit_card',
  placid: 'debit_card',
}
const b2bPayoutMethodByProvider: Record<string, string> = {
  koronapay: 'bank_deposit',
  paysend: 'bank_deposit',
  remitbee: 'bank_deposit',
  intermex: 'bank_deposit',
}
const resolveB2bPayinMethod = (providerId: string) => {
  return b2bPayinMethodByProvider[providerId] ?? defaultB2bPayinMethod
}
const _resolveB2bPayoutMethod = (providerId: string) => {
  return b2bPayoutMethodByProvider[providerId] ?? defaultB2bPayoutMethod
}

const estimateTargetShards = (
  corridorCount: number,
  rpm: number,
  targetMinutes: number,
  options?: { minShards?: number; maxCorridorsPerShard?: number },
) => {
  if (!Number.isFinite(corridorCount) || corridorCount <= 0) return 0
  if (!Number.isFinite(rpm) || rpm <= 0) return 1
  if (!Number.isFinite(targetMinutes) || targetMinutes <= 0) return 1
  const baseShards = Math.max(1, Math.ceil(corridorCount / (rpm * targetMinutes)))
  const minShards = Number.isFinite(options?.minShards) ? Math.max(0, Math.floor(options!.minShards!)) : 0
  const maxCorridorsPerShard = Number.isFinite(options?.maxCorridorsPerShard)
    ? Math.max(0, Math.floor(options!.maxCorridorsPerShard!))
    : 0
  const maxCorridorShards = maxCorridorsPerShard > 0
    ? Math.ceil(corridorCount / maxCorridorsPerShard)
    : 0
  return Math.max(1, baseShards, minShards, maxCorridorShards)
}

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
    return [items]
  }
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

const resolveIngestFanoutQueueUrl = (priorityTier?: string): string | null => {
  if (ingestFanoutTierMisconfigured) {
    return null
  }
  if (ingestFanoutTiered) {
    if (!ingestFanoutQueueTier1Url || !ingestFanoutQueueTier2Url) {
      return null
    }
    return priorityTier === 'tier_2' ? ingestFanoutQueueTier2Url : ingestFanoutQueueTier1Url
  }
  return ingestFanoutQueueUrl || null
}

const resolveIngestQueueClassFromPriorityTier = (priorityTier?: string) => {
  return priorityTier === 'tier_2' ? 'ingest-fanout-t2' as const : 'ingest-fanout-t1' as const
}

const isNativeCurrencyCorridor = (corridorId: string): boolean => {
  const parts = parseCorridorId(corridorId)
  if (!parts) return false
  const sourceCountry = getCountryByCode(parts.sourceCountry.toUpperCase())
  const destCountry = getCountryByCode(parts.destCountry.toUpperCase())
  if (!sourceCountry || !destCountry) return false
  return parts.sourceCurrency.toUpperCase() === sourceCountry.currency
    && parts.destCurrency.toUpperCase() === destCountry.currency
}

type TierSnapshotRow = {
  corridor_id: string
  corridor_tier: string
}

const loadTierSnapshot = async (
  pool: ReturnType<typeof createPool>,
  tierVersion: string,
): Promise<Map<string, CorridorTier>> => {
  const result = await query<TierSnapshotRow>(
    `SELECT corridor_id, corridor_tier
       FROM silver.corridor_tier_snapshot
      WHERE tier_version = $1`,
    [tierVersion],
    pool,
  )
  const tierMap = new Map<string, CorridorTier>()
  for (const row of result.rows) {
    const tier = row.corridor_tier === 'tier_1' ? 'tier_1' : 'tier_2'
    tierMap.set(row.corridor_id, tier)
  }
  return tierMap
}

const loadFreshnessLagByCorridor = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
  corridors: string[],
  amountByCorridor: Map<string, number>,
  fallbackAmount: number,
  payinMethod: string,
  payoutMethod: string,
) => {
  const ageByCorridor = new Map<string, number | null>()
  for (const corridorId of corridors) {
    ageByCorridor.set(corridorId, null)
  }
  if (!corridors.length) {
    return ageByCorridor
  }
  const repo = new LatestQuoteRepository(pool)
  const chunkSize = Number.isFinite(config.planeB.b2bFreshnessChunkSize)
    ? config.planeB.b2bFreshnessChunkSize
    : 0
  const buckets = new Map<number, string[]>()
  for (const corridorId of corridors) {
    const amountBucket = amountByCorridor.get(corridorId) ?? fallbackAmount
    const normalized = Number.isFinite(amountBucket) ? Math.max(1, Math.round(amountBucket)) : fallbackAmount
    const list = buckets.get(normalized) ?? []
    list.push(corridorId)
    buckets.set(normalized, list)
  }
  for (const [amountBucket, corridorList] of buckets.entries()) {
    const corridorChunks = chunkSize > 0 ? chunkArray(corridorList, chunkSize) : [corridorList]
    for (const corridorChunk of corridorChunks) {
      const rows = await repo.loadFreshnessLagByCorridor(
        providerId,
        corridorChunk,
        amountBucket,
        payinMethod,
        payoutMethod,
      )
      for (const row of rows) {
        if (!row.corridor_id) {
          continue
        }
        const age = Number.isFinite(row.age_minutes) ? Number(row.age_minutes) : null
        ageByCorridor.set(row.corridor_id, age)
      }
    }
  }
  return ageByCorridor
}

const persistFreshnessReport = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
  payinMethod: string,
  payoutMethod: string,
  reports: FreshnessReportRow[],
) => {
  if (!reports.length) return
  const chunkSize = Number.isFinite(config.planeB.b2bFreshnessChunkSize)
    ? config.planeB.b2bFreshnessChunkSize
    : 0
  const reportChunks = chunkSize > 0 ? chunkArray(reports, chunkSize) : [reports]
  const repo = new FreshnessReportRepository(pool)

  for (const chunk of reportChunks) {
    const observedAt = new Date().toISOString()
    const providerIds = chunk.map(() => providerId)
    const corridorIds = chunk.map(report => report.corridorId)
    const amountBuckets = chunk.map(report => report.amountBucket)
    const payinMethods = chunk.map(() => payinMethod)
    const payoutMethods = chunk.map(() => payoutMethod)
    const ageMinutes = chunk.map(report => report.ageMinutes)
    const sloMinutes = chunk.map(report => report.sloMinutes)
    const staleFlags = chunk.map(report => report.isStale)
    const observedAts = chunk.map(() => observedAt)

    await repo.insertBatch({
      providerIds,
      corridorIds,
      amountBuckets,
      payinMethods,
      payoutMethods,
      ageMinutes,
      sloMinutes,
      isStale: staleFlags,
      observedAts,
    })
  }
}

const applyFreshnessSlo = async (options: {
  pool: ReturnType<typeof createPool>
  providerId: string
  corridors: string[]
  amountByCorridor: Map<string, number>
  fallbackAmount: number
  payinMethod: string
  payoutMethod: string
  sloMinutes: number
  enabled: boolean
}) => {
  const {
    pool,
    providerId,
    corridors,
    amountByCorridor,
    fallbackAmount,
    payinMethod,
    payoutMethod,
    sloMinutes,
    enabled,
  } = options
  if (!corridors.length) {
    return {
      staleCorridors: [] as string[],
      freshCorridors: [] as string[],
      filteredCorridors: [] as string[],
    }
  }
  const ageByCorridor = await loadFreshnessLagByCorridor(
    pool,
    providerId,
    corridors,
    amountByCorridor,
    fallbackAmount,
    payinMethod,
    payoutMethod,
  )
  const hasSlo = sloMinutes > 0
  const shouldEnforce = enabled && hasSlo
  const staleCorridors: string[] = []
  const freshCorridors: string[] = []
  const reports: FreshnessReportRow[] = []

  for (const corridorId of corridors) {
    const ageMinutes = ageByCorridor.get(corridorId) ?? null
    const isStale = hasSlo ? ageMinutes === null || ageMinutes >= sloMinutes : false
    const amountBucket = amountByCorridor.get(corridorId) ?? fallbackAmount
    if (isStale) {
      staleCorridors.push(corridorId)
    } else {
      freshCorridors.push(corridorId)
    }
    reports.push({
      corridorId,
      amountBucket,
      ageMinutes,
      sloMinutes: hasSlo ? sloMinutes : null,
      isStale,
    })
  }

  if (shouldEnforce) {
    try {
      await persistFreshnessReport(
        pool,
        providerId,
        payinMethod,
        payoutMethod,
        reports,
      )
    } catch (error) {
      logger.warn('b2b_freshness_report_write_failed', {
        provider_id: providerId,
        corridors: reports.length,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } else {
    logger.debug('b2b_freshness_report_skipped', {
      provider_id: providerId,
      corridors: reports.length,
      reason: enabled ? 'slo_missing' : 'disabled',
    })
  }

  logger.info('b2b_freshness_slo_report', {
    provider_id: providerId,
    total_corridors: corridors.length,
    stale_corridors: staleCorridors.length,
    fresh_corridors: freshCorridors.length,
    slo_minutes: hasSlo ? sloMinutes : null,
    enabled: shouldEnforce,
  })

  return {
    staleCorridors,
    freshCorridors,
    filteredCorridors: shouldEnforce ? staleCorridors : corridors,
  }
}

const _buildTierPlan = async (options: {
  pool: ReturnType<typeof createPool>
  providerId: string
  corridors: string[]
  targetMinutes: number
  amountByCorridor: Map<string, number>
  fallbackAmount: number
  payinMethod: string
  payoutMethod: string
  shardPlanConfig: { minShards?: number; maxCorridorsPerShard?: number }
  tierConfig: {
    rpm: number
    sloMinutes: number
    perCorridorRpm: number
  }
  freshnessEnabled: boolean
  rpmSafetyFactor: number
  maxRpm?: number
  maxPerCorridorRpm?: number
}): Promise<PriorityTierPlan> => {
  const {
    pool,
    providerId,
    corridors,
    targetMinutes,
    amountByCorridor,
    fallbackAmount,
    payinMethod,
    payoutMethod,
    shardPlanConfig,
    tierConfig,
    freshnessEnabled,
    rpmSafetyFactor,
    maxRpm,
    maxPerCorridorRpm,
  } = options
  const eligibleCorridors = corridors
  const freshness = await applyFreshnessSlo({
    pool,
    providerId,
    corridors: eligibleCorridors,
    amountByCorridor,
    fallbackAmount,
    payinMethod,
    payoutMethod,
    sloMinutes: tierConfig.sloMinutes,
    enabled: freshnessEnabled,
  })
  const filteredCount = freshness.filteredCorridors.length
  const rawMaxRpm = maxRpm ?? tierConfig.rpm
  const safeMaxRpm = rawMaxRpm > 0
    ? Math.max(1, Math.floor(rawMaxRpm * rpmSafetyFactor))
    : rawMaxRpm
  const requiredRpm = targetMinutes > 0 && filteredCount > 0
    ? Math.ceil(filteredCount / targetMinutes)
    : null
  const rpmCap = safeMaxRpm > 0 ? safeMaxRpm : rawMaxRpm
  const rpmOverride = requiredRpm
    ? Math.min(Math.max(tierConfig.rpm, requiredRpm), rpmCap)
    : Math.min(tierConfig.rpm, rpmCap)
  const perCorridorRpmOverride = Math.min(
    tierConfig.perCorridorRpm,
    maxPerCorridorRpm ?? tierConfig.perCorridorRpm,
  )

  if (requiredRpm && requiredRpm > rpmCap) {
    logger.info('b2b_rpm_shortfall', {
      provider_id: providerId,
      corridors: filteredCount,
      required_rpm: requiredRpm,
      max_rpm: rpmCap,
      raw_max_rpm: rawMaxRpm,
      rpm_safety_factor: rpmSafetyFactor,
      target_minutes: targetMinutes,
    })
  }

  const targetShards = estimateTargetShards(
    filteredCount,
    rpmOverride,
    targetMinutes,
    shardPlanConfig,
  )
  const partitions = targetShards > 0
    ? partitionCorridors(freshness.filteredCorridors, targetShards)
    : []
  return {
    corridors,
    eligibleCorridors,
    freshness,
    partitions,
    targetShards,
    rpmOverride,
    perCorridorRpmOverride,
    requiredRpm,
    maxRpm: rpmCap,
  }
}

const _enqueueIngestFanout = async (payload: IngestFanoutMessage): Promise<boolean> => {
  const queueUrl = resolveIngestFanoutQueueUrl(payload.priorityTier)
  if (!queueUrl) {
    return false
  }
  try {
    await sendJsonMessage(
      queueUrl,
      wrapEnvelope(
        resolveIngestQueueClassFromPriorityTier(payload.priorityTier),
        payload,
        { runId: payload.sweepRunId },
      ),
    )
    return true
  } catch (error) {
    logger.warn('ingest_fanout_enqueue_failed', {
      provider_id: payload.providerId,
      collector_type: payload.collectorType,
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const loadProviderRights = async (pool: ReturnType<typeof createPool>) => {
  const repo = new RightsMatrixRepository(pool)
  const rows = await repo.loadProviderRights()
  const rights = new Map<string, {
    allowedCollect: boolean
    allowedB2b: boolean
    stoplistStatus: string
    sourceCountries: string[] | null
    destinationCountries: string[] | null
  }>()
  for (const row of rows) {
    if (!row.provider_id) continue
    rights.set(row.provider_id, {
      allowedCollect: Boolean(row.allowed_collect),
      allowedB2b: Boolean(row.allowed_b2b),
      stoplistStatus: row.stoplist_status || 'active',
      sourceCountries: Array.isArray(row.source_countries) ? row.source_countries : null,
      destinationCountries: Array.isArray(row.destination_countries) ? row.destination_countries : null,
    })
  }
  return rights
}

const _loadLastRuns = async (
  pool: ReturnType<typeof createPool>,
  providerIds: string[],
  collectorTypes: string[],
) => {
  if (providerIds.length === 0 || collectorTypes.length === 0) {
    return new Map<string, string>()
  }
  const result = await query<{
    provider_id: string
    collector_type: string
    last_run: string | null
  }>(
    `SELECT provider_id,
            collector_type,
            MAX(COALESCE(finished_at, started_at)) AS last_run
       FROM silver.ingestion_run
      WHERE provider_id = ANY($1::text[])
        AND collector_type = ANY($2::text[])
      GROUP BY provider_id, collector_type`,
    [providerIds, collectorTypes],
    pool,
  )
  const map = new Map<string, string>()
  for (const row of result.rows) {
    if (!row.provider_id || !row.collector_type || !row.last_run) continue
    map.set(`${row.provider_id}:${row.collector_type}`, row.last_run)
  }
  return map
}

const _loadLastSweepRunByTier = async (
  pool: ReturnType<typeof createPool>,
  tierLabels: string[],
) => {
  if (tierLabels.length === 0) {
    return new Map<string, string>()
  }
  const result = await query<{
    priority_tier: string
    last_run: string | null
  }>(
    `SELECT priority_tier,
            MAX(COALESCE(enqueued_at, started_at, created_at)) AS last_run
       FROM silver.b2b_sweep_run
      WHERE priority_tier = ANY($1::text[])
      GROUP BY priority_tier`,
    [tierLabels],
    pool,
  )
  const map = new Map<string, string>()
  for (const row of result.rows) {
    if (!row.priority_tier || !row.last_run) continue
    map.set(row.priority_tier, row.last_run)
  }
  return map
}

const _upsertScheduleRow = async (options: {
  pool: ReturnType<typeof createPool>
  providerId: string
  priorityTier: string
  intervalSeconds: number
  nextDueAt: Date
  enabled: boolean
}) => {
  const { pool, providerId, priorityTier, intervalSeconds, nextDueAt, enabled } = options
  await query(
    `INSERT INTO silver.b2b_sweep_schedule
       (provider_id, priority_tier, interval_seconds, next_due_at, enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (provider_id, priority_tier) DO UPDATE SET
       interval_seconds = EXCLUDED.interval_seconds,
       enabled = EXCLUDED.enabled,
       updated_at = NOW()`,
    [providerId, priorityTier, intervalSeconds, nextDueAt.toISOString(), enabled],
    pool,
  )
}

const _disableScheduleForMissingProviders = async (
  pool: ReturnType<typeof createPool>,
  providerIds: string[],
) => {
  if (providerIds.length === 0) {
    await query(
      `UPDATE silver.b2b_sweep_schedule
          SET enabled = false,
              updated_at = NOW()`,
      [],
      pool,
    )
    return
  }
  await query(
    `UPDATE silver.b2b_sweep_schedule
        SET enabled = false,
            updated_at = NOW()
      WHERE NOT (provider_id = ANY($1::text[]))`,
    [providerIds],
    pool,
  )
}

const _claimDueSchedules = async (
  pool: ReturnType<typeof createPool>,
  options?: {
    providerIds?: string[]
    priorityTiers?: string[]
  },
) => {
  const providerIds = options?.providerIds
  const priorityTiers = options?.priorityTiers
  if (providerIds && providerIds.length === 0) {
    return []
  }
  if (priorityTiers && priorityTiers.length === 0) {
    return []
  }
  const whereClauses: string[] = ['enabled = true', 'next_due_at <= NOW()']
  const params: Array<string[] | number> = []
  if (providerIds) {
    params.push(providerIds)
    whereClauses.push(`provider_id = ANY($${params.length}::text[])`)
  }
  if (priorityTiers) {
    params.push(priorityTiers)
    whereClauses.push(`priority_tier = ANY($${params.length}::text[])`)
  }
  const result = await query<{
    provider_id: string
    priority_tier: string
    interval_seconds: number
  }>(
    `UPDATE silver.b2b_sweep_schedule
        SET last_enqueued_at = NOW(),
            next_due_at = NOW() + (interval_seconds || ' seconds')::interval,
            updated_at = NOW()
      WHERE ${whereClauses.join('\n        AND ')}
      RETURNING provider_id, priority_tier, interval_seconds`,
    params,
    pool,
  )
  return result.rows
}

const buildCapabilityIndex = (
  capabilities: Array<{
    provider_id: string
    corridor_id: string
    payout_methods: string[] | null
    is_supported: boolean
  }>,
): {
  byCorridorAndMethod: Map<string, string[]>
  byProvider: Map<string, string[]>
} => {
  const byCorridorAndMethod = new Map<string, string[]>()
  const byProvider = new Map<string, string[]>()

  for (const cap of capabilities) {
    if (!cap.is_supported) continue

    const methods = cap.payout_methods?.length
      ? cap.payout_methods.map(m => m.toLowerCase())
      : ['bank_deposit']

    for (const method of methods) {
      const key = `${cap.corridor_id}:${method}`
      const existing = byCorridorAndMethod.get(key) ?? []
      existing.push(cap.provider_id)
      byCorridorAndMethod.set(key, existing)
    }

    const providerCorridors = byProvider.get(cap.provider_id) ?? []
    providerCorridors.push(cap.corridor_id)
    byProvider.set(cap.provider_id, providerCorridors)
  }

  return { byCorridorAndMethod, byProvider }
}

type ProviderRightsForScheduler = {
  allowedCollect: boolean
  allowedB2b: boolean
  stoplistStatus: string
  sourceCountries: string[] | null
  destinationCountries: string[] | null
}

const filterProvidersByRights = (
  providerIds: string[],
  corridorId: string,
  rightsByProvider: Map<string, ProviderRightsForScheduler>,
): string[] => providerIds.filter((providerId) => {
  const rights = rightsByProvider.get(providerId)
  if (!rights) return false
  if (!rights.allowedCollect || !rights.allowedB2b) return false
  if (rights.stoplistStatus !== 'active') return false
  return isRightsMatrixCorridorEligible(corridorId, rights)
})

const tierConfig = {
  tier_1: {
    label: 'tier_1',
    collectorType: 'b2b_tier_1',
    cadenceSeconds: TIER_1_CADENCE_SECONDS,
    sloMinutes: TIER_1_SLO_MINUTES,
    rpm: 12,
  },
  tier_2: {
    label: 'tier_2',
    collectorType: 'b2b_tier_2',
    cadenceSeconds: TIER_2_CADENCE_SECONDS,
    sloMinutes: TIER_2_SLO_MINUTES,
    rpm: 6,
  },
} as const

const recordSweepCadenceMetrics = (
  tier: CorridorTier,
  cadenceSeconds: number,
  latestCompletedRun: {
    createdAt?: Date | string | null
    startedAt?: Date | string | null
    finishedAt?: Date | string | null
  } | null,
) => {
  const driftMinutes = getSweepCadenceDriftMinutes({
    latestCompletedRun,
    cadenceSeconds,
  })
  const overdue = driftMinutes !== null && driftMinutes > 0
  const dimensions = {
    environment: config.envName || config.env,
    priority_tier: tier,
  }

  recordCloudWatchMetric({
    name: 'b2b_sweep_completion_overdue',
    value: overdue ? 1 : 0,
    unit: 'Count',
    dimensions,
  })

  if (driftMinutes !== null) {
    recordCloudWatchMetric({
      name: 'b2b_sweep_completion_drift_minutes',
      value: Math.max(0, driftMinutes),
      unit: 'Count',
      dimensions,
    })
  }

  return driftMinutes
}

export const runB2bSweepScheduler = async (): Promise<number> => {
  if (!ingestFanoutEnabled) {
    logger.warn('scheduler_disabled', { reason: 'queue_not_configured' })
    return 0
  }

  if (ingestFanoutTierMisconfigured) {
    logger.warn('scheduler_disabled', { reason: 'missing_tier_queues' })
    return 0
  }

  if (schedulerJitterMs > 0) {
    const delayMs = Math.floor(Math.random() * schedulerJitterMs)
    if (delayMs > 0) {
      logger.info('scheduler_jitter', { delay_ms: delayMs })
      await sleep(delayMs)
    }
  }

  if (config.planeB.b2bDrainMode) {
    logger.warn('scheduler_disabled', { reason: 'drain_mode' })
    return 0
  }

  const maxQueueDepth = Math.max(config.planeB.b2bMaxQueueDepth || 0, 0)
  const maxQueueAgeSecondsTier1 = Math.max(
    config.planeB.b2bMaxQueueAgeSecondsTier1 || config.planeB.b2bMaxQueueAgeSeconds || 0,
    0,
  )
  const maxQueueAgeSecondsTier2 = Math.max(
    config.planeB.b2bMaxQueueAgeSecondsTier2 || config.planeB.b2bMaxQueueAgeSeconds || 0,
    0,
  )
  const maxQueueAgeSecondsCombined = Math.max(maxQueueAgeSecondsTier1, maxQueueAgeSecondsTier2)
  let allowTier1 = !config.planeB.disableTier1
  let allowTier2 = true
  let backpressureActive = false
  const emitBackpressure = (reason: string, details: Record<string, unknown>) => {
    backpressureActive = true
    recordCloudWatchMetric({
      name: 'worker_backpressure',
      value: 1,
      unit: 'Count',
      dimensions: {
        worker: 'b2b-sweep-scheduler',
        reason,
        environment: config.envName || config.env,
      },
    })
    emitOpsEvent({
      type: 'backpressure',
      component: 'b2b-sweep-scheduler',
      details: { reason, ...details },
    })
  }
  if (maxQueueDepth > 0 || maxQueueAgeSecondsTier1 > 0 || maxQueueAgeSecondsTier2 > 0) {
    if (ingestFanoutTiered) {
      if (!ingestFanoutQueueTier1Url || !ingestFanoutQueueTier2Url) {
        logger.warn('scheduler_disabled', { reason: 'missing_tier_queues' })
        return 0
      }
      const [tier1Stats, tier2Stats] = await Promise.all([
        getQueueStats(ingestFanoutQueueTier1Url),
        getQueueStats(ingestFanoutQueueTier2Url),
      ])
      if (maxQueueDepth > 0 && tier1Stats.total >= maxQueueDepth) {
        allowTier1 = false
        logger.warn('scheduler_backpressure', {
          reason: 'queue_depth',
          tier: 'tier_1',
          queue_depth: tier1Stats.total,
          max_queue_depth: maxQueueDepth,
        })
        emitBackpressure('queue_depth', { tier: 'tier_1', queue_depth: tier1Stats.total, max_queue_depth: maxQueueDepth })
      }
      if (maxQueueDepth > 0 && tier2Stats.total >= maxQueueDepth) {
        allowTier2 = false
        logger.warn('scheduler_backpressure', {
          reason: 'queue_depth',
          tier: 'tier_2',
          queue_depth: tier2Stats.total,
          max_queue_depth: maxQueueDepth,
        })
        emitBackpressure('queue_depth', { tier: 'tier_2', queue_depth: tier2Stats.total, max_queue_depth: maxQueueDepth })
      }
      if (maxQueueAgeSecondsTier1 > 0 || maxQueueAgeSecondsTier2 > 0) {
        const [tier1Age, tier2Age] = await Promise.all([
          getQueueAgeSeconds(ingestFanoutQueueTier1Url),
          getQueueAgeSeconds(ingestFanoutQueueTier2Url),
        ])
        if (maxQueueAgeSecondsTier1 > 0 && tier1Age >= maxQueueAgeSecondsTier1) {
          allowTier1 = false
          logger.warn('scheduler_backpressure', {
            reason: 'queue_age',
            tier: 'tier_1',
            queue_age_seconds: tier1Age,
            max_queue_age_seconds: maxQueueAgeSecondsTier1,
          })
          emitBackpressure('queue_age', { tier: 'tier_1', queue_age_seconds: tier1Age, max_queue_age_seconds: maxQueueAgeSecondsTier1 })
        }
        if (maxQueueAgeSecondsTier2 > 0 && tier2Age >= maxQueueAgeSecondsTier2) {
          allowTier2 = false
          logger.warn('scheduler_backpressure', {
            reason: 'queue_age',
            tier: 'tier_2',
            queue_age_seconds: tier2Age,
            max_queue_age_seconds: maxQueueAgeSecondsTier2,
          })
          emitBackpressure('queue_age', { tier: 'tier_2', queue_age_seconds: tier2Age, max_queue_age_seconds: maxQueueAgeSecondsTier2 })
        }
      }
    } else if (ingestFanoutQueueUrl) {
      const queueStats = await getQueueStats(ingestFanoutQueueUrl)
      if (maxQueueDepth > 0 && queueStats.total >= maxQueueDepth) {
        logger.warn('scheduler_backpressure', {
          reason: 'queue_depth',
          queue_depth: queueStats.total,
          max_queue_depth: maxQueueDepth,
        })
        emitBackpressure('queue_depth', { queue_depth: queueStats.total, max_queue_depth: maxQueueDepth })
        allowTier1 = false
        allowTier2 = false
      }
      if (maxQueueAgeSecondsCombined > 0) {
        const queueAgeSeconds = await getQueueAgeSeconds(ingestFanoutQueueUrl)
        if (queueAgeSeconds >= maxQueueAgeSecondsCombined) {
          logger.warn('scheduler_backpressure', {
            reason: 'queue_age',
            queue_age_seconds: queueAgeSeconds,
            max_queue_age_seconds: maxQueueAgeSecondsCombined,
          })
          emitBackpressure('queue_age', { queue_age_seconds: queueAgeSeconds, max_queue_age_seconds: maxQueueAgeSecondsCombined })
          allowTier1 = false
          allowTier2 = false
        }
      }
    }
  }
  // Emit a best-effort gauge for alarmability.
  recordCloudWatchMetric({
    name: 'worker_backpressure_active',
    value: backpressureActive ? 1 : 0,
    unit: 'Count',
    dimensions: {
      worker: 'b2b-sweep-scheduler',
      environment: config.envName || config.env,
    },
  })

  const pool = createPool(config.db.planeBUrl)
  const amountResolver = buildB2bAmountResolver(pool)
  const lock = new WorkerLock('b2b-sweep-scheduler', lockTtlSeconds)
  const acquired = await lock.acquireLock(60_000)
  if (!acquired) {
    logger.info('scheduler_skipped', { reason: 'lock_held' })
    await pool.end()
    return 0
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'b2b-sweep-scheduler', // gitleaks:allow -- Redis lock name, not a secret
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  try {
    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_start')
    const startTime = Date.now()
    const sweepRepo = new B2bSweepRepository(pool)

    const [rightsByProvider, allCapabilities] = await Promise.all([
      loadProviderRights(pool),
      new ProviderCapabilityRepository(pool).loadAllSupportedCapabilities(),
    ])

    const capabilityIndex = buildCapabilityIndex(allCapabilities)
    const b2bNativeCurrencyOnly = config.planeB.b2bNativeCurrencyOnly
    const b2bTierVersion = config.planeB.b2bTierVersion
    const rawMacroLanes = getMacroLanes().filter(
      lane => !b2bNativeCurrencyOnly || isNativeCurrencyCorridor(lane.corridorId),
    )

    let tierSnapshot: Map<string, CorridorTier> | null = null
    if (b2bTierVersion) {
      tierSnapshot = await loadTierSnapshot(pool, b2bTierVersion)
      logger.info('tier_snapshot_loaded', {
        tier_version: b2bTierVersion,
        snapshot_corridors: tierSnapshot.size,
      })
    }

	    const normalizedMacroLanes = normalizeMacroLanesForSweep(rawMacroLanes, {
	      tierSnapshot,
	      disableTier1: config.planeB.disableTier1,
	    })
	    let macroLanes = normalizedMacroLanes.lanes
	    if (canaryModeEnabled) {
	      const beforeLaneCount = macroLanes.length
	      if (canaryCorridors.length > 0) {
	        const allowlist = new Set(canaryCorridors)
	        macroLanes = macroLanes.filter(lane => allowlist.has(lane.corridorId.toUpperCase()))
	      }
	      macroLanes = macroLanes
	        .slice()
	        .sort((a, b) =>
	          `${a.corridorId}:${(a as { payinMethod?: string }).payinMethod ?? ''}:${(a as { payoutMethod?: string }).payoutMethod ?? ''}`
	            .localeCompare(
	              `${b.corridorId}:${(b as { payinMethod?: string }).payinMethod ?? ''}:${(b as { payoutMethod?: string }).payoutMethod ?? ''}`,
	            ),
	        )
	      if (canaryMaxLanes > 0 && macroLanes.length > canaryMaxLanes) {
	        macroLanes = macroLanes.slice(0, canaryMaxLanes)
	      }
		      logger.warn('scheduler_canary_mode_enabled', {
		        before_lanes: beforeLaneCount,
		        after_lanes: macroLanes.length,
		        force_due: canaryForceDue,
		        interval_seconds: canaryForceDue ? canaryIntervalSeconds : null,
		        max_lanes: canaryMaxLanes > 0 ? canaryMaxLanes : null,
		        corridor_allowlist_size: canaryCorridors.length > 0 ? canaryCorridors.length : null,
		      })
	      if (macroLanes.length === 0) {
	        logger.warn('scheduler_canary_mode_empty', {
	          before_lanes: beforeLaneCount,
	          corridor_allowlist_size: canaryCorridors.length > 0 ? canaryCorridors.length : null,
	        })
	        return 0
	      }
	      // Canary mode is Tier-2 oriented: never schedule Tier-1 work.
	      allowTier1 = false
	    }

    logger.info('scheduler_data_loaded', {
      tier_version: b2bTierVersion,
      disable_tier1: config.planeB.disableTier1,
      tier_snapshot_overrides: normalizedMacroLanes.stats.tierSnapshotOverrides,
      lanes_demoted_to_tier2: normalizedMacroLanes.stats.lanesDemotedToTier2,
      total_lanes: macroLanes.length,
      capabilities_loaded: allCapabilities.length,
      providers_with_rights: rightsByProvider.size,
    })

    const tier1Lanes = macroLanes.filter(lane => lane.tier === 'tier_1')
    const tier2Lanes = macroLanes.filter(lane => lane.tier === 'tier_2')

    const checkTierDue = async (tier: CorridorTier): Promise<boolean> => {
      const tierSettings = tierConfig[tier]
      const effectiveCadenceSeconds =
        canaryModeEnabled && canaryForceDue && tier === 'tier_2'
          ? canaryIntervalSeconds
          : tierSettings.cadenceSeconds
      const [activeRun, latestCompletedRun] = await Promise.all([
        sweepRepo.getActiveRunByTier(tier),
        sweepRepo.getLatestCompletedRunByTier(tier),
      ])
      const driftMinutes = recordSweepCadenceMetrics(
        tier,
        effectiveCadenceSeconds,
        latestCompletedRun,
      )

      if (activeRun) {
        const activeCreatedAtMs = activeRun.createdAt
          ? new Date(activeRun.createdAt).getTime()
          : (activeRun.startedAt ? new Date(activeRun.startedAt).getTime() : NaN)
        const ageMs = Number.isFinite(activeCreatedAtMs) ? Date.now() - activeCreatedAtMs : NaN
        const defaultStaleAfterMs = Math.max(60 * 60 * 1000, tierSettings.cadenceSeconds * 1000 * 2)
        const staleAfterMs = Number.isFinite(staleRunMaxAgeMsOverride)
          ? Math.max(60 * 1000, staleRunMaxAgeMsOverride)
          : defaultStaleAfterMs

        if (Number.isFinite(ageMs) && ageMs > staleAfterMs) {
          logger.warn('active_run_stale', {
            tier,
            run_id: activeRun.runId,
            age_seconds: Math.round(ageMs / 1000),
            stale_after_seconds: Math.round(staleAfterMs / 1000),
          })
          let markedFailed = false
          try {
            await sweepRepo.updateSweepRunStatus(activeRun.runId, 'failed', new Date())
            markedFailed = true
          } catch (error) {
            logger.warn('stale_run_mark_failed_failed', {
              tier,
              run_id: activeRun.runId,
              error: error instanceof Error ? error.message : String(error),
            })
          }
          if (markedFailed) {
            logger.warn('active_run_stale_recovered', {
              tier,
              run_id: activeRun.runId,
              age_seconds: Math.round(ageMs / 1000),
              stale_after_seconds: Math.round(staleAfterMs / 1000),
              status_set: 'failed',
            })
          }
        } else {
          logger.info('tier_skipped', {
            tier,
            reason: 'active_run',
            run_id: activeRun.runId,
            cadence_seconds: effectiveCadenceSeconds,
            drift_minutes: driftMinutes,
          })
          return false
        }
      }

      const due = isSweepTierDue({
        latestCompletedRun,
        cadenceSeconds: effectiveCadenceSeconds,
      })
      if (!due) {
        logger.debug('tier_not_due', {
          tier,
          last_completed_at: getCompletedSweepReferenceTime(latestCompletedRun)?.toISOString() ?? null,
          cadence_seconds: effectiveCadenceSeconds,
          drift_minutes: driftMinutes,
        })
        return false
      }
      return true
    }

    const [tier1DueRaw, tier2DueRaw] = await Promise.all([
      !config.planeB.disableTier1 && !canaryModeEnabled
        ? checkTierDue('tier_1')
        : Promise.resolve(false),
      checkTierDue('tier_2'),
    ])
    const tier1Due = allowTier1 && tier1DueRaw
    const tier2Due = allowTier2 && tier2DueRaw

    const dueLanes = [
      ...(tier1Due ? tier1Lanes : []),
      ...(tier2Due ? tier2Lanes : []),
    ]

    if (dueLanes.length === 0) {
      logger.info('scheduler_no_tiers_due', { tier1_due: tier1Due, tier2_due: tier2Due })
      await recordBatchJobMetric('b2b-sweep-scheduler', 'job_complete', 0)
      return 0
    }

    type LaneTask = {
      laneId: string
      corridorId: string
      payoutMethod: PayoutMethod
      providers: string[]
      amountBucket: number
      tier: CorridorTier
    }

    const tasks: LaneTask[] = []

    for (const lane of dueLanes) {
      const key = `${lane.corridorId}:${lane.payoutMethod}`
      const rawProviders = capabilityIndex.byCorridorAndMethod.get(key) ?? []

      if (rawProviders.length === 0) continue

      const eligibleProviders = filterProvidersByRights(
        rawProviders,
        lane.corridorId,
        rightsByProvider,
      )

      if (eligibleProviders.length === 0) continue

      const amountBucket = await amountResolver.resolveAmountForCorridor(
        lane.corridorId,
        B2B_FIXED_AMOUNT_USD,
      )
      tasks.push({
        laneId: lane.laneId,
        corridorId: lane.corridorId,
        payoutMethod: lane.payoutMethod,
        providers: eligibleProviders,
        amountBucket,
        tier: lane.tier,
      })
    }

    const tier1Tasks = tasks.filter(t => t.tier === 'tier_1')
    const tier2Tasks = tasks.filter(t => t.tier === 'tier_2')

    logger.info('scheduler_tasks_built', {
      total_tasks: tasks.length,
      tier1_tasks: tier1Tasks.length,
      tier2_tasks: tier2Tasks.length,
      unique_corridors: new Set(tasks.map(t => t.corridorId)).size,
      total_provider_assignments: tasks.reduce((sum, t) => sum + t.providers.length, 0),
    })

    if (tasks.length === 0) {
      logger.info('scheduler_no_tasks')
      await recordBatchJobMetric('b2b-sweep-scheduler', 'job_complete', 0)
      return 0
    }

    const createSweepRunForTier = async (tier: CorridorTier, tierTasks: LaneTask[]) => {
      if (tierTasks.length === 0) return undefined
      const cfg = tierConfig[tier]
      let runId: string | undefined
      try {
        runId = (await sweepRepo.createSweepRun({
          priorityTier: tier,
          cadenceMinutes: Math.ceil(cfg.cadenceSeconds / 60),
          targetMinutes: cfg.sloMinutes,
          observationMode: false,
          corridorsTotal: tierTasks.length,
          providersTotal: tierTasks.reduce((sum, t) => sum + t.providers.length, 0),
          status: 'running',
        })) ?? undefined
        if (!runId) {
          return undefined
        }

        const taskRows = tierTasks.flatMap((task) =>
          task.providers.map((providerId) => ({
            corridorId: task.corridorId,
            providerId,
            collectorType: cfg.collectorType,
            priorityTier: cfg.label,
            amountBucket: task.amountBucket,
            payinMethod: resolveB2bPayinMethod(providerId),
            payoutMethod: task.payoutMethod,
          })),
        )
        await sweepRepo.insertSweepTasks(runId, taskRows, { enqueuedAt: null })
        return runId
      } catch (error) {
        logger.warn('sweep_run_prepare_failed', {
          tier,
          error: error instanceof Error ? error.message : String(error),
        })
        if (runId) {
          await sweepRepo.updateSweepRunStatus(runId, 'failed', new Date()).catch((statusError) => {
            logger.warn('sweep_run_prepare_failed_status_update_failed', {
              tier,
              sweep_run_id: runId,
              error: statusError instanceof Error ? statusError.message : String(statusError),
            })
          })
        }
        return undefined
      }
    }

    const [tier1RunId, tier2RunId] = await Promise.all([
      tier1Due ? createSweepRunForTier('tier_1', tier1Tasks) : undefined,
      tier2Due ? createSweepRunForTier('tier_2', tier2Tasks) : undefined,
    ])

    const dispatchableTasks = tasks.filter((task) => {
      if (task.tier === 'tier_1') return Boolean(tier1RunId)
      return Boolean(tier2RunId)
    })

    const nowIso = new Date().toISOString()
    const messagePayloadsByQueue = new Map<string, Array<{
      id: string
      payload: unknown
      runId?: string
      taskKeys: Array<{
        providerId: string
        corridorId: string
        amountBucket: number
        payinMethod: string
        payoutMethod: string
      }>
    }>>()

    for (let idx = 0; idx < dispatchableTasks.length; idx += 1) {
      const task = dispatchableTasks[idx]
      const cfg = tierConfig[task.tier]
      const queueUrl = resolveIngestFanoutQueueUrl(cfg.label)
      if (!queueUrl) {
        logger.warn('scheduler_enqueue_skipped', {
          reason: 'missing_queue_url',
          priority_tier: cfg.label,
        })
        continue
      }
      const sweepRunId = task.tier === 'tier_1' ? tier1RunId : tier2RunId
      const providers = task.providers.map((providerId) => ({
        providerId,
        collectorType: cfg.collectorType,
        amountBuckets: [task.amountBucket],
        payinMethod: resolveB2bPayinMethod(providerId),
        payoutMethod: task.payoutMethod,
        priorityTier: cfg.label,
        freshnessSloMinutes: cfg.sloMinutes,
      }))
      const taskKeys = providers.map((provider) => ({
        providerId: provider.providerId,
        corridorId: task.corridorId,
        amountBucket: task.amountBucket,
        payinMethod: provider.payinMethod,
        payoutMethod: provider.payoutMethod,
      }))
      const rawPayload = {
        version: 'corridor_v1' as const,
        corridorId: task.corridorId,
        providers,
        requestedAt: nowIso,
        sweepRunId,
      }
      const payload = wrapEnvelope(
        resolveIngestQueueClassFromPriorityTier(cfg.label),
        rawPayload,
        {
          runId: sweepRunId,
          correlationId: task.corridorId,
        },
      )
      const bucket = messagePayloadsByQueue.get(queueUrl)
      if (bucket) {
        bucket.push({ id: `${idx}-${task.tier}`, payload, runId: sweepRunId, taskKeys })
      } else {
        messagePayloadsByQueue.set(queueUrl, [{ id: `${idx}-${task.tier}`, payload, runId: sweepRunId, taskKeys }])
      }
    }

    let enqueued = 0
    let failed = 0
    const batchSize = 10

    for (const [queueUrl, messages] of messagePayloadsByQueue.entries()) {
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        const messageMeta = new Map(batch.map((message) => [message.id, message]))
        const results = await sendBatchJsonMessages(
          queueUrl,
          batch.map(({ id, payload }) => ({ id, payload })),
        )
        const enqueuedByRun = new Map<string, typeof batch[number]['taskKeys']>()
        const failedByRun = new Map<string, typeof batch[number]['taskKeys']>()
        for (const r of results) {
          const meta = messageMeta.get(r.id)
          if (!meta) {
            continue
          }
          if (r.success) {
            enqueued += 1
            if (meta.runId) {
              const existing = enqueuedByRun.get(meta.runId) ?? []
              existing.push(...meta.taskKeys)
              enqueuedByRun.set(meta.runId, existing)
            }
            continue
          }

          failed += 1
          if (meta.runId) {
            const existing = failedByRun.get(meta.runId) ?? []
            existing.push(...meta.taskKeys)
            failedByRun.set(meta.runId, existing)
          }
          logger.warn('scheduler_enqueue_failed', {
            queue_url: queueUrl,
            priority_tier: meta.runId === tier2RunId ? 'tier_2' : 'tier_1',
            error: r.error ?? 'unknown',
          })
        }

        await Promise.all([
          ...Array.from(enqueuedByRun.entries()).map(([runId, taskKeys]) =>
            sweepRepo.markTasksEnqueued(runId, taskKeys)),
          ...Array.from(failedByRun.entries()).map(([runId, taskKeys]) =>
            sweepRepo.markTasksFinishedBatch(runId, taskKeys, 'failed', 'enqueue_failed')),
        ])

        for (const runId of failedByRun.keys()) {
          const summary = await sweepRepo.getRunSummary(runId)
          if (summary.remaining === 0) {
            const status = summary.failed > 0 ? 'failed' : 'completed'
            await sweepRepo.updateSweepRunStatus(runId, status, new Date()).catch((error) => {
              logger.warn('sweep_status_update_failed', {
                sweep_run_id: runId,
                status,
                error: error instanceof Error ? error.message : String(error),
              })
            })
          }
        }
      }
    }

    const durationMs = Date.now() - startTime
    logger.info('scheduler_complete', {
      tasks: dispatchableTasks.length,
      tier1_tasks: tier1Tasks.length,
      tier2_tasks: tier2Tasks.length,
      queue_urls: Array.from(messagePayloadsByQueue.keys()),
      enqueued,
      failed,
      duration_ms: durationMs,
      tier1_run_id: tier1RunId ?? null,
      tier2_run_id: tier2RunId ?? null,
    })

    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_complete', Math.ceil(durationMs / 1000), {
      enqueued: String(enqueued),
      tier1_tasks: String(tier1Tasks.length),
      tier2_tasks: String(tier2Tasks.length),
    })

    return enqueued
  } catch (error) {
    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_failure')
    logger.error('scheduler_error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return 0
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release().catch((error) => {
      logger.warn('lock_release_failed', {
        lock_key: 'b2b-sweep-scheduler', // gitleaks:allow -- Redis lock name, not a secret
        error: error instanceof Error ? error.message : String(error),
      })
    })
    await pool.end()
  }
}

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
})

export const runB2bSweepLoop = async () => {
  if (!isLambdaRuntime && healthEnabled) {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'b2b-sweep-scheduler',
        enableDatabaseCheck: true,
        enableRedisCheck: true,
      })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  try {
    while (!isShutdownRequested()) {
      await runB2bSweepScheduler()
      if (!loopEnabled) {
        return
      }
      await sleep(loopDelayMs)
    }
  } finally {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
  }
}

if (require.main === module) {
  void runB2bSweepLoop()
}
