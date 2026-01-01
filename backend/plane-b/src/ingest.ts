import type { Pool } from 'pg'
import { createPool } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { partitionCorridors } from '../../shared/sharding'
import { pulseDefaults, buildChartData } from '../../shared/pulse-defaults'
import {
  rightsMatrix,
  providers,
  corridors,
  providerQuotes,
  fxRates,
  fxProviderRates,
  popularCorridors,
  countries,
} from './data/sample-data'
import { providerRegistry } from './providers'
import { processQuoteRefreshQueue } from './quote-refresh'

type IngestOptions = {
  pool?: Pool
}

const logger = createLogger('plane-b.ingest')

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

const pulseCacheEntries = () => {
  const baseEntries: Record<string, unknown> = {
    'pulse:corridors': pulseDefaults.corridors,
    'pulse:overview': pulseDefaults.overview,
    'pulse:method-coverage': pulseDefaults.methodCoverage,
    'pulse:table': pulseDefaults.table,
    'pulse:hero': pulseDefaults.hero,
    'pulse:coverage-summary': pulseDefaults.coverageSummary,
    'pulse:snapshot-summary': pulseDefaults.snapshotSummary,
    'pulse:provider-benchmarking': pulseDefaults.providerBenchmarking,
    'pulse:events': pulseDefaults.events,
    'pulse:provider-heatmap': pulseDefaults.providerHeatmap,
    'pulse:smart-send': pulseDefaults.smartSend,
    'pulse:market-snapshot': pulseDefaults.marketSnapshot,
    'pulse:true-cost': pulseDefaults.trueCost,
    'pulse:market-depth': pulseDefaults.marketDepth,
    'pulse:arbitrage': pulseDefaults.arbitrage,
    'pulse:bank-comparison': pulseDefaults.bankComparison,
    'pulse:cost-trend': pulseDefaults.costTrend,
  }

  const chartIds = ['all-in-cost', 'fx-markup', 'provider-winner', 'volatility-pulse', 'quote-success', 'market-depth']
  for (const chartId of chartIds) {
    baseEntries[`pulse:chart:${chartId}`] = buildChartData(chartId)
  }

  return baseEntries
}

const parseDeliveryMinutes = (delivery: string) => {
  const normalized = delivery.toLowerCase()
  if (normalized.includes('15-30')) {
    return { min: 15, max: 30 }
  }
  if (normalized.includes('minutes')) {
    return { min: 5, max: 30 }
  }
  if (normalized.includes('same day')) {
    return { min: 60, max: 24 * 60 }
  }
  return { min: null, max: null }
}

const serializeJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null) ?? 'null'
  } catch {
    return JSON.stringify(String(value))
  }
}

const getLastPrioritySweepAgeSeconds = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
) => {
  const result = await pool.query<{ age_seconds: number | null }>(
    `SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(finished_at, started_at))) AS age_seconds
       FROM silver.ingestion_run
      WHERE provider_id = $1
        AND collector_type = $2
      ORDER BY COALESCE(finished_at, started_at) DESC
      LIMIT 1`,
    [providerId, collectorType],
  )
  const age = result.rows[0]?.age_seconds
  return Number.isFinite(age) ? Number(age) : null
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

const loadCoverageCorridors = async (pool: Pool, minProviders: number) => {
  if (minProviders <= 1) return null
  const result = await pool.query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.provider_corridor_capability
      WHERE is_supported = true
      GROUP BY corridor_id
      HAVING COUNT(DISTINCT provider_id) >= $1`,
    [minProviders],
  )
  const corridors = result.rows.map(row => row.corridor_id).filter(Boolean)
  return new Set(corridors)
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
  const result = await pool.query<{ corridor_id: string; priority_tier: string | null }>(
    `SELECT pcc.corridor_id, cp.priority_tier
       FROM silver.provider_corridor_capability pcc
       LEFT JOIN silver.corridor_priority cp
         ON cp.corridor_id = pcc.corridor_id
      WHERE pcc.provider_id = $1
        AND pcc.is_supported = true
      ORDER BY pcc.corridor_id`,
    [providerId],
  )
  const queues: PriorityQueues = {
    tier1: [],
    tier2: [],
    tier3: [],
    all: [],
  }
  for (const row of result.rows) {
    if (!row.corridor_id) continue
    queues.all.push(row.corridor_id)
    const tier = row.priority_tier ?? 'tier_3_discovery'
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

type RightsMatrixEntry = {
  allowedCollect: boolean
  allowedB2b: boolean
  stoplistStatus: string
}

const loadProviderRights = async (pool: Pool) => {
  const result = await pool.query<{
    provider_id: string
    allowed_collect: boolean
    allowed_b2b: boolean
    stoplist_status: string
  }>(
    `SELECT provider_id, allowed_collect, allowed_b2b, stoplist_status
       FROM silver.rights_matrix`,
  )
  const rights = new Map<string, RightsMatrixEntry>()
  for (const row of result.rows) {
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
  const result = await pool.query<{ corridor_id: string; age_minutes: number | null }>(
    `SELECT corridor_id,
            EXTRACT(EPOCH FROM (now() - collected_at)) / 60.0 AS age_minutes
       FROM silver.latest_quote_by_provider
      WHERE provider_id = $1
        AND corridor_id = ANY($2)
        AND amount_bucket = $3
        AND payin = $4
        AND payout = $5`,
    [providerId, corridors, amountBucket, payinMethod, payoutMethod],
  )
  for (const row of result.rows) {
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

  await pool.query(
    `INSERT INTO silver.freshness_slo_report
     (provider_id, corridor_id, amount_bucket, payin_method, payout_method, age_minutes, slo_minutes, is_stale, observed_at)
     SELECT * FROM UNNEST(
       $1::text[],
       $2::text[],
       $3::int[],
       $4::text[],
       $5::text[],
       $6::double precision[],
       $7::int[],
       $8::boolean[],
       $9::timestamptz[]
     )`,
    [
      providerIds,
      corridorIds,
      amountBuckets,
      payinMethods,
      payoutMethods,
      ageMinutes,
      sloMinutes,
      staleFlags,
      observedAts,
    ],
  )
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
  const result = await pool.query<{
    provider_id: string
    duration_minutes: number
    finished_at: string
    status: string
  }>(
    `SELECT DISTINCT ON (provider_id)
        provider_id,
        EXTRACT(EPOCH FROM (finished_at - started_at)) / 60.0 AS duration_minutes,
        finished_at,
        status
       FROM silver.ingestion_run
      WHERE collector_type IN (
        'b2b_tier_1_alpha',
        'b2b_tier_2_reference',
        'b2b_tier_3_discovery',
        'b2b_full_sweep',
        'b2b_full_sweep_monthly'
      )
        AND finished_at IS NOT NULL
      ORDER BY provider_id, finished_at DESC`,
  )
  logger.info('b2b_sweep_duration_report', { providers: result.rows })
}

export const runIngestion = async (options: IngestOptions = {}) => {
  if (!config.planeB.useSeedData) {
    const pool = options.pool ?? createPool(config.db.planeBUrl)
    const shouldClose = !options.pool

    logger.info('ingestion_start', { mode: 'collector' })
    await processQuoteRefreshQueue({ pool })

    const minProviderCount = config.planeB.b2bMinProviderCount
    const b2bFreshnessSloEnabled = config.planeB.b2bFreshnessSloEnabled
    const b2bAmount = config.planeB.remitly.b2bAmount
    const b2bPayinMethod = 'bank_transfer'
    const b2bPayoutMethod = 'bank_deposit'
    const targetMinutes = config.planeB.b2bTargetMinutes
    const planMinutes = targetMinutes > 0 ? targetMinutes : 30
    const priorityTierConfig = {
      tier1: {
        label: 'tier_1_alpha',
        collectorType: 'b2b_tier_1_alpha',
        intervalSeconds: 60,
        rpm: 12,
        perCorridorRpm: 12,
        sloMinutes: 1,
      },
      tier2: {
        label: 'tier_2_reference',
        collectorType: 'b2b_tier_2_reference',
        intervalSeconds: 3600,
        rpm: 6,
        perCorridorRpm: 6,
        sloMinutes: 60,
      },
      tier3: {
        label: 'tier_3_discovery',
        collectorType: 'b2b_tier_3_discovery',
        intervalSeconds: 86400,
        rpm: 2,
        perCorridorRpm: 2,
        sloMinutes: 1440,
      },
    } as const
    const priorityTierOrder = ['tier1', 'tier2', 'tier3'] as const
    const coverageCorridors = minProviderCount > 1
      ? await loadCoverageCorridors(pool, minProviderCount)
      : null
    const shouldFilterCoverage = minProviderCount > 1
    const filterByCoverage = (list: string[]) =>
      shouldFilterCoverage && coverageCorridors
        ? list.filter(corridor => coverageCorridors.has(corridor))
        : list
    if (minProviderCount > 1) {
      logger.info('b2b_coverage_filter', {
        min_provider_count: minProviderCount,
        coverage_corridors: coverageCorridors?.size ?? 0,
        enabled: shouldFilterCoverage,
      })
    }

    const providers = providerRegistry
    const providerIds = providers.map(provider => provider.providerId)
    const rightsByProvider = await loadProviderRights(pool)
    const queueEntries = await Promise.all(
      providerIds.map(async (providerId) => [
        providerId,
        await loadPriorityQueues(pool, providerId),
      ] as const),
    )
    const queuesByProvider = new Map(queueEntries)

    try {
      const providerResults = new Map<string, boolean | null>()
      const buildTierPlan = async (
        providerId: string,
        corridors: string[],
        tierKey: typeof priorityTierOrder[number],
        targetMinutes: number,
      ): Promise<PriorityTierPlan> => {
        const tierConfig = priorityTierConfig[tierKey]
        const eligibleCorridors = filterByCoverage(corridors)
        const freshness = await applyFreshnessSlo({
          pool,
          providerId,
          corridors: eligibleCorridors,
          amountBucket: b2bAmount,
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

        const queue = queuesByProvider.get(providerId) ?? {
          tier1: [],
          tier2: [],
          tier3: [],
          all: [],
        }
        const queues = queue.all.length
          ? queue
          : {
            tier1: [],
            tier2: [],
            tier3: provider.supportedCorridors,
            all: provider.supportedCorridors,
          }

        const tier1Plan = await buildTierPlan(providerId, queues.tier1, 'tier1', planMinutes)
        const tier2Plan = await buildTierPlan(providerId, queues.tier2, 'tier2', planMinutes)
        const tier3Plan = await buildTierPlan(providerId, queues.tier3, 'tier3', planMinutes)

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
      if (shouldClose) {
        await pool.end()
      }
    }
  }

  const db = options.pool || createPool(config.db.planeBUrl)
  const shouldClose = !options.pool

  logger.info('ingestion_start', { mode: 'seed' })

  const allowedProviders = new Set(
    rightsMatrix.filter(entry => entry.allowedCollect).map(entry => entry.providerId),
  )

  try {
    await db.query('BEGIN')

    for (const country of countries) {
      await db.query(
        `INSERT INTO silver.countries (code, name, currency)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency`,
        [country.code, country.name, country.currency],
      )
    }

    for (const rights of rightsMatrix) {
      await db.query(
        `INSERT INTO silver.rights_matrix (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider_id) DO UPDATE SET
           allowed_collect = EXCLUDED.allowed_collect,
           allowed_b2c = EXCLUDED.allowed_b2c,
           allowed_b2b = EXCLUDED.allowed_b2b,
           notes = EXCLUDED.notes,
           updated_at = NOW()`,
        [rights.providerId, rights.allowedCollect, rights.allowedB2c, rights.allowedB2b, rights.notes],
      )
    }

    const stoplistResult = await db.query(
      'SELECT provider_id, stoplist_status FROM silver.rights_matrix',
    )
    const stoplistByProvider = new Map(
      stoplistResult.rows.map(row => [row.provider_id, row.stoplist_status]),
    )

    const circuitResult = await db.query(
      'SELECT provider_id, corridor_id, state, cooldown_until FROM silver.circuit_breaker',
    )

    const now = new Date()
    const isCircuitOpen = (providerId: string, corridorId: string | null) => {
      return circuitResult.rows.some(row => {
        if (row.provider_id !== providerId) return false
        if (row.corridor_id !== null && row.corridor_id !== corridorId) return false
        if (row.state !== 'open') return false
        if (!row.cooldown_until) return true
        return new Date(row.cooldown_until) > now
      })
    }

    const logSkip = (providerId: string, corridorId: string | null, reason: string) => {
      const corridorLabel = corridorId || 'all'
      logger.info('seed_skip', { provider_id: providerId, corridor_id: corridorLabel, reason })
    }

    const ingestionRunIds = new Map<string, string>()

    for (const provider of providers) {
      if (!allowedProviders.has(provider.id)) continue
      const stoplistStatus = stoplistByProvider.get(provider.id) || 'active'
      if (stoplistStatus !== 'active') {
        logSkip(provider.id, null, `stoplist_${stoplistStatus}`)
        continue
      }
      if (isCircuitOpen(provider.id, null)) {
        logSkip(provider.id, null, 'circuit_open')
        continue
      }

      await db.query(
        `INSERT INTO silver.provider (provider_id, display_name)
         VALUES ($1, $2)
         ON CONFLICT (provider_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           updated_at = NOW()`,
        [provider.id, provider.name],
      )

      const ingestionRunResult = await db.query(
        `INSERT INTO silver.ingestion_run (provider_id, collector_type, started_at, finished_at, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING run_id`,
        [provider.id, 'seed', now, now, 'success'],
      )
      if (ingestionRunResult.rows[0]?.run_id) {
        ingestionRunIds.set(provider.id, ingestionRunResult.rows[0].run_id)
      }
    }

    for (const corridor of corridors) {
      await db.query(
        `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (corridor_id) DO UPDATE SET
           source_country = EXCLUDED.source_country,
           dest_country = EXCLUDED.dest_country,
           source_currency = EXCLUDED.source_currency,
           dest_currency = EXCLUDED.dest_currency,
           updated_at = NOW()`,
        [
          corridor.id,
          corridor.fromCountry,
          corridor.toCountry,
          corridor.sendCurrency,
          corridor.recvCurrency,
        ],
      )

    }

    for (const quote of providerQuotes) {
      if (!allowedProviders.has(quote.providerId)) continue
      const stoplistStatus = stoplistByProvider.get(quote.providerId) || 'active'
      if (stoplistStatus !== 'active') {
        logSkip(quote.providerId, quote.corridorId, `stoplist_${stoplistStatus}`)
        continue
      }
      if (isCircuitOpen(quote.providerId, quote.corridorId)) {
        logSkip(quote.providerId, quote.corridorId, 'circuit_open')
        continue
      }

      const ingestionRunId = ingestionRunIds.get(quote.providerId)
      if (!ingestionRunId) {
        logSkip(quote.providerId, quote.corridorId, 'missing_ingestion_run')
        continue
      }

      const sendAmount = 100
      const feeAmount = quote.fee
      const totalDebitAmount = sendAmount + feeAmount
      const promotionalFeeAmount = null
      const promotionalRate = quote.promotionalRate ?? null
      const baseRate = quote.baseRate ?? (quote.promotionalRate ? quote.fxRate : null)
      const promotionalCapAmount = quote.promotionalCapAmount ?? null
      const appliedFxRate = promotionalRate ?? quote.fxRate
      const receiveAmount = (sendAmount - feeAmount) * appliedFxRate
      const impliedFxRate = appliedFxRate
      const collectedAt = new Date()
      const ingestedAt = new Date()
      const amountBucket = Math.round(sendAmount)
      const payin = quote.payinMethod ?? quote.methods[0] ?? 'bank_transfer'
      const payout =
        quote.payoutMethod ??
        (quote.methods.includes('cash_pickup')
          ? 'cash_pickup'
          : quote.methods.includes('mobile_wallet')
            ? 'mobile_wallet'
            : 'bank_deposit')
      const deliveryWindow = parseDeliveryMinutes(quote.delivery)
      const bronzeResult = await db.query(
        `INSERT INTO bronze.provider_raw (provider_id, corridor, payload)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          quote.providerId,
          quote.corridorId,
          {
            providerId: quote.providerId,
            corridorId: quote.corridorId,
            fee: quote.fee,
            marginPct: quote.marginPct,
            fxRate: quote.fxRate,
            promotionalRate,
            baseRate,
            promotionalCapAmount,
            delivery: quote.delivery,
            methods: quote.methods,
            reliability: quote.reliability,
            payinMethod: quote.payinMethod,
            payoutMethod: quote.payoutMethod,
          },
        ],
      )

      const bronzeObjectKey = String(bronzeResult.rows[0].id)

      await db.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          quote.providerId,
          quote.corridorId,
          amountBucket,
          payin,
          payout,
          sendAmount,
          feeAmount,
          promotionalFeeAmount,
          totalDebitAmount,
          receiveAmount,
          impliedFxRate,
          promotionalRate,
          baseRate,
          promotionalCapAmount,
          deliveryWindow.min,
          deliveryWindow.max,
          'ok',
          null,
          null,
          collectedAt,
          ingestedAt,
          ingestionRunId,
          bronzeObjectKey,
        ],
      )

      await db.query(
        `INSERT INTO silver.latest_quote_by_provider
         (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, quality_flags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (corridor_id, amount_bucket, payin, payout, provider_id) DO UPDATE SET
           collected_at = EXCLUDED.collected_at,
           send_amount = EXCLUDED.send_amount,
           fee_amount = EXCLUDED.fee_amount,
           promotional_fee_amount = EXCLUDED.promotional_fee_amount,
           total_debit_amount = EXCLUDED.total_debit_amount,
           receive_amount = EXCLUDED.receive_amount,
           implied_fx_rate = EXCLUDED.implied_fx_rate,
           promotional_rate = EXCLUDED.promotional_rate,
           base_rate = EXCLUDED.base_rate,
           promotional_cap_amount = EXCLUDED.promotional_cap_amount,
           delivery_time_min_minutes = EXCLUDED.delivery_time_min_minutes,
           delivery_time_max_minutes = EXCLUDED.delivery_time_max_minutes,
           status = EXCLUDED.status,
           quality_flags = EXCLUDED.quality_flags,
           updated_at = NOW()`,
        [
          quote.corridorId,
          amountBucket,
          payin,
          payout,
          quote.providerId,
          collectedAt,
          sendAmount,
          feeAmount,
          promotionalFeeAmount,
          totalDebitAmount,
          receiveAmount,
          impliedFxRate,
          promotionalRate,
          baseRate,
          promotionalCapAmount,
          deliveryWindow.min,
          deliveryWindow.max,
          'ok',
          null,
        ],
      )

      // Bronze write handled above to capture provider_raw id for provenance.
    }

    for (const rate of fxRates) {
      await db.query(
        `INSERT INTO gold.fx_rates (base_currency, quote_currency, rate)
         VALUES ($1, $2, $3)
         ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
           rate = EXCLUDED.rate,
           updated_at = NOW()`,
        [rate.base, rate.quote, rate.rate],
      )
    }

    for (const rate of fxProviderRates) {
      await db.query(
        `INSERT INTO gold.fx_provider_rates (provider_name, base_currency, quote_currency, rate, markup_bps, speed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (provider_name, base_currency, quote_currency) DO UPDATE SET
           rate = EXCLUDED.rate,
           markup_bps = EXCLUDED.markup_bps,
           speed = EXCLUDED.speed,
           updated_at = NOW()`,
        [rate.providerName, rate.base, rate.quote, rate.rate, rate.markupBps, rate.speed],
      )
    }

    await db.query('DELETE FROM gold.popular_corridors')
    for (const corridor of popularCorridors) {
      await db.query(
        `INSERT INTO gold.popular_corridors (route, count_24h, top_provider, fee_range, speed_range, best_for)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          corridor.route,
          corridor.count24h,
          corridor.topProvider,
          corridor.feeRange,
          corridor.speedRange,
          corridor.bestFor,
        ],
      )
    }

    const cacheEntries = pulseCacheEntries()
    for (const [key, payload] of Object.entries(cacheEntries)) {
      await db.query(
        `INSERT INTO gold.pulse_cache (key, payload)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET
           payload = EXCLUDED.payload,
           updated_at = NOW()`,
        [key, serializeJson(payload)],
      )
    }

    await db.query('COMMIT')
    logger.info('ingestion_finish', { mode: 'seed', status: 'success' })
    return true
  } catch (error) {
    await db.query('ROLLBACK')
    logger.error('ingestion_error', { mode: 'seed', error })
    throw error
  } finally {
    if (shouldClose) {
      await db.end()
    }
  }
}

if (require.main === module) {
  runIngestion()
    .then((ran) => {
      if (ran) {
        logger.info('ingestion_complete', { mode: config.planeB.useSeedData ? 'seed' : 'collector' })
      }
      process.exit(0)
    })
    .catch((error) => {
      logger.error('ingestion_failed', { error })
      process.exit(1)
    })
}
