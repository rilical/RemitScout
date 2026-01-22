/**
 * B2B Observation Scheduler - plans a long-running observation sweep and enqueues
 * unique corridor+provider tasks in small batches to avoid queue congestion.
 */

import { randomUUID } from 'node:crypto'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getQueueStats, sendBatchJsonMessages } from '../shared/sqs'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { parseCorridorId } from '../shared/corridor'
import { getCountryByCode } from '../shared/countries-currencies'
import { providerRegistry, type ProviderRegistryEntry } from '../plane-b/src/providers'
import {
  B2bSweepRepository,
  ProviderCapabilityRepository,
  RightsMatrixRepository,
} from '../plane-b/src/repositories'
import { filterQueuesByRightsMatrix } from '../plane-b/src/services/rights-matrix-filter'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'

const logger = createLogger('script.b2b-observation-scheduler')

const queueUrl = config.queues.ingestFanout.url
const queueMode = config.queues.ingestFanout.mode

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.B2B_OBSERVATION_LOCK_TTL_SECONDS, 60)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))

const observationPriorityTier = 'observation_monthly'
const observationCollectorType = 'b2b_observation'
const defaultPayinMethod = 'bank_transfer'
const defaultPayoutMethod = 'bank_deposit'

const rawProviderBatchSize = Number.parseInt(
  process.env.PLANE_B_B2B_CORRIDOR_PROVIDER_BATCH_SIZE || '3',
  10,
)
const providerBatchSize = Number.isFinite(rawProviderBatchSize)
  ? Math.max(0, rawProviderBatchSize)
  : 0

type RightsMatrixEntry = {
  allowedCollect: boolean
  allowedB2b: boolean
  stoplistStatus: string
  sourceCountries: string[] | null
  destinationCountries: string[] | null
}

type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  tier3: string[]
  all: string[]
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
}

type IngestFanoutCorridorMessage = {
  version: 'corridor_v1'
  corridorId: string
  providers: IngestFanoutProviderTask[]
  requestedAt: string
  sweepRunId: string
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

const loadProviderRights = async (pool: ReturnType<typeof createPool>) => {
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

const buildObservationQueues = (corridors: string[]): PriorityQueues => {
  return {
    tier1: [],
    tier2: corridors,
    tier3: [],
    all: corridors,
  }
}

const buildUniqueCorridorList = (corridors: string[]): string[] => {
  const seen = new Set<string>()
  const output: string[] = []
  for (const corridor of corridors) {
    if (!corridor || seen.has(corridor)) continue
    seen.add(corridor)
    output.push(corridor)
  }
  return output
}

const loadObservationCorridorsForProvider = async (
  pool: ReturnType<typeof createPool>,
  provider: ProviderRegistryEntry,
  rights: RightsMatrixEntry | undefined,
): Promise<string[]> => {
  const capabilityRepo = new ProviderCapabilityRepository(pool)
  const observed = await capabilityRepo.loadObservedCorridors(provider.providerId)
  const observedIds = observed.map(row => row.corridor_id).filter(Boolean) as string[]
  const unsupportedTtlDays = Math.max(0, config.planeB.b2bObservationUnsupportedTtlDays)
  const unsupportedCutoffMs = unsupportedTtlDays > 0
    ? Date.now() - unsupportedTtlDays * 24 * 60 * 60 * 1000
    : 0
  const unsupportedRows = unsupportedTtlDays > 0
    ? await capabilityRepo.loadUnsupportedCorridorsWithAge(provider.providerId)
    : []
  const unsupportedSet = new Set<string>()
  for (const row of unsupportedRows) {
    if (!row.corridor_id) continue
    if (!row.last_verified_at) continue
    const lastVerified = new Date(row.last_verified_at).getTime()
    if (lastVerified >= unsupportedCutoffMs) {
      unsupportedSet.add(row.corridor_id)
    }
  }

  const combined = buildUniqueCorridorList([
    ...provider.supportedCorridors,
    ...observedIds,
  ])

  const filtered = combined.filter(corridorId => !unsupportedSet.has(corridorId))
  if (!config.planeB.b2bObservationBypassRightsMatrix && rights) {
    const queues = filterQueuesByRightsMatrix(
      buildObservationQueues(filtered),
      rights,
      provider.providerId,
    )
    return queues.all
  }
  return filtered
}

const buildObservationTasks = async (
  pool: ReturnType<typeof createPool>,
  providers: ProviderRegistryEntry[],
  rightsByProvider: Map<string, RightsMatrixEntry>,
) => {
  const tasks: Array<{
    corridorId: string
    providerId: string
    collectorType: string
    priorityTier: string
    amountBucket: number
    payinMethod: string
    payoutMethod: string
  }> = []
  const uniqueCorridors = new Set<string>()
  let providersTotal = 0

  for (const provider of providers) {
    const rights = rightsByProvider.get(provider.providerId)
    const bypassRights = config.planeB.b2bObservationBypassRightsMatrix
    if (!rights) {
      if (!bypassRights) {
        logger.info('b2b_observation_skipped', { provider_id: provider.providerId, reason: 'rights_missing' })
        continue
      }
    } else {
      if (rights.stoplistStatus !== 'active') {
        logger.info('b2b_observation_skipped', {
          provider_id: provider.providerId,
          reason: `stoplist_${rights.stoplistStatus}`,
        })
        continue
      }
      if (!bypassRights && !rights.allowedCollect) {
        logger.info('b2b_observation_skipped', { provider_id: provider.providerId, reason: 'allowed_collect_false' })
        continue
      }
      if (!bypassRights && !rights.allowedB2b) {
        logger.info('b2b_observation_skipped', { provider_id: provider.providerId, reason: 'allowed_b2b_false' })
        continue
      }
    }

    let corridors = await loadObservationCorridorsForProvider(pool, provider, rights)
    if (config.planeB.b2bNativeCurrencyOnly && !(config.planeB.b2bWiseCurrencyOverride && provider.providerId === 'wise')) {
      corridors = corridors.filter(isNativeCurrencyCorridor)
    }

    if (corridors.length === 0) {
      continue
    }

    providersTotal += 1
    const amountBucket = config.planeB.remitly.b2bAmount
    for (const corridorId of corridors) {
      if (!corridorId) continue
      uniqueCorridors.add(corridorId)
      tasks.push({
        corridorId,
        providerId: provider.providerId,
        collectorType: observationCollectorType,
        priorityTier: observationPriorityTier,
        amountBucket,
        payinMethod: defaultPayinMethod,
        payoutMethod: defaultPayoutMethod,
      })
    }
  }

  return {
    tasks,
    corridorsTotal: tasks.length,
    providersTotal,
    uniqueCorridors: uniqueCorridors.size,
  }
}

const enqueueObservationTasks = async (
  sweepRepo: B2bSweepRepository,
  runId: string,
): Promise<number> => {
  if (queueMode !== 'queue' || !queueUrl) {
    logger.warn('b2b_observation_queue_disabled', { mode: queueMode, queue_url: Boolean(queueUrl) })
    return 0
  }

  const maxQueueDepth = config.planeB.b2bObservationMaxQueueDepth || config.planeB.b2bMaxQueueDepth
  if (maxQueueDepth > 0) {
    const stats = await getQueueStats(queueUrl)
    if (stats.total >= maxQueueDepth) {
      logger.warn('b2b_observation_backpressure', {
        queue_depth: stats.total,
        queue_visible: stats.visible,
        queue_in_flight: stats.inFlight,
        max_queue_depth: maxQueueDepth,
      })
      return 0
    }
  }

  const batchSize = Math.max(1, Math.floor(config.planeB.b2bObservationBatchSize || 0))
  const pending = await sweepRepo.loadPendingTasks(runId, batchSize)
  if (pending.length === 0) {
    logger.info('b2b_observation_no_pending', { sweep_run_id: runId })
    return 0
  }

  const tasksByCorridor = new Map<string, IngestFanoutProviderTask[]>()
  const keysByCorridor = new Map<string, Array<{ providerId: string; corridorId: string; amountBucket: number; payinMethod: string; payoutMethod: string }>>()

  for (const task of pending) {
    const corridorTasks = tasksByCorridor.get(task.corridorId) ?? []
    corridorTasks.push({
      providerId: task.providerId,
      collectorType: task.collectorType,
      amountBuckets: [task.amountBucket],
      payinMethod: task.payinMethod,
      payoutMethod: task.payoutMethod,
      priorityTier: task.priorityTier,
      freshnessSloEnabled: false,
      freshnessSloMinutes: undefined,
    })
    tasksByCorridor.set(task.corridorId, corridorTasks)

    const corridorKeys = keysByCorridor.get(task.corridorId) ?? []
    corridorKeys.push({
      providerId: task.providerId,
      corridorId: task.corridorId,
      amountBucket: task.amountBucket,
      payinMethod: task.payinMethod,
      payoutMethod: task.payoutMethod,
    })
    keysByCorridor.set(task.corridorId, corridorKeys)
  }

  const messageEntries: Array<{
    id: string
    payload: IngestFanoutCorridorMessage
    keys: Array<{ providerId: string; corridorId: string; amountBucket: number; payinMethod: string; payoutMethod: string }>
  }> = []

  const requestedAt = new Date().toISOString()

  for (const [corridorId, providers] of tasksByCorridor.entries()) {
    const keys = keysByCorridor.get(corridorId) ?? []
    const chunks: IngestFanoutProviderTask[][] = []
    if (providerBatchSize > 0 && providers.length > providerBatchSize) {
      for (let i = 0; i < providers.length; i += providerBatchSize) {
        chunks.push(providers.slice(i, i + providerBatchSize))
      }
    } else {
      chunks.push(providers)
    }

    let keyIndex = 0
    for (const chunk of chunks) {
      const chunkKeys = keys.slice(keyIndex, keyIndex + chunk.length)
      keyIndex += chunk.length
      messageEntries.push({
        id: randomUUID(),
        payload: {
          version: 'corridor_v1',
          corridorId,
          providers: chunk,
          requestedAt,
          sweepRunId: runId,
        },
        keys: chunkKeys,
      })
    }
  }

  let enqueuedTasks = 0
  const successKeys: Array<{ providerId: string; corridorId: string; amountBucket: number; payinMethod: string; payoutMethod: string }> = []
  for (let i = 0; i < messageEntries.length; i += 10) {
    const batch = messageEntries.slice(i, i + 10)
    const results = await sendBatchJsonMessages(
      queueUrl,
      batch.map(entry => ({ id: entry.id, payload: entry.payload })),
    )
    const successIds = new Set(results.filter(res => res.success).map(res => res.id))
    for (const entry of batch) {
      if (!successIds.has(entry.id)) continue
      successKeys.push(...entry.keys)
      enqueuedTasks += entry.keys.length
    }
  }

  if (successKeys.length > 0) {
    await sweepRepo.markTasksEnqueued(runId, successKeys)
  }

  logger.info('b2b_observation_enqueued', {
    sweep_run_id: runId,
    tasks_enqueued: enqueuedTasks,
    pending_loaded: pending.length,
    messages_sent: messageEntries.length,
  })

  return enqueuedTasks
}

const runObservationScheduler = async (): Promise<number> => {
  if (!config.planeB.b2bObservationSweepEnabled) {
    logger.info('b2b_observation_disabled', { reason: 'flag_off' })
    return 0
  }
  if (queueMode !== 'queue') {
    logger.warn('b2b_observation_disabled', { reason: 'queue_mode_off', mode: queueMode })
    return 0
  }
  if (!queueUrl) {
    logger.warn('b2b_observation_disabled', { reason: 'missing_queue_url' })
    return 0
  }

  const pool = createPool(config.db.planeBUrl)
  const sweepRepo = new B2bSweepRepository(pool)
  const lock = new WorkerLock('b2b-observation-scheduler', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    return 0
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'b2b-observation-scheduler',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  try {
    await recordBatchJobMetric('b2b-observation-scheduler', 'job_start')

    const cadenceDays = Math.max(1, Math.floor(config.planeB.b2bObservationRunDays || 30))
    const cadenceMinutes = cadenceDays * 24 * 60
    const targetMinutes = cadenceMinutes
    const intervalMs = cadenceMinutes * 60 * 1000

    let runId: string | null = null
    const activeRun = await sweepRepo.getActiveRunByTier(observationPriorityTier)
    if (activeRun) {
      runId = activeRun.runId
    } else {
      const latestRun = await sweepRepo.getLatestRunByTier(observationPriorityTier)
      if (latestRun && latestRun.createdAt) {
        const ageMs = Date.now() - new Date(latestRun.createdAt).getTime()
        if (ageMs < intervalMs) {
          logger.info('b2b_observation_not_due', {
            last_run_at: latestRun.createdAt,
            cadence_days: cadenceDays,
            age_minutes: Math.round(ageMs / 60000),
          })
          await recordBatchJobMetric('b2b-observation-scheduler', 'job_complete', 0)
          return 0
        }
      }

      runId = await sweepRepo.createSweepRun({
        priorityTier: observationPriorityTier,
        cadenceMinutes,
        targetMinutes,
        observationMode: true,
        corridorsTotal: 0,
        providersTotal: 0,
        status: 'running',
      })

      const rightsByProvider = await loadProviderRights(pool)
      const { tasks, corridorsTotal, providersTotal, uniqueCorridors } = await buildObservationTasks(
        pool,
        providerRegistry,
        rightsByProvider,
      )

      if (tasks.length === 0) {
        logger.warn('b2b_observation_empty', { sweep_run_id: runId })
        await sweepRepo.updateSweepRunStatus(runId, 'completed', new Date())
        await recordBatchJobMetric('b2b-observation-scheduler', 'job_complete', 0)
        return 0
      }

      await sweepRepo.insertSweepTasks(runId, tasks, { enqueuedAt: null })
      await sweepRepo.updateSweepRunTotals(runId, corridorsTotal, providersTotal)

      logger.info('b2b_observation_run_planned', {
        sweep_run_id: runId,
        corridors_total: corridorsTotal,
        providers_total: providersTotal,
        unique_corridors: uniqueCorridors,
        cadence_days: cadenceDays,
      })
    }

    const enqueued = await enqueueObservationTasks(sweepRepo, runId)
    await recordBatchJobMetric('b2b-observation-scheduler', 'job_complete', 0, {
      tasks_enqueued: String(enqueued),
    })
    return enqueued
  } catch (error) {
    logger.error('b2b_observation_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    await recordBatchJobMetric('b2b-observation-scheduler', 'job_failure')
    return 1
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release()
    await pool.end()
  }
}

if (require.main === module) {
  runObservationScheduler()
    .then(code => process.exit(code))
    .catch((error) => {
      logger.error('b2b_observation_fatal', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}

export { runObservationScheduler }
