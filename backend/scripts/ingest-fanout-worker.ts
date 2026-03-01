/**
 * Ingest Fanout Worker - SQS consumer for ingestion shard payloads.
 *
 * Runs provider collection tasks from the ingest fanout queue when
 * `PLANE_B_INGEST_FANOUT_QUEUE_MODE=queue` is enabled.
 */

import { setTimeout as sleep } from 'timers/promises'
import { context as otelContext } from '@opentelemetry/api'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from '../shared/health-server'
import {
  deleteMessages,
  receiveJsonMessages,
  createVisibilityTimeoutExtender,
  drainAndStop,
  sendJsonMessage,
  sendToDLQ,
  getQueueStats,
  type SqsMessage,
  type VisibilityTimeoutExtender,
} from '../shared/sqs'
import type { B2bSweepTaskKey } from '../plane-b/src/repositories/interfaces/b2b-sweep-repository.interface'
import { providerRegistry } from '../plane-b/src/providers'
import { B2bSweepRepository, ProviderCapabilityRepository } from '../plane-b/src/repositories'
import { resolveProviderSupport } from '../plane-b/src/services/provider-capability'
import { VolatilityService } from '../plane-b/src/services/volatility-service'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter, resolveJitterMs } from '../shared/worker-jitter'
import { createShutdownHandler } from '../shared/shutdown'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import { emitOpsEvent } from '../shared/ops-events'
import { isStale, resolveMessageAgeMs, unwrapEnvelopeOrLegacy } from '../shared/queue-staleness'
import type { QueueClass } from '../shared/queue-envelope'

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
  requestedAt?: string
  attempt?: number
  sweepRunId?: string
  traceId?: string
}

type IngestFanoutPayload = IngestFanoutMessage | IngestFanoutCorridorMessage

const logger = createLogger('script.ingest-fanout-worker')
const queueUrl = config.queues.ingestFanout.url
const queueMode = config.queues.ingestFanout.mode
const queueTier = (process.env.PLANE_B_INGEST_FANOUT_QUEUE_TIER || '').toLowerCase()
const expectedQueueClass: QueueClass = queueTier === 'tier2' ? 'ingest-fanout-t2' : 'ingest-fanout-t1'

initTracing('ingest-fanout-worker')
initErrorTracking('ingest-fanout-worker')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getQueueName = (url: string | null): string => {
  if (!url) return 'ingest-fanout'
  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'ingest-fanout'
}

const parseSentTimestampMs = (value: string | undefined): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
const stalenessEnabled = config.queueStaleness.enforcementEnabled
const staleWindowMs = expectedQueueClass === 'ingest-fanout-t2'
  ? config.queueStaleness.staleWindowIngestFanoutT2Ms
  : config.queueStaleness.staleWindowIngestFanoutT1Ms
const staleGraceMs = config.queueStaleness.resumeGraceMs
const queueName = getQueueName(queueUrl)
const loopJitterMs = resolveJitterMs(process.env.INGEST_FANOUT_LOOP_JITTER_MS)
const messageJitterMs = resolveJitterMs(process.env.INGEST_FANOUT_MESSAGE_JITTER_MS, 500)
const providerJitterMs = resolveJitterMs(process.env.INGEST_FANOUT_PROVIDER_JITTER_MS, 200)
const backpressureThreshold = Math.max(
  1,
  toNumber(process.env.INGEST_FANOUT_BACKPRESSURE_THRESHOLD, batchSize * maxConcurrency * 4),
)
const healthEnabled = process.env.WORKER_HEALTH_ENABLED !== '0'
const healthPort = toNumber(process.env.HEALTH_PORT, 8080)
const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
let healthServer: { close: () => Promise<void> } | null = null
let ingestBackpressureActive = false
const activeExtenders = new Set<VisibilityTimeoutExtender>()
const shutdown = createShutdownHandler({
  name: 'ingest-fanout-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    await Promise.allSettled(Array.from(activeExtenders, (extender) => drainAndStop(extender)))
  },
})
const { signal: shutdownSignal } = shutdown

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

const buildTraceContext = (payload: {
  traceId?: string
  sweepRunId?: string
  requestedAt?: string
}) => ({
  trace_id: payload.traceId ?? null,
  sweep_run_id: payload.sweepRunId ?? null,
  requested_at: payload.requestedAt ?? null,
})

const reportBackpressure = (active: boolean, queueDepth: number): void => {
  recordCloudWatchMetric({
    name: 'worker_backpressure_active',
    value: active ? 1 : 0,
    unit: 'Count',
    dimensions: {
      worker: 'ingest-fanout',
      environment: config.envName || config.env,
    },
  })

  if (active) {
    recordCloudWatchMetric({
      name: 'worker_backpressure',
      value: 1,
      unit: 'Count',
      dimensions: {
        worker: 'ingest-fanout',
        reason: 'queue_depth',
        environment: config.envName || config.env,
      },
    })
  }

  if (active && !ingestBackpressureActive) {
    logger.warn('ingest_fanout_backpressure', {
      reason: 'queue_depth',
      queue_depth: queueDepth,
      threshold: backpressureThreshold,
    })
    emitOpsEvent({
      type: 'backpressure',
      component: 'ingest-fanout-worker',
      details: {
        reason: 'queue_depth',
        queue_depth: queueDepth,
        threshold: backpressureThreshold,
      },
    })
  }

  ingestBackpressureActive = active
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

const buildTaskKeysBySweepRun = (
  payload: IngestFanoutPayload,
): Map<string, B2bSweepTaskKey[]> => {
  const byRun = new Map<string, B2bSweepTaskKey[]>()
  const push = (runId: string | undefined, key: B2bSweepTaskKey) => {
    if (!runId) return
    const bucket = byRun.get(runId)
    if (bucket) {
      bucket.push(key)
    } else {
      byRun.set(runId, [key])
    }
  }

  if (isCorridorPayload(payload)) {
    for (const task of payload.providers) {
      const runId = task.sweepRunId ?? payload.sweepRunId
      for (const amountBucket of task.amountBuckets) {
        push(runId, {
          providerId: task.providerId,
          corridorId: payload.corridorId,
          amountBucket,
          payinMethod: task.payinMethod,
          payoutMethod: task.payoutMethod,
        })
      }
    }
    return byRun
  }

  for (const key of buildTaskKeys(payload)) {
    push(payload.sweepRunId, key)
  }
  return byRun
}

const markSweepTasksStale = async (
  sweepRepo: B2bSweepRepository,
  payload: IngestFanoutPayload,
  context: Record<string, unknown>,
) => {
  const byRun = buildTaskKeysBySweepRun(payload)
  for (const [runId, keys] of byRun.entries()) {
    await runSweepUpdate(runId, context, async () => {
      await sweepRepo.markTasksFinishedBatch(runId, keys, 'failed', 'stale_message')
      const summary = await sweepRepo.getRunSummary(runId)
      if (summary.remaining === 0) {
        const status = summary.failed > 0 ? 'failed' : 'completed'
        await sweepRepo.updateSweepRunStatus(runId, status, new Date())
      }
    })
  }
}

const resolveCorridorMethods = async (
  repo: ProviderCapabilityRepository,
  cache: Map<string, MethodSets | null>,
  task: IngestFanoutProviderTask,
  corridorId: string,
  traceContext?: Record<string, unknown>,
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
      ...(traceContext ?? {}),
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
      ...(traceContext ?? {}),
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
  const traceContext = buildTraceContext(payload)
  const provider = providerById.get(payload.providerId)
  if (!provider) {
    logger.warn('fanout_provider_missing', {
      provider_id: payload.providerId,
      ...traceContext,
    })
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
      signal: shutdownSignal,
      operation: 'ingest-fanout.provider.run',
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
        ...traceContext,
      })
    } catch (error) {
      logger.warn('fanout_volatility_refresh_failed', {
        provider_id: payload.providerId,
        error: error instanceof Error ? error.message : String(error),
        ...traceContext,
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
    ...traceContext,
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
  const traceContext = buildTraceContext(payload)
  const sweepRunIds = new Set<string>()
  const resolveSweepRunId = (task: IngestFanoutProviderTask) => task.sweepRunId ?? payload.sweepRunId
  const failedProviders: IngestFanoutProviderTask[] = []
  let anySuccess = false
  let taskIndex = 0

  const runTask = async (task: IngestFanoutProviderTask) => {
    if (providerJitterMs > 0) {
      await sleep(Math.floor(Math.random() * providerJitterMs))
    }
    const sweepRunId = resolveSweepRunId(task)
    if (sweepRunId) {
      sweepRunIds.add(sweepRunId)
    }
    try {
      const provider = providerById.get(task.providerId)
      if (!provider) {
        logger.warn('fanout_provider_missing', {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          ...traceContext,
        })
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
        traceContext,
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
          allowProbe: false,
          skipCatalog: false,
          refreshUnsupportedAfterDays: 0,
        },
      )
      if (!supportDecision.supported) {
        logger.info('fanout_capability_skipped', {
          provider_id: task.providerId,
          corridor_id: payload.corridorId,
          reason: supportDecision.reason,
          source: supportDecision.source,
          ...traceContext,
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
          signal: shutdownSignal,
          operation: 'ingest-fanout.provider.run_single',
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
        ...traceContext,
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
      while (!shutdown.isShuttingDown()) {
        const task = payload.providers[taskIndex]
        if (!task) return
        taskIndex += 1
        await runTask(task)
      }
    },
  )

  await Promise.all(workers)

  if (sweepRunIds.size > 0) {
    for (const sweepRunId of sweepRunIds) {
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
        const summaryContext = { ...traceContext }
        if (sweepRunId) {
          summaryContext.sweep_run_id = sweepRunId
        }
        logger.warn('b2b_sweep_summary_failed', {
          corridor_id: payload.corridorId,
          error: error instanceof Error ? error.message : String(error),
          ...summaryContext,
        })
      }
    }
  }

  if (anySuccess) {
    try {
      const volatilityService = new VolatilityService(pool)
      const updated = await volatilityService.refreshCacheForCorridors([payload.corridorId])
      logger.info('fanout_volatility_refreshed', {
        corridor_id: payload.corridorId,
        updated,
        ...traceContext,
      })
    } catch (error) {
      logger.warn('fanout_volatility_refresh_failed', {
        corridor_id: payload.corridorId,
        error: error instanceof Error ? error.message : String(error),
        ...traceContext,
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
          sweep_run_ids: sweepRunIds.size > 0 ? Array.from(sweepRunIds) : null,
          ...traceContext,
        })
      } catch (error) {
        logger.error('fanout_corridor_requeue_failed', {
          corridor_id: payload.corridorId,
          error: error instanceof Error ? error.message : String(error),
          ...traceContext,
        })
        return false
      }
    } else {
      logger.error('fanout_corridor_dropped', {
        corridor_id: payload.corridorId,
        failed_providers: failedProviders.length,
        attempt,
        sweep_run_ids: sweepRunIds.size > 0 ? Array.from(sweepRunIds) : null,
        ...traceContext,
      })

      // Send exhausted-retry messages to DLQ for controlled replay
      try {
        const dlqMessage: SqsMessage<typeof payload> = {
          messageId: `dropped-${payload.corridorId}-${Date.now()}`,
          receiptHandle: '',
          attributes: {},
          messageAttributes: {},
          raw: {} as import('@aws-sdk/client-sqs').Message,
          payload: {
            ...payload,
            providers: failedProviders,
            attempt,
          },
        }
        await sendToDLQ(queueUrl!, dlqMessage, new Error('retry_ceiling_exceeded'), {
          reason: 'fanout_corridor_retry_exhausted',
          queueClass: expectedQueueClass,
        })
        logger.info('fanout_corridor_dlq_sent', {
          corridor_id: payload.corridorId,
          failed_providers: failedProviders.length,
          ...traceContext,
        })
      } catch (dlqError) {
        logger.error('fanout_corridor_dlq_failed', {
          corridor_id: payload.corridorId,
          error: dlqError instanceof Error ? dlqError.message : String(dlqError),
          ...traceContext,
        })
      }
    }
  }

  await recordWorkerMetric('ingest-fanout-worker', 'message_processed', 1)
  logger.info('fanout_corridor_done', {
    corridor_id: payload.corridorId,
    providers: payload.providers.length,
    failed_providers: failedProviders.length,
    attempt: payload.attempt ?? 0,
    sweep_run_ids: sweepRunIds.size > 0 ? Array.from(sweepRunIds) : null,
    ...traceContext,
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
    const extender = createVisibilityTimeoutExtender(
      queueUrl!,
      message.receiptHandle,
      () => logger.debug('visibility_extended', { message_id: message.messageId }),
    )
    activeExtenders.add(extender)

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
      activeExtenders.delete(extender)
      await extender()
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
      ...buildTraceContext(payload),
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
  messages: Array<SqsMessage<unknown>>,
): Promise<string[]> => {
  const deleteHandles: string[] = []
  let index = 0

  const workers = Array.from({ length: Math.min(maxConcurrency, messages.length) }, async () => {
    while (!shutdown.isShuttingDown()) {
      const current = messages[index]
      if (!current) return
      index += 1

      const parsedMessage = unwrapEnvelopeOrLegacy<IngestFanoutPayload>(
        current.payload,
        expectedQueueClass,
      )
      if (!parsedMessage.ok) {
        const reason = parsedMessage.reason === 'queue_class_mismatch'
          ? 'queue_class_mismatch'
          : 'envelope_parse_error'
        logger.warn('fanout_item_invalid_envelope', {
          message_id: current.messageId,
          reason,
          detail: parsedMessage.message,
        })
        await sendToDLQ(queueUrl!, current, new Error(parsedMessage.message), {
          reason,
          queueClass: expectedQueueClass,
        })
        await recordWorkerMetric('ingest-fanout-worker', 'envelope_parse_error', 1, {
          queue_class: expectedQueueClass,
          queue_name: queueName,
          reason,
        })
        deleteHandles.push(current.receiptHandle)
        continue
      }

      const payload = parsedMessage.payload
      if (!validatePayload(payload)) {
        logger.warn('fanout_item_invalid', { message_id: current.messageId })
        await sendToDLQ(queueUrl!, current, new Error('invalid_ingest_fanout_payload'), {
          reason: 'envelope_parse_error',
          queueClass: expectedQueueClass,
        })
        await recordWorkerMetric('ingest-fanout-worker', 'envelope_parse_error', 1, {
          queue_class: expectedQueueClass,
          queue_name: queueName,
          reason: 'invalid_payload',
        })
        deleteHandles.push(current.receiptHandle)
        continue
      }

      const age = resolveMessageAgeMs({
        envelopeProducedAtMs: parsedMessage.producedAtMs,
        legacyTimestampIso: payload.requestedAt,
        sentTimestampMs: parseSentTimestampMs(current.attributes.SentTimestamp),
      })
      if (stalenessEnabled && isStale(age.ageMs, staleWindowMs, staleGraceMs)) {
        await markSweepTasksStale(sweepRepo, payload, {
          message_id: current.messageId,
          age_ms: age.ageMs,
          age_source: age.source,
          stale_window_ms: staleWindowMs,
        })
        await recordWorkerMetric('ingest-fanout-worker', 'stale_dropped', 1, {
          queue_class: expectedQueueClass,
          queue_name: queueName,
          reason: age.source,
        })
        logger.info('fanout_item_stale_dropped', {
          message_id: current.messageId,
          sweep_run_id: payload.sweepRunId ?? null,
          age_ms: age.ageMs,
          age_source: age.source,
          stale_window_ms: staleWindowMs,
        })
        deleteHandles.push(current.receiptHandle)
        continue
      }

      await applyJitter(logger, 'ingest_fanout_message', messageJitterMs)

      const runWithSpan = async () => startSpan(
        'ingest-fanout.message',
        async () => processMessage(pool, capabilityRepo, capabilityCache, sweepRepo, {
          ...current,
          payload,
        }),
        { attributes: { message_id: current.messageId } },
      )
      const processed = current.traceContext
        ? await otelContext.with(current.traceContext, runWithSpan)
        : await runWithSpan()
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
    queue_class: expectedQueueClass,
    batch_size: batchSize,
    concurrency: maxConcurrency,
    provider_concurrency: providerConcurrency,
    max_attempts: maxAttempts,
    staleness_enabled: stalenessEnabled,
    stale_window_ms: staleWindowMs,
    stale_grace_ms: staleGraceMs,
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
    if (!isLambdaRuntime && healthEnabled) {
      try {
        healthServer = await startHealthServer({
          port: healthPort,
          logger,
          loggerName: 'ingest-fanout-worker',
          enableDatabaseCheck: true,
          enableRedisCheck: true,
          enableSqsCheck: true,
          sqsQueueUrl: queueUrl,
        })
      } catch (error) {
        logger.warn('health_server_start_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    logger.info('fanout_worker_start', {
      batch_size: batchSize,
      concurrency: maxConcurrency,
      provider_concurrency: providerConcurrency,
      backpressure_threshold: backpressureThreshold,
      staleness_enabled: stalenessEnabled,
      stale_window_ms: staleWindowMs,
      stale_grace_ms: staleGraceMs,
    })
    while (!shutdown.isShuttingDown()) {
      await applyJitter(logger, 'ingest_fanout_loop', loopJitterMs)
      try {
        const queueStats = await getQueueStats(queueUrl)
        reportBackpressure(queueStats.total >= backpressureThreshold, queueStats.total)
      } catch (error) {
        logger.debug('ingest_fanout_backpressure_check_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
      const { messages, error: receiveError } = await receiveJsonMessages<unknown>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }
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
      const { failed } = await deleteMessages(queueUrl, deleteHandles)
      if (failed.length > 0) {
        logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
      }
    }
  } finally {
    await pool.end()
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (shutdown.isShuttingDown()) {
      await shutdown.shutdown('shutdown_requested')
    }
  }
}

export const runIngestFanoutWorkerLoop = async (): Promise<number> => {
  await runWorker()
  return 0
}

if (require.main === module) {
  runIngestFanoutWorkerLoop()
    .catch((error) => {
      logger.error('fanout_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
