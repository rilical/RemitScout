/**
 * Ingest Fanout Worker - SQS consumer for ingestion shard payloads.
 *
 * Runs provider collection tasks from the ingest fanout queue when
 * `PLANE_B_INGEST_FANOUT_QUEUE_MODE=queue` is enabled.
 */

import { setTimeout as sleep } from 'timers/promises'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import {
  deleteMessages,
  receiveJsonMessages,
  createVisibilityTimeoutExtender,
  sendJsonMessage,
} from '../shared/sqs'
import { providerRegistry } from '../plane-b/src/providers'
import { B2bSweepRepository, ProviderCapabilityRepository } from '../plane-b/src/repositories'
import { resolveProviderSupport } from '../plane-b/src/services/provider-capability'
import { VolatilityService } from '../plane-b/src/services/volatility-service'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'

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
  requestedAt?: string
  sweepRunId?: string
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
  requestedAt?: string
  attempt?: number
  sweepRunId?: string
}

type IngestFanoutPayload = IngestFanoutMessage | IngestFanoutCorridorMessage

const logger = createLogger('script.ingest-fanout-worker')
const queueUrl = config.queues.ingestFanout.url
const queueMode = config.queues.ingestFanout.mode

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.INGEST_FANOUT_BATCH_SIZE, 5)
const idleSleepMs = toNumber(process.env.INGEST_FANOUT_IDLE_SLEEP_MS, 1000)
const shutdownTimeoutMs = toNumber(process.env.INGEST_FANOUT_SHUTDOWN_TIMEOUT_MS, 30000)
const maxConcurrency = Math.max(1, toNumber(process.env.INGEST_FANOUT_CONCURRENCY, batchSize))
const providerConcurrency = Math.max(
  1,
  toNumber(process.env.INGEST_FANOUT_PROVIDER_CONCURRENCY, 3),
)
const maxAttempts = Math.max(1, toNumber(process.env.INGEST_FANOUT_MAX_ATTEMPTS, 3))
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

const providerById = new Map(providerRegistry.map(provider => [provider.providerId, provider]))

type MethodSets = {
  payinMethods: Set<string>
  payoutMethods: Set<string>
}

const PAYIN_METHOD_PRIORITY = [
  'bank_transfer',
  'cash',
  'debit_card',
  'credit_card',
]

const PAYOUT_METHOD_PRIORITY = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
]

const normalizeMethod = (value: string) => value.trim().toLowerCase()

const isObservationCollector = (collectorType: string, priorityTier?: string) => {
  if (collectorType === 'b2b_observation' || collectorType === 'b2b_full_sweep_monthly') {
    return true
  }
  if (priorityTier && priorityTier.startsWith('observation')) {
    return true
  }
  return false
}

const normalizeMethodList = (methods?: string[] | null): Set<string> => {
  const normalized = new Set<string>()
  if (!Array.isArray(methods)) return normalized
  for (const method of methods) {
    const value = method ? normalizeMethod(method) : ''
    if (value) normalized.add(value)
  }
  return normalized
}

const buildCandidateList = (preferred: string, fallbacks: string[]) => {
  const seen = new Set<string>()
  const candidates: string[] = []
  const add = (value: string) => {
    const normalized = normalizeMethod(value)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    candidates.push(normalized)
  }
  add(preferred)
  for (const value of fallbacks) add(value)
  return candidates
}

const resolveMethod = (
  supported: Set<string>,
  preferred: string,
  fallbackList: string[],
) => {
  const preferredKey = normalizeMethod(preferred)
  if (supported.size === 0) {
    return { value: preferred, supported: true, fallbackUsed: false }
  }
  const candidates = buildCandidateList(preferred, fallbackList)
  for (const candidate of candidates) {
    if (supported.has(candidate)) {
      return {
        value: candidate === preferredKey ? preferred : candidate,
        supported: true,
        fallbackUsed: candidate !== preferredKey,
      }
    }
  }
  return { value: preferred, supported: false, fallbackUsed: false }
}

const runSweepUpdate = async (
  sweepRunId: string | undefined,
  context: Record<string, unknown>,
  action: () => Promise<void>,
) => {
  if (!sweepRunId) return
  try {
    await action()
  } catch (error) {
    logger.warn('b2b_sweep_tracking_failed', {
      sweep_run_id: sweepRunId,
      ...context,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const buildTaskKeys = (payload: IngestFanoutMessage) => {
  const keys: Array<{
    providerId: string
    corridorId: string
    amountBucket: number
    payinMethod: string
    payoutMethod: string
  }> = []
  for (const corridorId of payload.corridors) {
    for (const amountBucket of payload.amountBuckets) {
      keys.push({
        providerId: payload.providerId,
        corridorId,
        amountBucket,
        payinMethod: payload.payinMethod,
        payoutMethod: payload.payoutMethod,
      })
    }
  }
  return keys
}

const resolveCorridorMethods = async (
  repo: ProviderCapabilityRepository,
  cache: Map<string, MethodSets | null>,
  task: IngestFanoutProviderTask,
  corridorId: string,
) => {
  const cacheKey = `${task.providerId}:${corridorId}`
  let methods = cache.get(cacheKey)
  if (methods === undefined) {
    const capability = await repo.getCapability(task.providerId, corridorId)
    if (capability) {
      methods = {
        payinMethods: normalizeMethodList(capability.payin_methods),
        payoutMethods: normalizeMethodList(capability.payout_methods),
      }
    } else {
      methods = null
    }
    cache.set(cacheKey, methods)
  }

  if (!methods) {
    return { payinMethod: task.payinMethod, payoutMethod: task.payoutMethod, fallbackUsed: false }
  }

  const payin = resolveMethod(methods.payinMethods, task.payinMethod, PAYIN_METHOD_PRIORITY)
  const payout = resolveMethod(methods.payoutMethods, task.payoutMethod, PAYOUT_METHOD_PRIORITY)
  const fallbackUsed = payin.fallbackUsed || payout.fallbackUsed

  if (!payin.supported || !payout.supported) {
    logger.warn('fanout_method_unsupported', {
      provider_id: task.providerId,
      corridor_id: corridorId,
      payin_method: task.payinMethod,
      payout_method: task.payoutMethod,
    })
  }

  if (fallbackUsed) {
    logger.info('fanout_method_fallback', {
      provider_id: task.providerId,
      corridor_id: corridorId,
      payin_before: task.payinMethod,
      payout_before: task.payoutMethod,
      payin_after: payin.value,
      payout_after: payout.value,
    })
  }

  return { payinMethod: payin.value, payoutMethod: payout.value, fallbackUsed }
}

const isCorridorPayload = (payload: IngestFanoutPayload): payload is IngestFanoutCorridorMessage => {
  return (payload as IngestFanoutCorridorMessage).version === 'corridor_v1'
}

const validateProviderPayload = (payload: IngestFanoutMessage): boolean => {
  if (!payload.providerId || !payload.collectorType) return false
  if (!payload.payinMethod || !payload.payoutMethod) return false
  if (!Array.isArray(payload.corridors) || payload.corridors.length === 0) return false
  if (!Array.isArray(payload.amountBuckets) || payload.amountBuckets.length === 0) return false
  return true
}

const validateCorridorPayload = (payload: IngestFanoutCorridorMessage): boolean => {
  if (!payload.corridorId) return false
  if (!Array.isArray(payload.providers) || payload.providers.length === 0) return false
  return payload.providers.every((task) =>
    Boolean(task.providerId)
    && Boolean(task.collectorType)
    && Boolean(task.payinMethod)
    && Boolean(task.payoutMethod)
    && Array.isArray(task.amountBuckets)
    && task.amountBuckets.length > 0,
  )
}

const validatePayload = (payload: IngestFanoutPayload | null): payload is IngestFanoutPayload => {
  if (!payload) return false
  if (isCorridorPayload(payload)) {
    return validateCorridorPayload(payload)
  }
  return validateProviderPayload(payload)
}

const processProviderPayload = async (
  pool: ReturnType<typeof createPool>,
  sweepRepo: B2bSweepRepository,
  message: { messageId: string; receiptHandle: string; payload: IngestFanoutMessage },
): Promise<boolean> => {
  const { payload } = message
  const provider = providerById.get(payload.providerId)
  if (!provider) {
    logger.warn('fanout_provider_missing', { provider_id: payload.providerId })
    return true // Delete invalid messages
  }

  const sweepRunId = payload.sweepRunId
  const taskKeys = buildTaskKeys(payload)
  if (sweepRunId && taskKeys.length > 0) {
    await runSweepUpdate(
      sweepRunId,
      {
        provider_id: payload.providerId,
        status: 'processing',
        corridors: payload.corridors.length,
      },
      () => sweepRepo.markTasksProcessingBatch(sweepRunId, taskKeys),
    )
  }

  const ok = await withWorkerRetry(
    () => provider.run({
      pool,
      collectorType: payload.collectorType,
      corridors: payload.corridors,
      amountBuckets: payload.amountBuckets,
      payinMethod: payload.payinMethod,
      payoutMethod: payload.payoutMethod,
      freshnessSloMinutes: payload.freshnessSloMinutes,
      freshnessSloEnabled: payload.freshnessSloEnabled,
      rpmOverride: payload.rpmOverride,
      perCorridorRpmOverride: payload.perCorridorRpmOverride,
    }),
    {
      maxRetries: 3,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
    },
  )

  if (sweepRunId && taskKeys.length > 0) {
    await runSweepUpdate(
      sweepRunId,
      {
        provider_id: payload.providerId,
        status: ok ? 'success' : 'failed',
        corridors: payload.corridors.length,
      },
      () => sweepRepo.markTasksFinishedBatch(
        sweepRunId,
        taskKeys,
        ok ? 'success' : 'failed',
        ok ? null : 'run_failed',
      ),
    )
    const summary = await sweepRepo.getRunSummary(sweepRunId)
    if (summary.remaining === 0) {
      const status = summary.failed > 0 ? 'failed' : 'completed'
      await runSweepUpdate(
        sweepRunId,
        {
          provider_id: payload.providerId,
          status,
        },
        () => sweepRepo.updateSweepRunStatus(sweepRunId, status, new Date()),
      )
    }
  }

  if (ok) {
    try {
      const volatilityService = new VolatilityService(pool)
      const corridors = Array.from(new Set(payload.corridors))
      const updated = await volatilityService.refreshCacheForCorridors(corridors)
      logger.info('fanout_volatility_refreshed', {
        provider_id: payload.providerId,
        corridors: corridors.length,
        updated,
      })
    } catch (error) {
      logger.warn('fanout_volatility_refresh_failed', {
        provider_id: payload.providerId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  await recordWorkerMetric('ingest-fanout-worker', 'message_processed', 1)
  logger.info('fanout_item_done', {
    provider_id: payload.providerId,
    collector_type: payload.collectorType,
    corridors: payload.corridors.length,
    priority_tier: payload.priorityTier,
    shard_index: payload.shardIndex ?? null,
    ok,
  })
  return true
}

const processCorridorPayload = async (
  pool: ReturnType<typeof createPool>,
  capabilityRepo: ProviderCapabilityRepository,
  capabilityCache: Map<string, MethodSets | null>,
  sweepRepo: B2bSweepRepository,
  message: { messageId: string; receiptHandle: string; payload: IngestFanoutCorridorMessage },
): Promise<boolean> => {
  const { payload } = message
  const sweepRunId = payload.sweepRunId
  const failedProviders: IngestFanoutProviderTask[] = []
  let anySuccess = false
  let taskIndex = 0

  const runTask = async (task: IngestFanoutProviderTask) => {
    try {
      const provider = providerById.get(task.providerId)
      if (!provider) {
        logger.warn('fanout_provider_missing', { provider_id: task.providerId })
        await runSweepUpdate(
          sweepRunId,
          {
            provider_id: task.providerId,
            corridor_id: payload.corridorId,
            status: 'skipped',
          },
          () => sweepRepo.markTaskFinished(
            sweepRunId!,
            {
              providerId: task.providerId,
              corridorId: payload.corridorId,
              amountBucket: task.amountBuckets[0],
              payinMethod: task.payinMethod,
              payoutMethod: task.payoutMethod,
            },
            'skipped',
            'provider_missing',
          ),
        )
        return
      }
      const resolved = await resolveCorridorMethods(
        capabilityRepo,
        capabilityCache,
        task,
        payload.corridorId,
      )
      const taskKey = {
        providerId: task.providerId,
        corridorId: payload.corridorId,
        amountBucket: task.amountBuckets[0],
        payinMethod: task.payinMethod,
        payoutMethod: task.payoutMethod,
      }
      await runSweepUpdate(
        sweepRunId,
        {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          status: 'processing',
        },
        () => sweepRepo.markTaskProcessing(sweepRunId!, taskKey),
      )
      const observationMode = config.planeB.b2bObservationMode
        || isObservationCollector(task.collectorType, task.priorityTier)
      const supportDecision = await resolveProviderSupport(
        pool,
        {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          amount_bucket: task.amountBuckets[0],
          payin_method: resolved.payinMethod,
          payout_method: resolved.payoutMethod,
          send_amount: task.amountBuckets[0],
          locale: 'en-US',
        },
        {
          allowProbe: observationMode,
          skipCatalog: observationMode && config.planeB.b2bObservationBypassCatalog,
          refreshUnsupportedAfterDays: observationMode
            ? config.planeB.b2bObservationUnsupportedTtlDays
            : 0,
        },
      )
      if (!supportDecision.supported) {
        logger.info('fanout_capability_skipped', {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          reason: supportDecision.reason,
          source: supportDecision.source,
        })
        await runSweepUpdate(
          sweepRunId,
          {
            provider_id: task.providerId,
            corridor_id: payload.corridorId,
            status: 'skipped',
            reason: supportDecision.reason,
          },
          () => sweepRepo.markTaskFinished(sweepRunId!, taskKey, 'skipped', supportDecision.reason),
        )
        return
      }
      const ok = await withWorkerRetry(
        () => provider.run({
          pool,
          collectorType: task.collectorType,
          corridors: [payload.corridorId],
          amountBuckets: task.amountBuckets,
          payinMethod: resolved.payinMethod,
          payoutMethod: resolved.payoutMethod,
          freshnessSloMinutes: task.freshnessSloMinutes,
          freshnessSloEnabled: task.freshnessSloEnabled,
          rpmOverride: task.rpmOverride,
          perCorridorRpmOverride: task.perCorridorRpmOverride,
        }),
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
        },
      )
      if (!ok) {
        failedProviders.push(task)
        await runSweepUpdate(
          sweepRunId,
          {
            provider_id: task.providerId,
            corridor_id: payload.corridorId,
            status: 'failed',
          },
          () => sweepRepo.markTaskFinished(sweepRunId!, taskKey, 'failed', 'run_failed'),
        )
        return
      }
      anySuccess = true
      await runSweepUpdate(
        sweepRunId,
        {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          status: 'success',
        },
        () => sweepRepo.markTaskFinished(sweepRunId!, taskKey, 'success'),
      )
    } catch (error) {
      failedProviders.push(task)
      logger.error('fanout_provider_task_failed', {
        provider_id: task.providerId,
        corridor_id: payload.corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      await runSweepUpdate(
        sweepRunId,
        {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          status: 'failed',
        },
        () => sweepRepo.markTaskFinished(sweepRunId!, {
          providerId: task.providerId,
          corridorId: payload.corridorId,
          amountBucket: task.amountBuckets[0],
          payinMethod: task.payinMethod,
          payoutMethod: task.payoutMethod,
        }, 'failed', 'exception'),
      )
    }
  }

  const workers = Array.from(
    { length: Math.min(providerConcurrency, payload.providers.length) },
    async () => {
      while (!shutdownRequested) {
        const task = payload.providers[taskIndex]
        if (!task) return
        taskIndex += 1
        await runTask(task)
      }
    },
  )

  await Promise.all(workers)

  if (sweepRunId) {
    try {
      const summary = await sweepRepo.getRunSummary(sweepRunId)
      if (summary.remaining === 0) {
        const status = summary.failed > 0 ? 'failed' : 'completed'
        await runSweepUpdate(
          sweepRunId,
          {
            corridor_id: payload.corridorId,
            status,
          },
          () => sweepRepo.updateSweepRunStatus(sweepRunId, status, new Date()),
        )
      }
    } catch (error) {
      logger.warn('b2b_sweep_summary_failed', {
        sweep_run_id: sweepRunId,
        corridor_id: payload.corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (anySuccess) {
    try {
      const volatilityService = new VolatilityService(pool)
      const updated = await volatilityService.refreshCacheForCorridors([payload.corridorId])
      logger.info('fanout_volatility_refreshed', {
        corridor_id: payload.corridorId,
        updated,
      })
    } catch (error) {
      logger.warn('fanout_volatility_refresh_failed', {
        corridor_id: payload.corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (failedProviders.length > 0) {
    const attempt = (payload.attempt ?? 0) + 1
    if (attempt <= maxAttempts) {
      try {
        await sendJsonMessage(queueUrl!, {
          ...payload,
          providers: failedProviders,
          attempt,
        })
        logger.warn('fanout_corridor_requeued', {
          corridor_id: payload.corridorId,
          failed_providers: failedProviders.length,
          attempt,
        })
      } catch (error) {
        logger.error('fanout_corridor_requeue_failed', {
          corridor_id: payload.corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
        return false
      }
    } else {
      logger.error('fanout_corridor_dropped', {
        corridor_id: payload.corridorId,
        failed_providers: failedProviders.length,
        attempt,
      })
    }
  }

  await recordWorkerMetric('ingest-fanout-worker', 'message_processed', 1)
  logger.info('fanout_corridor_done', {
    corridor_id: payload.corridorId,
    providers: payload.providers.length,
    failed_providers: failedProviders.length,
    attempt: payload.attempt ?? 0,
  })
  return true
}

const processMessage = async (
  pool: ReturnType<typeof createPool>,
  capabilityRepo: ProviderCapabilityRepository,
  capabilityCache: Map<string, MethodSets | null>,
  sweepRepo: B2bSweepRepository,
  message: { messageId: string; receiptHandle: string; payload: IngestFanoutPayload },
): Promise<boolean> => {
  const { payload } = message

  try {
    const stopExtending = createVisibilityTimeoutExtender(
      queueUrl!,
      message.receiptHandle,
      () => logger.debug('visibility_extended', { message_id: message.messageId }),
    )

    try {
      if (isCorridorPayload(payload)) {
        return await processCorridorPayload(
          pool,
          capabilityRepo,
          capabilityCache,
          sweepRepo,
          { ...message, payload },
        )
      }
      return await processProviderPayload(pool, sweepRepo, { ...message, payload })
    } finally {
      await stopExtending()
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const providerId = isCorridorPayload(payload)
      ? payload.providers.map(task => task.providerId).join(',')
      : payload.providerId
    logger.error('fanout_item_failed', {
      provider_id: providerId,
      corridor_id: isCorridorPayload(payload) ? payload.corridorId : undefined,
      error: err.message,
    })
    await recordWorkerMetric('ingest-fanout-worker', 'message_failed', 1)
    return false
  }
}

const processMessagesWithConcurrency = async (
  pool: ReturnType<typeof createPool>,
  capabilityRepo: ProviderCapabilityRepository,
  capabilityCache: Map<string, MethodSets | null>,
  sweepRepo: B2bSweepRepository,
  messages: Array<{ messageId: string; receiptHandle: string; payload: IngestFanoutPayload | null }>,
): Promise<string[]> => {
  const deleteHandles: string[] = []
  let index = 0

  const workers = Array.from({ length: Math.min(maxConcurrency, messages.length) }, async () => {
    while (!shutdownRequested) {
      const current = messages[index]
      if (!current) return
      index += 1

      const payload = current.payload
      if (!validatePayload(payload)) {
        logger.warn('fanout_item_invalid', { message_id: current.messageId })
        deleteHandles.push(current.receiptHandle)
        continue
      }

      const processed = await processMessage(pool, capabilityRepo, capabilityCache, sweepRepo, {
        ...current,
        payload,
      })
      if (processed) {
        deleteHandles.push(current.receiptHandle)
      }
    }
  })

  await Promise.all(workers)
  return deleteHandles
}

const runWorker = async () => {
  logger.info('fanout_worker_boot', {
    queue_mode: queueMode,
    queue_url: queueUrl ? 'set' : 'missing',
    batch_size: batchSize,
    concurrency: maxConcurrency,
    provider_concurrency: providerConcurrency,
    max_attempts: maxAttempts,
  })
  if (queueMode !== 'queue') {
    logger.warn('fanout_worker_disabled', { mode: queueMode })
    return
  }

  if (!queueUrl) {
    logger.warn('fanout_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const pool = createPool(config.db.planeBUrl)
  const capabilityRepo = new ProviderCapabilityRepository(pool)
  const capabilityCache = new Map<string, MethodSets | null>()
  const sweepRepo = new B2bSweepRepository(pool)

  try {
    logger.info('fanout_worker_start', {
      batch_size: batchSize,
      concurrency: maxConcurrency,
      provider_concurrency: providerConcurrency,
    })
    while (!shutdownRequested) {
      const messages = await receiveJsonMessages<IngestFanoutPayload>(queueUrl, batchSize)
      if (messages.length === 0) {
        await sleep(idleSleepMs)
        continue
      }
      const deleteHandles = await processMessagesWithConcurrency(
        pool,
        capabilityRepo,
        capabilityCache,
        sweepRepo,
        messages,
      )
      await deleteMessages(queueUrl, deleteHandles)
    }
  } finally {
    await pool.end()
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
  }
}

export const runIngestFanoutWorkerLoop = async (): Promise<number> => {
  await runWorker()
  return 0
}

if (require.main === module) {
  runIngestFanoutWorkerLoop()
    .then(code => process.exit(code))
    .catch((error) => {
      logger.error('fanout_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
