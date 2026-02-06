import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createPool, query } from '../../shared/db'
import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing, startSpan, getCurrentSpan } from '../../shared/tracing'
import { getQueueAgeSeconds, getQueueStats, sendBatchJsonMessages, sendJsonMessage } from '../../shared/sqs'
import { partitionCorridors } from '../../shared/sharding'
import { parseCorridorId } from '../../shared/corridor'
import { getCountryByCode } from '../../shared/countries-currencies'
import { isMacroCorridor, getMacroLanes, B2B_FIXED_AMOUNT_USD, type PayoutMethod } from '../../shared/macro-corridors'
import {
  getCorridorTier,
  TIER_1_CADENCE_SECONDS,
  TIER_2_CADENCE_SECONDS,
  TIER_1_SLO_MINUTES,
  TIER_2_SLO_MINUTES,
  type CorridorTier,
} from '../../shared/corridor-tiers'
import { startHealthServerOnce, stopHealthServerOnce } from './health-server'
import { providerRegistry, type ProviderRegistryEntry } from './providers'
import { processQuoteRefreshQueue } from './quote-refresh'
import {
  B2bSweepRepository,
  FreshnessReportRepository,
  IngestionRunRepository,
  LatestQuoteRepository,
  ProviderCapabilityRepository,
  RightsMatrixRepository,
} from './repositories'
import { buildB2bAmountResolver } from './services/b2b-amount'
import { filterQueuesByRightsMatrix } from './services/rights-matrix-filter'
import { VolatilityService } from './services/volatility-service'

if (config.env === 'production' || config.env === 'staging' || process.env.STRICT_CONFIG === '1') {
  assertRuntimeConfig({
    requirePlaneB: true,
    requireRedis: true,
  })
}

initErrorTracking('plane-b')
initTracing('plane-b')

type IngestOptions = {
  pool?: Pool
}

const logger = createLogger('plane-b.ingest')
const shutdownTimeoutMs = 30000
const ingestFanoutMode = config.queues.ingestFanout.mode
const ingestFanoutQueueUrl = config.queues.ingestFanout.url
const ingestFanoutQueueTier1Url = config.queues.ingestFanout.tier1Url
const ingestFanoutQueueTier2Url = config.queues.ingestFanout.tier2Url
const disableTier1 = config.planeB.disableTier1
const ingestFanoutTiered = Boolean(ingestFanoutQueueTier1Url && ingestFanoutQueueTier2Url)
const ingestFanoutTierMisconfigured =
  (Boolean(ingestFanoutQueueTier1Url) || Boolean(ingestFanoutQueueTier2Url))
  && !ingestFanoutTiered
const ingestFanoutEnabled = ingestFanoutMode !== 'off' && Boolean(ingestFanoutQueueUrl)
const fanoutMessageMode =
  process.env.PLANE_B_INGEST_FANOUT_MESSAGE_MODE === 'provider'
    ? 'provider'
    : 'corridor'
const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
const rawCorridorProviderBatchSize = Number.parseInt(
  process.env.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE || '0',
  10,
)
const corridorProviderBatchSize = Number.isFinite(rawCorridorProviderBatchSize)
  ? Math.max(0, rawCorridorProviderBatchSize)
  : 0
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
  intermex: config.planeB.intermex.b2bAmount,
  koronapay: config.planeB.koronapay.b2bAmount,
  remitbee: config.planeB.remitbee.b2bAmount,
  singx: config.planeB.singx.b2bAmount,
  placid: config.planeB.placid.b2bAmount,
}
const resolveB2bAmount = (providerId: string) => {
  return b2bAmountByProvider[providerId] ?? config.planeB.remitly.b2bAmount
}
const defaultB2bPayinMethod = 'bank_transfer'
const defaultB2bPayoutMethod = 'bank_deposit'
const b2bPayinMethodByProvider: Record<string, string> = {
  koronapay: 'debit_card',
  paysend: 'debit_card',
  remitbee: 'debit_card',
  sendwave: 'debit_card',
  intermex: 'debit_card',
  placid: 'debit_card',
  ria: 'debit_card',
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
const resolveB2bPayoutMethod = (providerId: string) => {
  return b2bPayoutMethodByProvider[providerId] ?? defaultB2bPayoutMethod
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
  traceId?: string
}

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
  sweepRunId?: string
}

type IngestFanoutCorridorMessage = {
  version: 'corridor_v1'
  corridorId: string
  providers: IngestFanoutProviderTask[]
  requestedAt: string
  sweepRunId?: string
  traceId?: string
}

type IngestFanoutPayload = IngestFanoutMessage | IngestFanoutCorridorMessage

const isCorridorPayload = (
  payload: IngestFanoutPayload,
): payload is IngestFanoutCorridorMessage => {
  return 'version' in payload && payload.version === 'corridor_v1'
}

const resolveIngestFanoutQueueUrl = (priorityTier?: string): string | null => {
  if (ingestFanoutTierMisconfigured) {
    return null
  }
  if (ingestFanoutTiered) {
    if (!ingestFanoutQueueTier1Url || !ingestFanoutQueueTier2Url) {
      return null
    }
    if (disableTier1) return ingestFanoutQueueTier2Url
    return priorityTier === 'tier_2' ? ingestFanoutQueueTier2Url : ingestFanoutQueueTier1Url
  }
  return ingestFanoutQueueUrl || null
}

const enqueueIngestFanout = async (payload: IngestFanoutPayload): Promise<boolean> => {
  const queueUrl = resolveIngestFanoutQueueUrl(
    isCorridorPayload(payload)
      ? payload.providers[0]?.priorityTier
      : payload.priorityTier,
  )
  if (!queueUrl) {
    return false
  }

  const providerId = isCorridorPayload(payload)
    ? payload.providers.map(task => task.providerId).join(',')
    : payload.providerId
  const collectorType = isCorridorPayload(payload)
    ? payload.providers.map(task => task.collectorType).join(',')
    : payload.collectorType

  try {
    await sendJsonMessage(queueUrl, payload)
    return true
  } catch (error) {
    logger.warn('ingest_fanout_enqueue_failed', {
      provider_id: providerId,
      collector_type: collectorType,
      queue_url: queueUrl,
      sweep_run_id: payload.sweepRunId ?? null,
      requested_at: payload.requestedAt ?? null,
      trace_id: payload.traceId ?? null,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
  stopHealthServerOnce().catch((error) => {
    logger.warn('health_server_close_failed', { error })
  })

  forceExitTimer = setTimeout(() => {
    logger.warn('shutdown_forced', { timeout_ms: shutdownTimeoutMs })
    process.exit(1)
  }, shutdownTimeoutMs)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

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


const getLastPrioritySweepAgeSeconds = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
) => {
  const repo = new IngestionRunRepository(pool)
  return repo.getLastSweepAgeSeconds(providerId, collectorType)
}

const shouldRunPrioritySweep = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
  intervalSeconds: number,
) => {
  if (intervalSeconds <= 0) {
    return { due: true, ageSeconds: null }
  }
  const ageSeconds = await getLastPrioritySweepAgeSeconds(pool, providerId, collectorType)
  if (ageSeconds === null) {
    return { due: true, ageSeconds: null }
  }
  return { due: ageSeconds >= intervalSeconds, ageSeconds }
}


const loadUnsupportedCorridorsForProvider = async (pool: Pool, providerId: string) => {
  const repo = new ProviderCapabilityRepository(pool)
  const rows = await repo.loadUnsupportedCorridors(providerId)
  return new Set(rows.map(row => row.corridor_id).filter((id): id is string => Boolean(id)))
}

type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  all: string[]
}

const loadPriorityQueues = async (
  pool: Pool,
  providerId: string,
  tierVersion?: string,
): Promise<PriorityQueues> => {
  const repo = new ProviderCapabilityRepository(pool)
  const queues: PriorityQueues = {
    tier1: [],
    tier2: [],
    all: [],
  }

  if (tierVersion) {
    const rows = await repo.loadPriorityCorridors(providerId, tierVersion)
    for (const row of rows) {
      if (!row.corridor_id) continue
      if (!isMacroCorridor(row.corridor_id)) continue
      queues.all.push(row.corridor_id)
      if (row.priority_tier === 'tier_1' && !disableTier1) {
        queues.tier1.push(row.corridor_id)
      } else {
        queues.tier2.push(row.corridor_id)
      }
    }
  } else {
    const rows = await repo.loadObservedCorridors(providerId)
    for (const row of rows) {
      if (!row.corridor_id) continue
      if (!isMacroCorridor(row.corridor_id)) continue
      queues.all.push(row.corridor_id)
      const tier = getCorridorTier(row.corridor_id)
      if (tier === 'tier_1') {
        queues.tier1.push(row.corridor_id)
      } else {
        queues.tier2.push(row.corridor_id)
      }
    }
  }
  return queues
}

const buildExpandedQueues = (options: {
  capabilityQueues: PriorityQueues
  supportedCorridors: string[]
  unsupportedCorridors: Set<string>
}) => {
  const {
    capabilityQueues,
    supportedCorridors,
    unsupportedCorridors,
  } = options
  const combined: string[] = []
  const seen = new Set<string>()
  const addCorridor = (corridorId: string) => {
    if (!corridorId) return
    if (unsupportedCorridors.has(corridorId)) return
    if (seen.has(corridorId)) return
    if (!isMacroCorridor(corridorId)) return
    seen.add(corridorId)
    combined.push(corridorId)
  }

  for (const corridorId of capabilityQueues.all) addCorridor(corridorId)
  for (const corridorId of supportedCorridors) addCorridor(corridorId)

  const queues: PriorityQueues = { tier1: [], tier2: [], all: [] }
  for (const corridorId of combined) {
    const tier = getCorridorTier(corridorId)
    queues.all.push(corridorId)
    if (tier === 'tier_1') {
      queues.tier1.push(corridorId)
    } else {
      queues.tier2.push(corridorId)
    }
  }

  return queues
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

const filterQueuesByNativeCurrency = (queues: PriorityQueues): PriorityQueues => {
  const filter = (corridors: string[]) => corridors.filter(isNativeCurrencyCorridor)
  return {
    tier1: filter(queues.tier1),
    tier2: filter(queues.tier2),
    all: filter(queues.all),
  }
}

type RightsMatrixEntry = {
  allowedCollect: boolean
  allowedB2b: boolean
  stoplistStatus: string
  sourceCountries: string[] | null
  destinationCountries: string[] | null
}

const loadProviderRights = async (pool: Pool) => {
  const repo = new RightsMatrixRepository(pool)
  const rows = await repo.loadProviderRights()
  const rights = new Map<string, RightsMatrixEntry>()
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

type PriorityTierKey = 'tier1' | 'tier2'

type PriorityTierConfigEntry = {
  label: string
  collectorType: string
  intervalSeconds: number
  rpm: number
  perCorridorRpm: number
  sloMinutes: number
}

type PriorityTierConfig = Record<PriorityTierKey, PriorityTierConfigEntry>

const loadFreshnessLagByCorridor = async (
  pool: Pool,
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
  pool: Pool,
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
  pool: Pool
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

const reportSweepDurations = async (pool: Pool) => {
  const repo = new IngestionRunRepository(pool)
  const rows = await repo.loadLatestSweepDurations()
  logger.info('b2b_sweep_duration_report', { providers: rows })
}

const createProviderSweepRun = async (options: {
  sweepRepo: B2bSweepRepository
  providerId: string
  collectorType: string
  priorityTier: string
  cadenceMinutes: number
  targetMinutes: number
  corridors: string[]
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
}): Promise<string | undefined> => {
  const {
    sweepRepo,
    providerId,
    collectorType,
    priorityTier,
    cadenceMinutes,
    targetMinutes,
    corridors,
    amountBuckets,
    payinMethod,
    payoutMethod,
  } = options
  if (corridors.length === 0) return undefined

  let runId: string | undefined
  try {
    runId = await sweepRepo.createSweepRun({
      priorityTier,
      cadenceMinutes,
      targetMinutes,
      observationMode: false,
      corridorsTotal: corridors.length,
      providersTotal: 1,
      status: 'running',
    })
  } catch (error) {
    logger.warn('b2b_sweep_run_create_failed', {
      provider_id: providerId,
      priority_tier: priorityTier,
      error: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }

  if (!runId) return undefined

  const tasks = corridors.flatMap(corridorId =>
    amountBuckets.map(amountBucket => ({
      corridorId,
      providerId,
      collectorType,
      priorityTier,
      amountBucket,
      payinMethod,
      payoutMethod,
    })),
  )

  try {
    await sweepRepo.insertSweepTasks(runId, tasks)
  } catch (error) {
    logger.warn('b2b_sweep_task_insert_failed', {
      sweep_run_id: runId,
      provider_id: providerId,
      priority_tier: priorityTier,
      error: error instanceof Error ? error.message : String(error),
    })
    await sweepRepo.updateSweepRunStatus(runId, 'failed', new Date())
    return undefined
  }

  return runId
}

export const runIngestion = async (options: IngestOptions = {}) => {
  if (shutdownRequested) {
    logger.info('ingestion_skipped', { reason: 'shutdown_requested' })
    return false
  }

  return await startSpan(
    'plane-b.ingest.run',
    async () => {
      if (!config.planeB.useSeedData) {
        const pool = options.pool ?? createPool(config.db.planeBUrl)
        const shouldClose = !options.pool
        const volatilityService = new VolatilityService(pool)
        const sweepRepo = new B2bSweepRepository(pool)

        const healthEnabled = process.env.PLANE_B_HEALTH_ENABLED !== '0'

        if (healthEnabled) {
          try {
            await startHealthServerOnce({ logger })
          } catch (error) {
            logger.warn('health_server_start_failed', { error })
          }
        }

        logger.info('ingestion_start', { mode: 'collector' })
        if (ingestFanoutMode !== 'off') {
          if (!ingestFanoutQueueUrl) {
            logger.warn('ingest_fanout_disabled', { reason: 'missing_queue_url' })
          } else {
            logger.info('ingest_fanout_enabled', {
              mode: ingestFanoutMode,
              queue_url: ingestFanoutQueueUrl,
              tiered: ingestFanoutTiered,
              tier1_queue_url: ingestFanoutQueueTier1Url || null,
              tier2_queue_url: ingestFanoutQueueTier2Url || null,
              message_mode: fanoutMessageMode,
            })
          }
        }
        let queueStats: Awaited<ReturnType<typeof getQueueStats>> | null = null
        let queueStatsTier2: Awaited<ReturnType<typeof getQueueStats>> | null = null
        let queueAgeSeconds = 0
        let queueAgeTier2Seconds = 0
        let totalQueueDepth = 0
        const maxQueueDepth = Math.max(config.planeB.b2bMaxQueueDepth || 0, 0)
        const maxQueueAgeSeconds = Math.max(config.planeB.b2bMaxQueueAgeSeconds || 0, 0)
        if (ingestFanoutMode === 'queue' && ingestFanoutEnabled) {
          if (config.planeB.b2bDrainMode) {
            logger.warn('ingest_fanout_backpressure', {
              reason: 'drain_mode',
            })
            return false
          }
          if (ingestFanoutTierMisconfigured) {
            logger.error('ingest_fanout_disabled', { reason: 'missing_tier_queues' })
            return false
          }
          if (ingestFanoutTiered) {
            if (maxQueueDepth > 0 || maxQueueAgeSeconds > 0) {
              queueStats = await getQueueStats(ingestFanoutQueueTier1Url)
              queueStatsTier2 = await getQueueStats(ingestFanoutQueueTier2Url)
              totalQueueDepth = queueStats.total + queueStatsTier2.total
              if (maxQueueDepth > 0 && totalQueueDepth >= maxQueueDepth) {
                logger.warn('ingest_fanout_backpressure', {
                  queue_depth: totalQueueDepth,
                  tier1_depth: queueStats.total,
                  tier2_depth: queueStatsTier2.total,
                  max_queue_depth: maxQueueDepth,
                })
                return false
              }
              if (maxQueueAgeSeconds > 0) {
                queueAgeSeconds = await getQueueAgeSeconds(ingestFanoutQueueTier1Url)
                queueAgeTier2Seconds = await getQueueAgeSeconds(ingestFanoutQueueTier2Url)
                const maxObservedAge = Math.max(queueAgeSeconds, queueAgeTier2Seconds)
                if (maxObservedAge >= maxQueueAgeSeconds) {
                  logger.warn('ingest_fanout_backpressure', {
                    reason: 'queue_age',
                    queue_age_seconds: maxObservedAge,
                    tier1_age_seconds: queueAgeSeconds,
                    tier2_age_seconds: queueAgeTier2Seconds,
                    max_queue_age_seconds: maxQueueAgeSeconds,
                  })
                  return false
                }
              }
            }
          } else if (ingestFanoutQueueUrl) {
            if (maxQueueDepth > 0 || maxQueueAgeSeconds > 0) {
              queueStats = await getQueueStats(ingestFanoutQueueUrl)
              totalQueueDepth = queueStats.total
              if (maxQueueDepth > 0 && queueStats.total >= maxQueueDepth) {
                logger.warn('ingest_fanout_backpressure', {
                  queue_depth: queueStats.total,
                  queue_visible: queueStats.visible,
                  queue_in_flight: queueStats.inFlight,
                  queue_delayed: queueStats.delayed,
                  max_queue_depth: maxQueueDepth,
                })
                return false
              }
              if (maxQueueAgeSeconds > 0) {
                queueAgeSeconds = await getQueueAgeSeconds(ingestFanoutQueueUrl)
                if (queueAgeSeconds >= maxQueueAgeSeconds) {
                  logger.warn('ingest_fanout_backpressure', {
                    reason: 'queue_age',
                    queue_age_seconds: queueAgeSeconds,
                    max_queue_age_seconds: maxQueueAgeSeconds,
                  })
                  return false
                }
              }
            }
          }
        }
        if (config.planeB.b2cQueueInSweep) {
          if (ingestFanoutMode === 'queue' && ingestFanoutEnabled && maxQueueDepth > 0) {
            if (ingestFanoutTiered && ingestFanoutQueueTier1Url && ingestFanoutQueueTier2Url) {
              if (!queueStats) {
                queueStats = await getQueueStats(ingestFanoutQueueTier1Url)
              }
              if (!queueStatsTier2) {
                queueStatsTier2 = await getQueueStats(ingestFanoutQueueTier2Url)
              }
              totalQueueDepth = queueStats.total + queueStatsTier2.total
            } else if (!queueStats && ingestFanoutQueueUrl) {
              queueStats = await getQueueStats(ingestFanoutQueueUrl)
              totalQueueDepth = queueStats.total
            }
            const b2cQueueThreshold = Math.max(1, Math.floor(maxQueueDepth * 0.25))
            if (totalQueueDepth >= b2cQueueThreshold) {
              logger.info('b2c_queue_in_sweep_skipped', {
                queue_depth: totalQueueDepth,
                threshold: b2cQueueThreshold,
                max_queue_depth: maxQueueDepth,
              })
              return true
            }
          }
          await processQuoteRefreshQueue({ pool })
        }
        const b2bFreshnessSloEnabled = config.planeB.b2bFreshnessSloEnabled
        const b2bNativeCurrencyOnly = config.planeB.b2bNativeCurrencyOnly
        const b2bWiseCurrencyOverride = config.planeB.b2bWiseCurrencyOverride
        const b2bTierVersion = config.planeB.b2bTierVersion
        const maxTargetMinutes = Math.max(config.planeB.b2bMaxTargetMinutes || 0, 1440)
        const rawTargetMinutes = config.planeB.b2bTargetMinutes || 240
        const targetMinutes = Math.min(rawTargetMinutes, maxTargetMinutes)
        if (rawTargetMinutes > maxTargetMinutes && maxTargetMinutes > 0) {
          logger.info('b2b_target_minutes_capped', {
            raw_target_minutes: rawTargetMinutes,
            capped_target_minutes: maxTargetMinutes,
          })
        }
        const planMinutes = targetMinutes > 0 ? targetMinutes : 240
        const shardPlanConfig = {
          minShards: config.planeB.b2bMinShards,
          maxCorridorsPerShard: config.planeB.b2bMaxCorridorsPerShard,
        }
        const rpmSafetyFactor = Number.isFinite(config.planeB.b2bRpmSafetyFactor)
          ? Math.min(Math.max(config.planeB.b2bRpmSafetyFactor, 0.1), 1)
          : 0.7
        const rpmMultiplier = Number.isFinite(config.planeB.b2bRpmMultiplier)
          ? Math.max(config.planeB.b2bRpmMultiplier, 0)
          : 1
        const perCorridorRpmMultiplier = Number.isFinite(config.planeB.b2bPerCorridorRpmMultiplier)
          ? Math.max(config.planeB.b2bPerCorridorRpmMultiplier, 0)
          : 1
        const priorityTierConfig: PriorityTierConfig = {
          tier1: {
            label: 'tier_1',
            collectorType: 'b2b_tier_1',
            intervalSeconds: TIER_1_CADENCE_SECONDS,
            rpm: 12,
            perCorridorRpm: 12,
            sloMinutes: TIER_1_SLO_MINUTES,
          },
          tier2: {
            label: 'tier_2',
            collectorType: 'b2b_tier_2',
            intervalSeconds: TIER_2_CADENCE_SECONDS,
            rpm: 6,
            perCorridorRpm: 6,
            sloMinutes: TIER_2_SLO_MINUTES,
          },
        }
        const priorityTierOrder: PriorityTierKey[] = disableTier1 ? ['tier2'] : ['tier1', 'tier2']
        const targetMinutesByTierKey: Record<PriorityTierKey, number> = {
          tier1: Math.max(1, Math.round(priorityTierConfig.tier1.intervalSeconds / 60)),
          tier2: planMinutes,
        }

    const rightsByProvider = await loadProviderRights(pool)
    const providers = providerRegistry
    const baseRatesByProvider = new Map(
      providerRegistry.map((provider) => [provider.providerId, provider.baseRates]),
    )
    const eligibleProviders: ProviderRegistryEntry[] = []
    const providerResults = new Map<string, boolean | null>()
    for (const provider of providers) {
      const providerId = provider.providerId
      const rights = rightsByProvider.get(providerId)
      if (!rights) {
        logger.info('b2b_sweep_skipped', { provider_id: providerId, reason: 'rights_missing' })
        providerResults.set(providerId, null)
        continue
      }
      if (!rights.allowedCollect) {
        logger.info('b2b_sweep_skipped', { provider_id: providerId, reason: 'allowed_collect_false' })
        providerResults.set(providerId, null)
        continue
      }
      if (!rights.allowedB2b) {
        logger.info('b2b_sweep_skipped', { provider_id: providerId, reason: 'allowed_b2b_false' })
        providerResults.set(providerId, null)
        continue
      }
      if (rights.stoplistStatus !== 'active') {
        logger.info('b2b_sweep_skipped', {
          provider_id: providerId,
          reason: `stoplist_${rights.stoplistStatus}`,
        })
        providerResults.set(providerId, null)
        continue
      }
      eligibleProviders.push(provider)
    }
    const providerIds = eligibleProviders.map(provider => provider.providerId)
    logger.info('loading_priority_queues', {
      tier_version: b2bTierVersion,
      provider_count: providerIds.length,
    })
    const queueEntries = await Promise.all(
      providerIds.map(async (providerId) => [
        providerId,
        await loadPriorityQueues(pool, providerId, b2bTierVersion),
      ] as const),
    )
    const queuesByProvider = new Map(queueEntries)
    const corridorFanoutEnabled =
      ingestFanoutMode === 'queue' && ingestFanoutEnabled && fanoutMessageMode === 'corridor'
    const corridorFanoutTasks = corridorFanoutEnabled
      ? new Map<
          string,
          {
            corridorId: string
            providers: IngestFanoutProviderTask[]
            providerKeys: Map<string, string | undefined>
          }
        >()
      : null
    const queuedSweeps: Array<{
      providerId: string
      collectorType: string
      corridorsCount: number
      shardsCount: number
      priorityTier: string
    }> = []

    try {
      const addCorridorTask = (corridorId: string, task: IngestFanoutProviderTask) => {
        if (!corridorFanoutTasks) return
        let entry = corridorFanoutTasks.get(corridorId)
        if (!entry) {
          entry = { corridorId, providers: [], providerKeys: new Map() }
          corridorFanoutTasks.set(corridorId, entry)
        }
        const key = [
          task.providerId,
          task.collectorType,
          task.payinMethod,
          task.payoutMethod,
          task.amountBuckets.join(','),
        ].join('|')
        if (entry.providerKeys.has(key)) {
          const existingTier = entry.providerKeys.get(key)
          if (existingTier && task.priorityTier && existingTier !== task.priorityTier) {
            logger.info('b2b_corridor_task_deduped', {
              corridor_id: corridorId,
              provider_id: task.providerId,
              existing_tier: existingTier,
              skipped_tier: task.priorityTier,
            })
          }
          return
        }
        entry.providerKeys.set(key, task.priorityTier)
        entry.providers.push(task)
      }

      const buildTierPlan = async (
        providerId: string,
        corridors: string[],
        tierKey: PriorityTierKey,
        targetMinutes: number,
        amountByCorridor: Map<string, number>,
        fallbackAmount: number,
      ): Promise<PriorityTierPlan> => {
        const tierConfig = priorityTierConfig[tierKey]
        const eligibleCorridors = corridors
        const payinMethod = resolveB2bPayinMethod(providerId)
        const payoutMethod = resolveB2bPayoutMethod(providerId)
        const freshness = await applyFreshnessSlo({
          pool,
          providerId,
          corridors: eligibleCorridors,
          amountByCorridor,
          fallbackAmount,
          payinMethod,
          payoutMethod,
          sloMinutes: tierConfig.sloMinutes,
          enabled: b2bFreshnessSloEnabled,
        })
        const filteredCount = freshness.filteredCorridors.length
        const baseRates = baseRatesByProvider.get(providerId)
        const rawMaxRpm = (baseRates?.rpm ?? tierConfig.rpm) * rpmMultiplier
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
          (baseRates?.perCorridorRpm ?? tierConfig.perCorridorRpm) * perCorridorRpmMultiplier,
        )
        if (requiredRpm && requiredRpm > rpmCap) {
          logger.info('b2b_rpm_shortfall', {
            provider_id: providerId,
            priority_tier: tierConfig.label,
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

      const amountResolver = buildB2bAmountResolver(pool)

      for (const provider of eligibleProviders) {
        const providerId = provider.providerId
        const b2bAmountFallback = resolveB2bAmount(providerId)
        const payinMethod = resolveB2bPayinMethod(providerId)
        const payoutMethod = resolveB2bPayoutMethod(providerId)
        const sweptCorridors = new Set<string>()

        const queue = queuesByProvider.get(providerId) ?? {
          tier1: [],
          tier2: [],
          all: [],
        }
        const unsupportedCorridors = await loadUnsupportedCorridorsForProvider(pool, providerId)
        let queues = buildExpandedQueues({
          capabilityQueues: queue,
          supportedCorridors: provider.supportedCorridors,
          unsupportedCorridors,
        })
        queues = filterQueuesByRightsMatrix(queues, rightsByProvider.get(providerId), providerId)
        if (b2bNativeCurrencyOnly && !(b2bWiseCurrencyOverride && providerId === 'wise')) {
          const beforeCounts = {
            all: queues.all.length,
            tier1: queues.tier1.length,
            tier2: queues.tier2.length,
          }
          queues = filterQueuesByNativeCurrency(queues)
          logger.info('b2b_native_currency_filter', {
            provider_id: providerId,
            before_all: beforeCounts.all,
            after_all: queues.all.length,
            before_tier1: beforeCounts.tier1,
            after_tier1: queues.tier1.length,
            before_tier2: beforeCounts.tier2,
            after_tier2: queues.tier2.length,
          })
        }

        const amountByCorridor = await amountResolver.resolveAmountMap(queues.all, b2bAmountFallback)

        const tier1Plan = await buildTierPlan(
          providerId,
          queues.tier1,
          'tier1',
          targetMinutesByTierKey.tier1,
          amountByCorridor,
          b2bAmountFallback,
        )
        const tier2Plan = await buildTierPlan(
          providerId,
          queues.tier2,
          'tier2',
          targetMinutesByTierKey.tier2,
          amountByCorridor,
          b2bAmountFallback,
        )

        logger.info('b2b_priority_plan', {
          provider_id: providerId,
          observed_corridors: queues.all.length,
          tier1_corridors: queues.tier1.length,
          tier2_corridors: queues.tier2.length,
          tier1_eligible_corridors: tier1Plan.eligibleCorridors.length,
          tier2_eligible_corridors: tier2Plan.eligibleCorridors.length,
          tier1_stale_corridors: tier1Plan.freshness.staleCorridors.length,
          tier2_stale_corridors: tier2Plan.freshness.staleCorridors.length,
          tier1_shards: tier1Plan.targetShards,
          tier2_shards: tier2Plan.targetShards,
          tier1_interval_seconds: priorityTierConfig.tier1.intervalSeconds,
          tier2_interval_seconds: priorityTierConfig.tier2.intervalSeconds,
          tier1_rpm: priorityTierConfig.tier1.rpm,
          tier2_rpm: priorityTierConfig.tier2.rpm,
          tier1_rpm_override: tier1Plan.rpmOverride,
          tier2_rpm_override: tier2Plan.rpmOverride,
          tier1_required_rpm: tier1Plan.requiredRpm,
          tier2_required_rpm: tier2Plan.requiredRpm,
          tier1_max_rpm: tier1Plan.maxRpm,
          tier2_max_rpm: tier2Plan.maxRpm,
          rpm_safety_factor: rpmSafetyFactor,
          freshness_slo_enabled: b2bFreshnessSloEnabled,
          target_minutes: targetMinutes || null,
          plan_minutes: planMinutes,
        })

        const tierPlans = {
          tier1: tier1Plan,
          tier2: tier2Plan,
        }

        let providerOk: boolean | null = null
        for (const tierKey of priorityTierOrder) {
          const tierConfig = priorityTierConfig[tierKey]
          const plan = tierPlans[tierKey]
          const corridorsPerShard = plan.partitions.map(partition => partition.length)
          logger.info('b2b_partition_plan', {
            provider_id: providerId,
            priority_tier: tierConfig.label,
            total_corridors: plan.freshness.filteredCorridors.length,
            target_shards: plan.targetShards,
            corridors_per_shard: corridorsPerShard,
            rpm_override: plan.rpmOverride,
            required_rpm: plan.requiredRpm,
            max_rpm: plan.maxRpm,
          })
          const gate = await shouldRunPrioritySweep(
            pool,
            providerId,
            tierConfig.collectorType,
            tierConfig.intervalSeconds,
          )
          if (!gate.due) {
            logger.info('b2b_sweep_skipped', {
              provider_id: providerId,
              priority_tier: tierConfig.label,
              reason: 'interval_not_due',
              age_seconds: gate.ageSeconds,
              interval_seconds: tierConfig.intervalSeconds,
            })
            continue
          }

          if (plan.freshness.filteredCorridors.length === 0) {
            const reason = plan.corridors.length === 0
              ? 'no_priority_corridors'
              : plan.eligibleCorridors.length === 0
                ? 'coverage_filter'
                : b2bFreshnessSloEnabled && plan.freshness.filteredCorridors.length === 0
                  ? 'freshness_slo'
                  : 'no_corridors'
            logger.info('b2b_sweep_skipped', {
              provider_id: providerId,
              priority_tier: tierConfig.label,
              reason,
              tier_corridors: plan.corridors.length,
              tier_eligible_corridors: plan.eligibleCorridors.length,
              tier_stale_corridors: plan.freshness.staleCorridors.length,
              tier_fresh_corridors: plan.freshness.freshCorridors.length,
              target_shards: plan.targetShards,
              corridors_per_shard: corridorsPerShard,
            })
            continue
          }

          const amountBuckets = [b2bAmountFallback]
          let sweepRunId: string | undefined
          if (ingestFanoutMode === 'queue' && ingestFanoutEnabled) {
            sweepRunId = await createProviderSweepRun({
              sweepRepo,
              providerId,
              collectorType: tierConfig.collectorType,
              priorityTier: tierConfig.label,
              cadenceMinutes: Math.max(1, Math.round(tierConfig.intervalSeconds / 60)),
              targetMinutes: targetMinutesByTierKey[tierKey],
              corridors: plan.freshness.filteredCorridors,
              amountBuckets,
              payinMethod,
              payoutMethod,
            })
          }

          try {
            if (corridorFanoutEnabled) {
              for (const corridorId of plan.freshness.filteredCorridors) {
                const amountBucket = amountByCorridor.get(corridorId) ?? b2bAmountFallback
                const providerTask: IngestFanoutProviderTask = {
                  providerId,
                  collectorType: tierConfig.collectorType,
                  amountBuckets: [amountBucket],
                  payinMethod,
                  payoutMethod,
                  freshnessSloMinutes: tierConfig.sloMinutes,
                  freshnessSloEnabled: b2bFreshnessSloEnabled,
                  rpmOverride: plan.rpmOverride,
                  perCorridorRpmOverride: plan.perCorridorRpmOverride,
                  priorityTier: tierConfig.label,
                  sweepRunId,
                }
                addCorridorTask(corridorId, providerTask)
              }
              if (plan.freshness.filteredCorridors.length > 0) {
                queuedSweeps.push({
                  providerId,
                  collectorType: tierConfig.collectorType,
                  corridorsCount: plan.freshness.filteredCorridors.length,
                  shardsCount: plan.freshness.filteredCorridors.length,
                  priorityTier: tierConfig.label,
                })
              }
              providerOk = providerOk === null ? true : providerOk && true
              continue
            }
            let tierOk = true
            let enqueuedShards = 0
            let enqueueFailures = 0
            const failedCorridors: string[] = []
            for (let shardIndex = 0; shardIndex < plan.partitions.length; shardIndex += 1) {
              const corridors = plan.partitions[shardIndex]
              if (!corridors.length) continue
              const traceId = getCurrentSpan()?.spanContext().traceId ?? randomUUID()
              const fanoutPayload: IngestFanoutMessage = {
                providerId,
                collectorType: tierConfig.collectorType,
                corridors,
                amountBuckets,
                payinMethod,
                payoutMethod,
                freshnessSloMinutes: tierConfig.sloMinutes,
                freshnessSloEnabled: b2bFreshnessSloEnabled,
                rpmOverride: plan.rpmOverride,
                perCorridorRpmOverride: plan.perCorridorRpmOverride,
                priorityTier: tierConfig.label,
                shardIndex,
                requestedAt: new Date().toISOString(),
                sweepRunId,
                traceId,
              }
              const enqueued = ingestFanoutEnabled
                ? await enqueueIngestFanout(fanoutPayload)
                : false
              if (ingestFanoutEnabled) {
                logger.debug('ingest_fanout_enqueued', {
                  provider_id: providerId,
                  priority_tier: tierConfig.label,
                  shard_index: shardIndex,
                  corridors_count: corridors.length,
                  mode: ingestFanoutMode,
                  enqueued,
                  sweep_run_id: sweepRunId ?? null,
                  trace_id: traceId,
                  requested_at: fanoutPayload.requestedAt,
                })
              }
              if (ingestFanoutMode === 'queue' && ingestFanoutEnabled) {
                if (!enqueued) {
                  tierOk = false
                  enqueueFailures += 1
                  failedCorridors.push(...corridors)
                } else {
                  enqueuedShards += 1
                }
                continue
              }
              const ok = await provider.run({
                pool,
                collectorType: tierConfig.collectorType,
                corridors,
                amountBuckets: [b2bAmountFallback],
                payinMethod,
                payoutMethod,
                freshnessSloMinutes: tierConfig.sloMinutes,
                freshnessSloEnabled: b2bFreshnessSloEnabled,
                rpmOverride: plan.rpmOverride,
                perCorridorRpmOverride: plan.perCorridorRpmOverride,
              })
              for (const corridorId of corridors) {
                sweptCorridors.add(corridorId)
              }
              tierOk = tierOk && ok
            }
            if (ingestFanoutMode === 'queue' && ingestFanoutEnabled) {
              if (enqueueFailures > 0) {
                logger.warn('ingest_fanout_enqueue_incomplete', {
                  provider_id: providerId,
                  priority_tier: tierConfig.label,
                  shards_total: plan.partitions.length,
                  shards_enqueued: enqueuedShards,
                  shards_failed: enqueueFailures,
                })
                if (sweepRunId && failedCorridors.length > 0) {
                  const failedKeys = failedCorridors.map((corridorId) => ({
                    providerId,
                    corridorId,
                    amountBucket: amountByCorridor.get(corridorId) ?? b2bAmountFallback,
                    payinMethod,
                    payoutMethod,
                  }))
                  await sweepRepo.markTasksFinishedBatch(
                    sweepRunId,
                    failedKeys,
                    'failed',
                    'enqueue_failed',
                  )
                  const summary = await sweepRepo.getRunSummary(sweepRunId)
                  if (summary.remaining === 0) {
                    const status = summary.failed > 0 ? 'failed' : 'completed'
                    await sweepRepo.updateSweepRunStatus(sweepRunId, status, new Date())
                  }
                }
              } else if (enqueuedShards > 0) {
                logger.info('b2b_sweep_enqueued', {
                  provider_id: providerId,
                  priority_tier: tierConfig.label,
                  corridors: plan.freshness.filteredCorridors.length,
                  shards: enqueuedShards,
                  sweep_run_id: sweepRunId ?? null,
                })
              }
            }
            providerOk = providerOk === null ? tierOk : providerOk && tierOk
          } catch (error) {
            logger.error('ingestion_provider_error', {
              provider_id: providerId,
              priority_tier: tierConfig.label,
              error,
            })
            providerOk = false
          }
        }

        if (ingestFanoutMode !== 'queue' && sweptCorridors.size > 0) {
          try {
            const updated = await volatilityService.refreshCacheForCorridors(
              Array.from(sweptCorridors),
            )
            logger.info('b2b_volatility_refreshed', {
              provider_id: providerId,
              corridors: sweptCorridors.size,
              updated,
            })
          } catch (error) {
            logger.warn('b2b_volatility_refresh_failed', {
              provider_id: providerId,
              error,
            })
          }
        }

        providerResults.set(providerId, providerOk)
      }

      if (corridorFanoutEnabled && corridorFanoutTasks && ingestFanoutEnabled) {
        const tasks = Array.from(corridorFanoutTasks.values())
        if (tasks.length > 0) {
          const now = new Date().toISOString()
          const messagesByQueue = new Map<string, Array<{ id: string; payload: IngestFanoutCorridorMessage }>>()
          const pushMessage = (queueUrl: string, message: { id: string; payload: IngestFanoutCorridorMessage }) => {
            const bucket = messagesByQueue.get(queueUrl)
            if (bucket) {
              bucket.push(message)
            } else {
              messagesByQueue.set(queueUrl, [message])
            }
          }
          for (let index = 0; index < tasks.length; index += 1) {
            const task = tasks[index]
            const providersByTier = new Map<string, IngestFanoutProviderTask[]>()
            for (const provider of task.providers) {
              const tier = provider.priorityTier ?? 'tier_1'
              const bucket = providersByTier.get(tier)
              if (bucket) {
                bucket.push(provider)
              } else {
                providersByTier.set(tier, [provider])
              }
            }
            for (const [tier, providers] of providersByTier.entries()) {
              const queueUrl = resolveIngestFanoutQueueUrl(tier)
              if (!queueUrl) {
                logger.warn('ingest_fanout_queue_missing', {
                  corridor_id: task.corridorId,
                  priority_tier: tier,
                })
                continue
              }
              const batches: typeof providers[] = []
              if (corridorProviderBatchSize > 0 && providers.length > corridorProviderBatchSize) {
                for (let i = 0; i < providers.length; i += corridorProviderBatchSize) {
                  batches.push(providers.slice(i, i + corridorProviderBatchSize))
                }
              } else {
                batches.push(providers)
              }
              for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
                const batchProviders = batches[batchIndex]
                pushMessage(queueUrl, {
                  id: `${index}-${tier}-${batchIndex}`,
                  payload: {
                    version: 'corridor_v1',
                    corridorId: task.corridorId,
                    providers: batchProviders,
                    requestedAt: now,
                    traceId: getCurrentSpan()?.spanContext().traceId ?? randomUUID(),
                  },
                })
              }
            }
          }
          const traceIdSample = Array.from(messagesByQueue.values())
            .flat()
            .map((message) => message.payload.traceId)
            .filter((value): value is string => Boolean(value))
            .slice(0, 3)
          const providerEnqueueFailures = new Map<string, number>()
          let failedMessages = 0
          let totalMessages = 0
          for (const [queueUrl, messages] of messagesByQueue.entries()) {
            totalMessages += messages.length
            for (let i = 0; i < messages.length; i += 10) {
              const batch = messages.slice(i, i + 10)
              const results = await sendBatchJsonMessages(queueUrl, batch)
              for (const result of results) {
                if (result.success) continue
                failedMessages += 1
                const failedPayload = batch.find((entry) => entry.id === result.id)?.payload
                if (!failedPayload) continue
                for (const provider of failedPayload.providers) {
                  providerEnqueueFailures.set(
                    provider.providerId,
                    (providerEnqueueFailures.get(provider.providerId) ?? 0) + 1,
                  )
                }
              }
            }
          }
          logger.info('ingest_fanout_corridor_enqueued', {
            corridors: tasks.length,
            messages: totalMessages,
            queues: messagesByQueue.size,
            failed_messages: failedMessages,
            provider_batch_size: corridorProviderBatchSize > 0 ? corridorProviderBatchSize : null,
            trace_id_sample: traceIdSample.length > 0 ? traceIdSample : null,
          })
          for (const sweep of queuedSweeps) {
            const failures = providerEnqueueFailures.get(sweep.providerId) ?? 0
            if (failures > 0) {
              logger.warn('ingest_fanout_enqueue_incomplete', {
                provider_id: sweep.providerId,
                priority_tier: sweep.priorityTier,
                shards_total: sweep.shardsCount,
                shards_failed: failures,
              })
              continue
            }
            logger.info('b2b_sweep_enqueued', {
              provider_id: sweep.providerId,
              priority_tier: sweep.priorityTier,
              corridors: sweep.corridorsCount,
              shards: sweep.shardsCount,
            })
          }
        } else {
          logger.info('ingest_fanout_corridor_skipped', { reason: 'no_tasks' })
        }
      }

      const statusPayload: Record<string, boolean | 'skipped'> = {}
      for (const provider of providers) {
        const value = providerResults.get(provider.providerId)
        statusPayload[provider.providerId] = value ?? 'skipped'
      }
      const ok = Array.from(providerResults.values()).every((value) => value !== false)
      logger.info('ingestion_finish', {
        mode: 'collector',
        status: ok ? 'success' : 'blocked',
        ...statusPayload,
      })
      try {
        await reportSweepDurations(pool)
      } catch (error) {
        logger.warn('b2b_sweep_duration_error', { error })
      }
      return ok
    } finally {
      if (shouldClose) {
        await pool.end()
      }
      }
    }

    throw new Error(
      'Seed data functionality has been removed. The sample-data.ts file no longer exists. ' +
      'Set config.planeB.useSeedData to false to use collector mode instead.',
    )
  },
  {
    attributes: {
      ingest_fanout_mode: ingestFanoutMode,
      ingest_fanout_message_mode: fanoutMessageMode,
    },
  },
  )
}

if (require.main === module) {
  if (shutdownRequested) {
    logger.info('ingestion_skipped', { reason: 'shutdown_requested' })
    process.exit(0)
  }

  const loopEnabled = process.env.PLANE_B_INGEST_LOOP === '1'
  const loopIntervalSeconds = Number(process.env.PLANE_B_INGEST_LOOP_INTERVAL_SECONDS ?? 0)
  const loopIntervalMs = Number.isFinite(loopIntervalSeconds) && loopIntervalSeconds > 0
    ? Math.floor(loopIntervalSeconds * 1000)
    : 60000

  if (!loopEnabled) {
    runIngestion()
      .then((ran) => {
        if (forceExitTimer) {
          clearTimeout(forceExitTimer)
        }
        if (ran) {
          logger.info('ingestion_complete', { mode: config.planeB.useSeedData ? 'seed' : 'collector' })
        }
        process.exit(0)
      })
      .catch((error) => {
        if (forceExitTimer) {
          clearTimeout(forceExitTimer)
        }
        logger.error('ingestion_failed', { error })
        process.exit(1)
      })
  } else {
    logger.info('ingestion_loop_enabled', { interval_seconds: loopIntervalMs / 1000 })

    const runLoop = async () => {
      while (!shutdownRequested) {
        const startedAt = Date.now()
        try {
          await runIngestion()
        } catch (error) {
          logger.error('ingestion_loop_failed', { error })
        }
        if (shutdownRequested) {
          break
        }
        const elapsedMs = Date.now() - startedAt
        const sleepMs = Math.max(loopIntervalMs - elapsedMs, 0)
        if (sleepMs > 0) {
          await new Promise(resolve => setTimeout(resolve, sleepMs))
        }
      }
    }

    runLoop()
      .then(() => {
        if (forceExitTimer) {
          clearTimeout(forceExitTimer)
        }
        logger.info('ingestion_loop_complete')
        process.exit(0)
      })
      .catch((error) => {
        if (forceExitTimer) {
          clearTimeout(forceExitTimer)
        }
        logger.error('ingestion_loop_error', { error })
        process.exit(1)
      })
  }
}
