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

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { sendJsonMessage } from '../shared/sqs'
import { partitionCorridors } from '../shared/sharding'
import { parseCorridorId } from '../shared/corridor'
import { getCountryByCode } from '../shared/countries-currencies'
import { createShutdownHandler } from '../shared/shutdown'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { providerRegistry, type ProviderRegistryEntry } from '../plane-b/src/providers'
import {
  FreshnessReportRepository,
  LatestQuoteRepository,
  ProviderCapabilityRepository,
  RightsMatrixRepository,
} from '../plane-b/src/repositories'

type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  tier3: string[]
  all: string[]
}

type FreshnessReportRow = {
  corridorId: string
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
}

type TierKey = 'tier1' | 'tier2' | 'tier3'

const logger = createLogger('script.b2b-sweep-scheduler')
const ingestFanoutMode = config.queues.ingestFanout.mode
const ingestFanoutQueueUrl = config.queues.ingestFanout.url
const ingestFanoutEnabled = ingestFanoutMode === 'queue' && Boolean(ingestFanoutQueueUrl)

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
const resolveB2bAmount = (providerId: string) => {
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
const lockTtlSeconds = toNumber(process.env.B2B_SWEEP_SCHEDULER_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))

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
const resolveB2bPayoutMethod = (providerId: string) => {
  return b2bPayoutMethodByProvider[providerId] ?? defaultB2bPayoutMethod
}

const estimateTargetShards = (
  corridorCount: number,
  rpm: number,
  targetMinutes: number,
) => {
  if (!Number.isFinite(corridorCount) || corridorCount <= 0) return 0
  if (!Number.isFinite(rpm) || rpm <= 0) return 1
  if (!Number.isFinite(targetMinutes) || targetMinutes <= 0) return 1
  return Math.max(1, Math.ceil(corridorCount / (rpm * targetMinutes)))
}

const loadPriorityTierSettings = async (pool: ReturnType<typeof createPool>) => {
  const result = await query<{
    priority_tier: string
    scrape_interval_seconds: number | null
    freshness_slo_minutes: number | null
  }>(
    `SELECT priority_tier,
            MAX(scrape_interval_seconds) AS scrape_interval_seconds,
            MAX(freshness_slo_minutes) AS freshness_slo_minutes
       FROM silver.corridor_priority
      GROUP BY priority_tier`,
    [],
    pool,
  )
  const settings = new Map<string, { intervalSeconds: number; sloMinutes: number }>()
  for (const row of result.rows) {
    const intervalSeconds = Number(row.scrape_interval_seconds)
    const sloMinutes = Number(row.freshness_slo_minutes)
    settings.set(row.priority_tier, {
      intervalSeconds: Number.isFinite(intervalSeconds) ? intervalSeconds : 0,
      sloMinutes: Number.isFinite(sloMinutes) ? sloMinutes : 0,
    })
  }
  return settings
}

const loadPriorityTierMap = async (pool: ReturnType<typeof createPool>) => {
  const result = await query<{ corridor_id: string; priority_tier: string | null }>(
    `SELECT corridor_id, priority_tier
       FROM silver.corridor_priority`,
    [],
    pool,
  )
  const tierMap = new Map<string, string>()
  const rows = Array.isArray(result.rows) ? result.rows : []
  for (const row of rows) {
    if (!row.corridor_id) continue
    tierMap.set(row.corridor_id, row.priority_tier ?? 'tier_2_reference')
  }
  return tierMap
}

const loadPriorityQueues = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
): Promise<PriorityQueues> => {
  const repo = new ProviderCapabilityRepository(pool)
  const rows = await repo.loadPriorityCorridors(providerId)
  const queues: PriorityQueues = {
    tier1: [],
    tier2: [],
    tier3: [],
    all: [],
  }
  for (const row of rows) {
    if (!row.corridor_id) continue
    queues.all.push(row.corridor_id)
    const tier = row.priority_tier ?? 'tier_2_reference'
    if (tier === 'tier_1_alpha') {
      queues.tier1.push(row.corridor_id)
    } else if (tier === 'tier_2_reference') {
      queues.tier2.push(row.corridor_id)
    } else {
      queues.tier3.push(row.corridor_id)
    }
  }
  return queues
}

const loadUnsupportedCorridorsForProvider = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
) => {
  const repo = new ProviderCapabilityRepository(pool)
  const rows = await repo.loadUnsupportedCorridors(providerId)
  return new Set(rows.map(row => row.corridor_id).filter((id): id is string => Boolean(id)))
}

const buildExpandedQueues = (options: {
  capabilityQueues: PriorityQueues
  supportedCorridors: string[]
  unsupportedCorridors: Set<string>
  priorityTierMap: Map<string, string>
}) => {
  const { capabilityQueues, supportedCorridors, unsupportedCorridors, priorityTierMap } = options
  const combined: string[] = []
  const seen = new Set<string>()
  const addCorridor = (corridorId: string) => {
    if (!corridorId) return
    if (unsupportedCorridors.has(corridorId)) return
    if (seen.has(corridorId)) return
    seen.add(corridorId)
    combined.push(corridorId)
  }

  for (const corridorId of capabilityQueues.all) addCorridor(corridorId)
  for (const corridorId of supportedCorridors) addCorridor(corridorId)

  const queues: PriorityQueues = { tier1: [], tier2: [], tier3: [], all: [] }
  for (const corridorId of combined) {
    const tier = priorityTierMap.get(corridorId) ?? 'tier_2_reference'
    queues.all.push(corridorId)
    if (tier === 'tier_1_alpha') {
      queues.tier1.push(corridorId)
    } else if (tier === 'tier_2_reference') {
      queues.tier2.push(corridorId)
    } else {
      queues.tier3.push(corridorId)
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
    tier3: filter(queues.tier3),
    all: filter(queues.all),
  }
}

const loadFreshnessLagByCorridor = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
  corridors: string[],
  amountBucket: number,
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
  const rows = await repo.loadFreshnessLagByCorridor(
    providerId,
    corridors,
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
  return ageByCorridor
}

const persistFreshnessReport = async (
  pool: ReturnType<typeof createPool>,
  providerId: string,
  amountBucket: number,
  payinMethod: string,
  payoutMethod: string,
  reports: FreshnessReportRow[],
) => {
  if (!reports.length) return
  const observedAt = new Date().toISOString()
  const providerIds = reports.map(() => providerId)
  const corridorIds = reports.map(report => report.corridorId)
  const amountBuckets = reports.map(() => amountBucket)
  const payinMethods = reports.map(() => payinMethod)
  const payoutMethods = reports.map(() => payoutMethod)
  const ageMinutes = reports.map(report => report.ageMinutes)
  const sloMinutes = reports.map(report => report.sloMinutes)
  const staleFlags = reports.map(report => report.isStale)
  const observedAts = reports.map(() => observedAt)

  const repo = new FreshnessReportRepository(pool)
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

const applyFreshnessSlo = async (options: {
  pool: ReturnType<typeof createPool>
  providerId: string
  corridors: string[]
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  sloMinutes: number
  enabled: boolean
}) => {
  const {
    pool,
    providerId,
    corridors,
    amountBucket,
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
    amountBucket,
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
    if (isStale) {
      staleCorridors.push(corridorId)
    } else {
      freshCorridors.push(corridorId)
    }
    reports.push({
      corridorId,
      ageMinutes,
      sloMinutes: hasSlo ? sloMinutes : null,
      isStale,
    })
  }

  await persistFreshnessReport(
    pool,
    providerId,
    amountBucket,
    payinMethod,
    payoutMethod,
    reports,
  )

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

const buildTierPlan = async (options: {
  pool: ReturnType<typeof createPool>
  providerId: string
  corridors: string[]
  targetMinutes: number
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  tierConfig: {
    rpm: number
    sloMinutes: number
  }
  freshnessEnabled: boolean
}): Promise<PriorityTierPlan> => {
  const {
    pool,
    providerId,
    corridors,
    targetMinutes,
    amountBucket,
    payinMethod,
    payoutMethod,
    tierConfig,
    freshnessEnabled,
  } = options
  const eligibleCorridors = corridors
  const freshness = await applyFreshnessSlo({
    pool,
    providerId,
    corridors: eligibleCorridors,
    amountBucket,
    payinMethod,
    payoutMethod,
    sloMinutes: tierConfig.sloMinutes,
    enabled: freshnessEnabled,
  })
  const targetShards = estimateTargetShards(
    freshness.filteredCorridors.length,
    tierConfig.rpm,
    targetMinutes,
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
  }
}

const enqueueIngestFanout = async (payload: IngestFanoutMessage): Promise<boolean> => {
  if (!ingestFanoutQueueUrl) {
    return false
  }
  try {
    await sendJsonMessage(ingestFanoutQueueUrl, payload)
    return true
  } catch (error) {
    logger.warn('ingest_fanout_enqueue_failed', {
      provider_id: payload.providerId,
      collector_type: payload.collectorType,
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
  }>()
  for (const row of rows) {
    if (!row.provider_id) continue
    rights.set(row.provider_id, {
      allowedCollect: Boolean(row.allowed_collect),
      allowedB2b: Boolean(row.allowed_b2b),
      stoplistStatus: row.stoplist_status || 'active',
    })
  }
  return rights
}

const loadLastRuns = async (
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

const upsertScheduleRow = async (options: {
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

const disableScheduleForMissingProviders = async (
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

const claimDueSchedules = async (pool: ReturnType<typeof createPool>) => {
  const result = await query<{
    provider_id: string
    priority_tier: string
    interval_seconds: number
  }>(
    `UPDATE silver.b2b_sweep_schedule
        SET last_enqueued_at = NOW(),
            next_due_at = NOW() + (interval_seconds || ' seconds')::interval,
            updated_at = NOW()
      WHERE enabled = true
        AND next_due_at <= NOW()
      RETURNING provider_id, priority_tier, interval_seconds`,
    [],
    pool,
  )
  return result.rows
}

export const runB2bSweepScheduler = async (): Promise<number> => {
  if (!ingestFanoutEnabled) {
    logger.warn('scheduler_disabled', { reason: 'ingest_fanout_not_queue_mode' })
    return 0
  }

  const pool = createPool(config.db.planeBUrl)
  const lock = new WorkerLock('b2b-sweep-scheduler', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('scheduler_skipped', { reason: 'lock_already_held' })
    await pool.end()
    return 0
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'b2b-sweep-scheduler',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  try {
    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_start')

    const rightsByProvider = await loadProviderRights(pool)
    const providers = providerRegistry
    const eligibleProviders: ProviderRegistryEntry[] = []
    for (const provider of providers) {
      const providerId = provider.providerId
      const rights = rightsByProvider.get(providerId)
      if (!rights) {
        logger.info('b2b_scheduler_skipped', { provider_id: providerId, reason: 'rights_missing' })
        continue
      }
      if (!rights.allowedCollect) {
        logger.info('b2b_scheduler_skipped', { provider_id: providerId, reason: 'allowed_collect_false' })
        continue
      }
      if (!rights.allowedB2b) {
        logger.info('b2b_scheduler_skipped', { provider_id: providerId, reason: 'allowed_b2b_false' })
        continue
      }
      if (rights.stoplistStatus !== 'active') {
        logger.info('b2b_scheduler_skipped', {
          provider_id: providerId,
          reason: `stoplist_${rights.stoplistStatus}`,
        })
        continue
      }
      eligibleProviders.push(provider)
    }

    const eligibleProviderIds = eligibleProviders.map(provider => provider.providerId)
    await disableScheduleForMissingProviders(pool, eligibleProviderIds)

    const priorityTierSettings = await loadPriorityTierSettings(pool)
    const tier1Settings = priorityTierSettings.get('tier_1_alpha')
    const tier2Settings = priorityTierSettings.get('tier_2_reference')
    const tier3Settings = priorityTierSettings.get('tier_3_discovery')
    const tier1Enabled = config.planeB.b2bTier1Enabled
    const priorityTierConfig = {
      tier1: {
        label: 'tier_1_alpha',
        collectorType: 'b2b_tier_1_alpha',
        intervalSeconds: tier1Settings?.intervalSeconds || 60,
        rpm: 12,
        perCorridorRpm: 12,
        sloMinutes: tier1Settings?.sloMinutes || 1,
      },
      tier2: {
        label: 'tier_2_reference',
        collectorType: 'b2b_tier_2_reference',
        intervalSeconds: tier2Settings?.intervalSeconds || 7200,
        rpm: 6,
        perCorridorRpm: 6,
        sloMinutes: tier2Settings?.sloMinutes || 120,
      },
      tier3: {
        label: 'tier_3_discovery',
        collectorType: 'b2b_tier_3_discovery',
        intervalSeconds: tier3Settings?.intervalSeconds || 86400,
        rpm: 2,
        perCorridorRpm: 2,
        sloMinutes: tier3Settings?.sloMinutes || 1440,
      },
    } as const
    const priorityTierOrder: TierKey[] = ['tier1', 'tier2', 'tier3']
    const tierKeyByLabel = new Map<string, TierKey>(
      priorityTierOrder.map(tierKey => [priorityTierConfig[tierKey].label, tierKey]),
    )
    const collectorTypes = priorityTierOrder.map(tierKey => priorityTierConfig[tierKey].collectorType)

    const lastRuns = await loadLastRuns(pool, eligibleProviderIds, collectorTypes)
    const now = Date.now()
    for (const provider of eligibleProviders) {
      for (const tierKey of priorityTierOrder) {
        const tierConfig = priorityTierConfig[tierKey]
        const enabled = tierKey !== 'tier1' || tier1Enabled
        const lastRunKey = `${provider.providerId}:${tierConfig.collectorType}`
        const lastRun = lastRuns.get(lastRunKey)
        const intervalMs = Math.max(0, tierConfig.intervalSeconds * 1000)
        const nextDueAt = lastRun
          ? new Date(new Date(lastRun).getTime() + intervalMs)
          : new Date(now)
        await upsertScheduleRow({
          pool,
          providerId: provider.providerId,
          priorityTier: tierConfig.label,
          intervalSeconds: tierConfig.intervalSeconds,
          nextDueAt,
          enabled,
        })
      }
    }

    const dueRows = await claimDueSchedules(pool)
    if (dueRows.length === 0) {
      logger.info('b2b_scheduler_no_due', { providers: eligibleProviderIds.length })
      await recordBatchJobMetric('b2b-sweep-scheduler', 'job_complete', 0)
      return 0
    }

    const priorityTierMap = await loadPriorityTierMap(pool)
    const queueEntries = await Promise.all(
      eligibleProviderIds.map(async (providerId) => [
        providerId,
        await loadPriorityQueues(pool, providerId),
      ] as const),
    )
    const queuesByProvider = new Map(queueEntries)

    const expandedQueuesByProvider = new Map<string, PriorityQueues>()
    const b2bNativeCurrencyOnly = config.planeB.b2bNativeCurrencyOnly
    const b2bWiseCurrencyOverride = config.planeB.b2bWiseCurrencyOverride

    for (const provider of eligibleProviders) {
      const providerId = provider.providerId
      const queue = queuesByProvider.get(providerId) ?? {
        tier1: [],
        tier2: [],
        tier3: [],
        all: [],
      }
      const unsupportedCorridors = await loadUnsupportedCorridorsForProvider(pool, providerId)
      let queues = buildExpandedQueues({
        capabilityQueues: queue,
        supportedCorridors: provider.supportedCorridors,
        unsupportedCorridors,
        priorityTierMap,
      })
      if (b2bNativeCurrencyOnly && !(b2bWiseCurrencyOverride && providerId === 'wise')) {
        const beforeCounts = {
          all: queues.all.length,
          tier1: queues.tier1.length,
          tier2: queues.tier2.length,
          tier3: queues.tier3.length,
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
          before_tier3: beforeCounts.tier3,
          after_tier3: queues.tier3.length,
        })
      }
      expandedQueuesByProvider.set(providerId, queues)
    }

    const targetMinutes = config.planeB.b2bTargetMinutes
    const planMinutes = targetMinutes > 0 ? targetMinutes : 30
    const b2bFreshnessSloEnabled = config.planeB.b2bFreshnessSloEnabled

    let enqueuedCount = 0
    for (const row of dueRows) {
      const provider = eligibleProviders.find(entry => entry.providerId === row.provider_id)
      if (!provider) {
        logger.warn('b2b_scheduler_provider_missing', { provider_id: row.provider_id })
        continue
      }
      const tierKey = tierKeyByLabel.get(row.priority_tier)
      if (!tierKey) {
        logger.warn('b2b_scheduler_tier_missing', {
          provider_id: row.provider_id,
          priority_tier: row.priority_tier,
        })
        continue
      }

      if (tierKey === 'tier1' && !tier1Enabled) {
        logger.info('b2b_scheduler_skipped', {
          provider_id: row.provider_id,
          priority_tier: row.priority_tier,
          reason: 'tier1_disabled',
        })
        continue
      }

      const queues = expandedQueuesByProvider.get(row.provider_id)
      if (!queues) {
        logger.warn('b2b_scheduler_queue_missing', { provider_id: row.provider_id })
        continue
      }

      const corridors = queues[tierKey]
      const tierConfig = priorityTierConfig[tierKey]
      const b2bAmount = resolveB2bAmount(row.provider_id)

      const payinMethod = resolveB2bPayinMethod(row.provider_id)
      const payoutMethod = resolveB2bPayoutMethod(row.provider_id)
      const plan = await buildTierPlan({
        pool,
        providerId: row.provider_id,
        corridors,
        targetMinutes: planMinutes,
        amountBucket: b2bAmount,
        payinMethod,
        payoutMethod,
        tierConfig,
        freshnessEnabled: b2bFreshnessSloEnabled,
      })

      if (plan.freshness.filteredCorridors.length === 0) {
        const reason = plan.corridors.length === 0
          ? 'no_priority_corridors'
          : plan.eligibleCorridors.length === 0
            ? 'coverage_filter'
            : b2bFreshnessSloEnabled && plan.freshness.filteredCorridors.length === 0
              ? 'freshness_slo'
              : 'no_corridors'
        logger.info('b2b_scheduler_skipped', {
          provider_id: row.provider_id,
          priority_tier: row.priority_tier,
          reason,
          tier_corridors: plan.corridors.length,
          tier_eligible_corridors: plan.eligibleCorridors.length,
          tier_stale_corridors: plan.freshness.staleCorridors.length,
          tier_fresh_corridors: plan.freshness.freshCorridors.length,
          target_shards: plan.targetShards,
        })
        continue
      }

      for (let shardIndex = 0; shardIndex < plan.partitions.length; shardIndex += 1) {
        const shardCorridors = plan.partitions[shardIndex]
        if (!shardCorridors.length) continue
        const payload: IngestFanoutMessage = {
          providerId: row.provider_id,
          collectorType: tierConfig.collectorType,
          corridors: shardCorridors,
          amountBuckets: [b2bAmount],
          payinMethod,
          payoutMethod,
          freshnessSloMinutes: tierConfig.sloMinutes,
          freshnessSloEnabled: b2bFreshnessSloEnabled,
          rpmOverride: tierConfig.rpm,
          perCorridorRpmOverride: tierConfig.perCorridorRpm,
          priorityTier: tierConfig.label,
          shardIndex,
          requestedAt: new Date().toISOString(),
        }
        const enqueued = await enqueueIngestFanout(payload)
        if (enqueued) {
          enqueuedCount += 1
        }
        logger.info('b2b_scheduler_enqueued', {
          provider_id: row.provider_id,
          priority_tier: tierConfig.label,
          shard_index: shardIndex,
          corridors_count: shardCorridors.length,
          enqueued,
        })
      }
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - now) / 1000))
    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_complete', durationSeconds, {
      enqueued: String(enqueuedCount),
    })
    return enqueuedCount
  } catch (error) {
    await recordBatchJobMetric('b2b-sweep-scheduler', 'job_failure')
    logger.error('b2b_scheduler_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return 0
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release().catch((error) => {
      logger.warn('lock_release_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
    await pool.end()
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
})

const runLoop = async () => {
  while (!isShutdownRequested()) {
    await runB2bSweepScheduler()
    if (!loopEnabled) {
      return
    }
    await sleep(loopDelayMs)
  }
}

if (require.main === module) {
  void runLoop()
}
