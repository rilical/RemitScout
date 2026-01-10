import type { Pool } from 'pg'
import { createPool, query } from '../../shared/db'
import { assertRuntimeConfig, config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { initErrorTracking } from '../../shared/error-tracker'
import { initTracing } from '../../shared/tracing'
import { sendJsonMessage } from '../../shared/sqs'
import { partitionCorridors } from '../../shared/sharding'
import { parseCorridorId } from '../../shared/corridor'
import { getCountryByCode } from '../../shared/countries-currencies'
import { startHealthServer } from './health-server'
import { providerRegistry, type ProviderRegistryEntry } from './providers'
import { processQuoteRefreshQueue } from './quote-refresh'
import {
  FreshnessReportRepository,
  IngestionRunRepository,
  LatestQuoteRepository,
  ProviderCapabilityRepository,
  RightsMatrixRepository,
} from './repositories'
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
const ingestFanoutEnabled = ingestFanoutMode !== 'off' && Boolean(ingestFanoutQueueUrl)
const b2bAmountByProvider: Record<string, number> = {
  remitly: config.planeB.remitly.b2bAmount,
  wise: config.planeB.wise.b2bAmount,
  xe: config.planeB.xe.b2bAmount,
  worldremit: config.planeB.worldremit.b2bAmount,
  westernunion: config.planeB.westernunion.b2bAmount,
}
const resolveB2bAmount = (providerId: string) => {
  return b2bAmountByProvider[providerId] ?? config.planeB.remitly.b2bAmount
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

let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })

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
) => {
  if (!Number.isFinite(corridorCount) || corridorCount <= 0) return 0
  if (!Number.isFinite(rpm) || rpm <= 0) return 1
  if (!Number.isFinite(targetMinutes) || targetMinutes <= 0) return 1
  return Math.max(1, Math.ceil(corridorCount / (rpm * targetMinutes)))
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

const loadPriorityTierSettings = async (pool: Pool) => {
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

const loadPriorityTierMap = async (pool: Pool) => {
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

const loadUnsupportedCorridorsForProvider = async (pool: Pool, providerId: string) => {
  const repo = new ProviderCapabilityRepository(pool)
  const rows = await repo.loadUnsupportedCorridors(providerId)
  return new Set(rows.map(row => row.corridor_id).filter((id): id is string => Boolean(id)))
}

type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  tier3: string[]
  all: string[]
}

const loadPriorityQueues = async (
  pool: Pool,
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

type RightsMatrixEntry = {
  allowedCollect: boolean
  allowedB2b: boolean
  stoplistStatus: string
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
    })
  }
  return rights
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

const loadFreshnessLagByCorridor = async (
  pool: Pool,
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
  pool: Pool,
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
  pool: Pool
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

const reportSweepDurations = async (pool: Pool) => {
  const repo = new IngestionRunRepository(pool)
  const rows = await repo.loadLatestSweepDurations()
  logger.info('b2b_sweep_duration_report', { providers: rows })
}

export const runIngestion = async (options: IngestOptions = {}) => {
  if (shutdownRequested) {
    logger.info('ingestion_skipped', { reason: 'shutdown_requested' })
    return false
  }

  if (!config.planeB.useSeedData) {
    const pool = options.pool ?? createPool(config.db.planeBUrl)
    const shouldClose = !options.pool
    const volatilityService = new VolatilityService(pool)

    const healthEnabled = process.env.PLANE_B_HEALTH_ENABLED !== '0'
    let healthServer: { close: () => Promise<void> } | null = null

    if (healthEnabled) {
      try {
        healthServer = await startHealthServer({
          pool: options.pool ? undefined : pool,
          logger,
        })
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
        })
      }
    }
    if (config.planeB.b2cQueueInSweep) {
      await processQuoteRefreshQueue({ pool })
    }

    const b2bFreshnessSloEnabled = config.planeB.b2bFreshnessSloEnabled
    const b2bNativeCurrencyOnly = config.planeB.b2bNativeCurrencyOnly
    const b2bWiseCurrencyOverride = config.planeB.b2bWiseCurrencyOverride
    const b2bPayinMethod = 'bank_transfer'
    const b2bPayoutMethod = 'bank_deposit'
    const targetMinutes = config.planeB.b2bTargetMinutes
    const planMinutes = targetMinutes > 0 ? targetMinutes : 30
    const tier1Enabled = config.planeB.b2bTier1Enabled
    const priorityTierSettings = await loadPriorityTierSettings(pool)
    const tier1Settings = priorityTierSettings.get('tier_1_alpha')
    const tier2Settings = priorityTierSettings.get('tier_2_reference')
    const tier3Settings = priorityTierSettings.get('tier_3_discovery')
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
    const priorityTierOrder = ['tier1', 'tier2', 'tier3'] as const

    const rightsByProvider = await loadProviderRights(pool)
    const providers = providerRegistry
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
    const priorityTierMap = await loadPriorityTierMap(pool)
    const queueEntries = await Promise.all(
      providerIds.map(async (providerId) => [
        providerId,
        await loadPriorityQueues(pool, providerId),
      ] as const),
    )
    const queuesByProvider = new Map(queueEntries)

    try {
      const buildTierPlan = async (
        providerId: string,
        corridors: string[],
        tierKey: typeof priorityTierOrder[number],
        targetMinutes: number,
        amountBucket: number,
      ): Promise<PriorityTierPlan> => {
        const tierConfig = priorityTierConfig[tierKey]
        const eligibleCorridors = corridors
        const freshness = await applyFreshnessSlo({
          pool,
          providerId,
          corridors: eligibleCorridors,
          amountBucket,
          payinMethod: b2bPayinMethod,
          payoutMethod: b2bPayoutMethod,
          sloMinutes: tierConfig.sloMinutes,
          enabled: b2bFreshnessSloEnabled,
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

      for (const provider of eligibleProviders) {
        const providerId = provider.providerId
        const b2bAmount = resolveB2bAmount(providerId)
        const sweptCorridors = new Set<string>()

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

        const emptyPlan: PriorityTierPlan = {
          corridors: [],
          eligibleCorridors: [],
          freshness: { staleCorridors: [], freshCorridors: [], filteredCorridors: [] },
          partitions: [],
          targetShards: 0,
        }
        const tier1Plan = tier1Enabled
          ? await buildTierPlan(providerId, queues.tier1, 'tier1', planMinutes, b2bAmount)
          : emptyPlan
        const tier2Plan = await buildTierPlan(providerId, queues.tier2, 'tier2', planMinutes, b2bAmount)
        const tier3Plan = await buildTierPlan(providerId, queues.tier3, 'tier3', planMinutes, b2bAmount)

        logger.info('b2b_priority_plan', {
          provider_id: providerId,
          observed_corridors: queues.all.length,
          tier1_corridors: queues.tier1.length,
          tier2_corridors: queues.tier2.length,
          tier3_corridors: queues.tier3.length,
          tier1_eligible_corridors: tier1Plan.eligibleCorridors.length,
          tier2_eligible_corridors: tier2Plan.eligibleCorridors.length,
          tier3_eligible_corridors: tier3Plan.eligibleCorridors.length,
          tier1_stale_corridors: tier1Plan.freshness.staleCorridors.length,
          tier2_stale_corridors: tier2Plan.freshness.staleCorridors.length,
          tier3_stale_corridors: tier3Plan.freshness.staleCorridors.length,
          tier1_shards: tier1Plan.targetShards,
          tier2_shards: tier2Plan.targetShards,
          tier3_shards: tier3Plan.targetShards,
          tier1_enabled: tier1Enabled,
          tier1_interval_seconds: priorityTierConfig.tier1.intervalSeconds,
          tier2_interval_seconds: priorityTierConfig.tier2.intervalSeconds,
          tier3_interval_seconds: priorityTierConfig.tier3.intervalSeconds,
          tier1_rpm: priorityTierConfig.tier1.rpm,
          tier2_rpm: priorityTierConfig.tier2.rpm,
          tier3_rpm: priorityTierConfig.tier3.rpm,
          freshness_slo_enabled: b2bFreshnessSloEnabled,
          target_minutes: targetMinutes || null,
          plan_minutes: planMinutes,
        })

        const tierPlans = {
          tier1: tier1Plan,
          tier2: tier2Plan,
          tier3: tier3Plan,
        }

        let providerOk: boolean | null = null
        for (const tierKey of priorityTierOrder) {
          if (!tier1Enabled && tierKey === 'tier1') {
            logger.info('b2b_sweep_skipped', {
              provider_id: providerId,
              priority_tier: priorityTierConfig.tier1.label,
              reason: 'tier1_disabled',
            })
            continue
          }
          const tierConfig = priorityTierConfig[tierKey]
          const plan = tierPlans[tierKey]
          const corridorsPerShard = plan.partitions.map(partition => partition.length)
          logger.info('b2b_partition_plan', {
            provider_id: providerId,
            priority_tier: tierConfig.label,
            total_corridors: plan.freshness.filteredCorridors.length,
            target_shards: plan.targetShards,
            corridors_per_shard: corridorsPerShard,
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

          try {
            let tierOk = true
            for (let shardIndex = 0; shardIndex < plan.partitions.length; shardIndex += 1) {
              const corridors = plan.partitions[shardIndex]
              if (!corridors.length) continue
              const fanoutPayload: IngestFanoutMessage = {
                providerId,
                collectorType: tierConfig.collectorType,
                corridors,
                amountBuckets: [b2bAmount],
                payinMethod: b2bPayinMethod,
                payoutMethod: b2bPayoutMethod,
                freshnessSloMinutes: tierConfig.sloMinutes,
                freshnessSloEnabled: b2bFreshnessSloEnabled,
                rpmOverride: tierConfig.rpm,
                perCorridorRpmOverride: tierConfig.perCorridorRpm,
                priorityTier: tierConfig.label,
                shardIndex,
                requestedAt: new Date().toISOString(),
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
                })
              }
              if (ingestFanoutMode === 'queue' && ingestFanoutEnabled) {
                if (!enqueued) {
                  tierOk = false
                }
                continue
              }
              const ok = await provider.run({
                pool,
                collectorType: tierConfig.collectorType,
                corridors,
                amountBuckets: [b2bAmount],
                payinMethod: b2bPayinMethod,
                payoutMethod: b2bPayoutMethod,
                freshnessSloMinutes: tierConfig.sloMinutes,
                freshnessSloEnabled: b2bFreshnessSloEnabled,
                rpmOverride: tierConfig.rpm,
                perCorridorRpmOverride: tierConfig.perCorridorRpm,
              })
              for (const corridorId of corridors) {
                sweptCorridors.add(corridorId)
              }
              tierOk = tierOk && ok
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
      if (healthServer) {
        await healthServer.close().catch((error) => {
          logger.warn('health_server_close_failed', { error })
        })
      }
      if (shouldClose) {
        await pool.end()
      }
    }
  }

  throw new Error(
    'Seed data functionality has been removed. The sample-data.ts file no longer exists. ' +
    'Set config.planeB.useSeedData to false to use collector mode instead.',
  )
}

if (require.main === module) {
  if (shutdownRequested) {
    logger.info('ingestion_skipped', { reason: 'shutdown_requested' })
    process.exit(0)
  }

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
}
