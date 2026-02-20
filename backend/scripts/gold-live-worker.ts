/**
 * Gold Live Worker - near real-time Gold updates driven by SQS.
 *
 * Consumes corridor update messages and refreshes:
 * - gold_export.corridor_rates (publisher output)
 * - gold_export.cdp_daily (indices output)
 *
 * Features:
 * - Uses planeBUrl for Silver reads, planeCUrl for Gold writes
 * - Message debouncing to reduce write amplification
 * - Partial failure handling (publisher vs indices)
 * - SLO tracking with P50/P95 metrics
 * - Graceful shutdown
 */

import { setTimeout as sleep } from 'timers/promises'
import type { Pool } from 'pg'
import { context as otelContext, trace, type Context } from '@opentelemetry/api'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { normalizeCorridorIds } from '../shared/corridor'
import { startHealthServer } from '../shared/health-server'
import {
  createVisibilityTimeoutExtender,
  drainAndStop,
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  type VisibilityTimeoutExtender,
} from '../shared/sqs'
import { isStale, resolveMessageAgeMs, unwrapEnvelopeOrLegacy } from '../shared/queue-staleness'
import { withWorkerRetry } from '../shared/worker-retry'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { recordSLOValue } from '../shared/slo-tracker'
import { GoldPublisherLive } from '../plane-c/src/services/gold-publisher-live'
import { upsertGoldIndicesLive } from './gold-indices-live'
import { initErrorTracking } from '../shared/error-tracker'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing, startSpan } from '../shared/tracing'
import { applyJitter, resolveJitterMs } from '../shared/worker-jitter'

const logger = createLogger('script.gold-live-worker')
const queueUrl = config.queues.goldLive.url
const queueMode = config.queues.goldLive.mode

initTracing('gold-live-worker')
initErrorTracking('gold-live-worker')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getQueueName = (queueUrl: string | null) => {
  if (!queueUrl) return 'gold-live'
  const parts = queueUrl.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'gold-live'
}

const parseSentTimestampMs = (value: string | undefined): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const batchSize = toNumber(process.env.GOLD_LIVE_QUEUE_BATCH_SIZE, 10)
const idleSleepMs = toNumber(process.env.GOLD_LIVE_QUEUE_IDLE_SLEEP_MS, 500)
const shutdownTimeoutMs = toNumber(process.env.GOLD_LIVE_QUEUE_SHUTDOWN_TIMEOUT_MS, 30000)
const debounceWindowMs = toNumber(process.env.GOLD_LIVE_DEBOUNCE_WINDOW_MS, 2000)
const loopJitterMs = resolveJitterMs(process.env.GOLD_LIVE_QUEUE_LOOP_JITTER_MS, 0)
const messageJitterMs = resolveJitterMs(process.env.GOLD_LIVE_QUEUE_MESSAGE_JITTER_MS, 0)
const healthEnabled = process.env.WORKER_HEALTH_ENABLED !== '0'
const healthPort = toNumber(process.env.HEALTH_PORT, 8080)
const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

let healthServer: { close: () => Promise<void> } | null = null
const activeExtenders = new Set<VisibilityTimeoutExtender>()
const shutdown = createShutdownHandler({
  name: 'gold-live-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    await Promise.allSettled(Array.from(activeExtenders, (extender) => drainAndStop(extender)))
  },
})
const { signal: shutdownSignal } = shutdown

export type GoldLiveMessage = {
  corridorId: string
  collectedAt: string
  amountBucket?: number
  payin?: string
  payout?: string
  providerId?: string
}

type _ParsedMessage = {
  messageId: string
  receiptHandle: string
  corridorId: string
  collectedAt: Date
  lagSeconds: number
}

type CorridorBatch = {
  corridorIds: string[]
  receiptHandles: string[]
  lagSamples: number[]
  traceContext?: Context
  traceIdSample: string[]
}

const validatePayload = (payload: GoldLiveMessage | null): payload is GoldLiveMessage => {
  if (!payload) return false
  if (!payload.corridorId || !payload.collectedAt) return false
  return true
}

const parseLagSeconds = (collectedAt: string): number | null => {
  const parsed = new Date(collectedAt)
  if (!Number.isFinite(parsed.getTime())) return null
  return Math.max(0, (Date.now() - parsed.getTime()) / 1000)
}

const computeLagPercentiles = (samples: number[]): { p50: number; p95: number; max: number } => {
  if (samples.length === 0) {
    return { p50: 0, p95: 0, max: 0 }
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const p50Index = Math.floor(sorted.length * 0.5)
  const p95Index = Math.floor(sorted.length * 0.95)
  return {
    p50: sorted[p50Index] ?? 0,
    p95: sorted[p95Index] ?? sorted[sorted.length - 1] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  }
}

class CorridorDebouncer {
  private pending = new Map<
    string,
    { receiptHandles: string[]; lagSamples: number[]; firstSeen: number; traceContext?: Context; traceIds: string[] }
  >()
  private readonly windowMs: number

  constructor(windowMs: number) {
    this.windowMs = windowMs
  }

  add(
    corridorId: string,
    receiptHandle: string,
    lagSeconds: number,
    traceContext?: Context,
    traceId?: string,
  ): void {
    const existing = this.pending.get(corridorId)
    if (existing) {
      existing.receiptHandles.push(receiptHandle)
      existing.lagSamples.push(lagSeconds)
      if (!existing.traceContext && traceContext) {
        existing.traceContext = traceContext
      }
      if (traceId && existing.traceIds.length < 3 && !existing.traceIds.includes(traceId)) {
        existing.traceIds.push(traceId)
      }
    } else {
      this.pending.set(corridorId, {
        receiptHandles: [receiptHandle],
        lagSamples: [lagSeconds],
        firstSeen: Date.now(),
        traceContext,
        traceIds: traceId ? [traceId] : [],
      })
    }
  }

  flush(force = false): CorridorBatch {
    const now = Date.now()
    const corridorIds: string[] = []
    const receiptHandles: string[] = []
    const lagSamples: number[] = []
    let traceContext: Context | undefined
    const traceIdSample: string[] = []

    for (const [corridorId, data] of this.pending.entries()) {
      if (force || now - data.firstSeen >= this.windowMs) {
        corridorIds.push(corridorId)
        receiptHandles.push(...data.receiptHandles)
        lagSamples.push(...data.lagSamples)
        if (!traceContext && data.traceContext) {
          traceContext = data.traceContext
        }
        for (const traceId of data.traceIds) {
          if (traceIdSample.length >= 3) break
          if (!traceIdSample.includes(traceId)) {
            traceIdSample.push(traceId)
          }
        }
        this.pending.delete(corridorId)
      }
    }

    return { corridorIds, receiptHandles, lagSamples, traceContext, traceIdSample }
  }

  get size(): number {
    return this.pending.size
  }
}

const processBatch = async (
  batch: CorridorBatch,
  silverPool: Pool,
  goldPool: Pool,
  publisher: GoldPublisherLive,
): Promise<{ success: boolean; publisherSuccess: boolean; indicesSuccess: boolean }> => {
  const { corridorIds, lagSamples } = batch
  const uniqueCorridors = normalizeCorridorIds(corridorIds)

  if (uniqueCorridors.length === 0) {
    return { success: true, publisherSuccess: true, indicesSuccess: true }
  }

  let publisherSuccess = false
  let indicesSuccess = false

  try {
    await withWorkerRetry(() => publisher.processCorridors(uniqueCorridors), {
      maxRetries: 2,
      initialDelayMs: 250,
      maxDelayMs: 2000,
      signal: shutdownSignal,
      operation: 'gold-live.publisher.process_corridors',
    })
    publisherSuccess = true
  } catch (error) {
    logger.error('gold_live_publisher_failed', {
      error: error instanceof Error ? error.message : String(error),
      corridor_count: uniqueCorridors.length,
    })
  }

  try {
    await withWorkerRetry(
      () => upsertGoldIndicesLive(silverPool, goldPool, { corridorIds: uniqueCorridors }),
      {
        maxRetries: 2,
        initialDelayMs: 250,
        maxDelayMs: 2000,
        signal: shutdownSignal,
        operation: 'gold-live.indices.upsert',
      },
    )
    indicesSuccess = true
  } catch (error) {
    logger.error('gold_live_indices_failed', {
      error: error instanceof Error ? error.message : String(error),
      corridor_count: uniqueCorridors.length,
    })
  }

  if (lagSamples.length > 0) {
    const { p50, p95, max } = computeLagPercentiles(lagSamples)
    recordSLOValue('gold_export_lag', 'live_p50', p50)
    recordSLOValue('gold_export_lag', 'live_p95', p95)
    recordSLOValue('gold_export_lag', 'live_max', max)
  }

  return {
    success: publisherSuccess && indicesSuccess,
    publisherSuccess,
    indicesSuccess,
  }
}

export const runGoldLiveWorker = async (): Promise<number> => {
  if (queueMode !== 'queue') {
    logger.warn('gold_live_worker_disabled', { mode: queueMode })
    return 0
  }

  if (!queueUrl) {
    logger.warn('gold_live_worker_disabled', { reason: 'missing_queue_url' })
    return 0
  }

  const silverPool = createPool(config.db.planeBUrl)
  const goldPool = createPool(config.db.planeCUrl)
  const publisher = new GoldPublisherLive(silverPool, goldPool)
  const debouncer = new CorridorDebouncer(debounceWindowMs)
  const stalenessEnabled = config.queueStaleness.enforcementEnabled
  const staleWindowMs = config.queueStaleness.staleWindowGoldLiveMs
  const staleGraceMs = config.queueStaleness.resumeGraceMs
  const queueName = getQueueName(queueUrl)

  logger.info('gold_live_worker_start', {
    batch_size: batchSize,
    debounce_window_ms: debounceWindowMs,
    silver_url: config.db.planeBUrl ? 'configured' : 'missing',
    gold_url: config.db.planeCUrl ? 'configured' : 'missing',
  })

  try {
    if (!isLambdaRuntime && healthEnabled) {
      try {
        healthServer = await startHealthServer({
          port: healthPort,
          logger,
          loggerName: 'gold-live-worker',
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
    while (!shutdown.isShuttingDown()) {
      await applyJitter(logger, 'gold_live_loop', loopJitterMs)
      const { messages, error: receiveError } = await receiveJsonMessages<unknown>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }

      const deleteHandles: string[] = []
      const stopExtenders: VisibilityTimeoutExtender[] = []

      for (const message of messages) {
        await applyJitter(logger, 'gold_live_message', messageJitterMs)
        const parsedMessage = unwrapEnvelopeOrLegacy<GoldLiveMessage>(message.payload, 'gold-live')
        if (!parsedMessage.ok) {
          const reason = parsedMessage.reason === 'queue_class_mismatch'
            ? 'queue_class_mismatch'
            : 'envelope_parse_error'
          logger.warn('gold_live_message_invalid_envelope', {
            message_id: message.messageId,
            reason,
            detail: parsedMessage.message,
          })
          await sendToDLQ(queueUrl, message, new Error(parsedMessage.message), {
            reason,
            queueClass: 'gold-live',
          })
          await recordWorkerMetric('gold-live-worker', 'envelope_parse_error', 1, {
            queue_class: 'gold-live',
            queue_name: queueName,
            reason,
          })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const payload = parsedMessage.payload
        if (!validatePayload(payload)) {
          logger.warn('gold_live_message_invalid', { message_id: message.messageId })
          await sendToDLQ(queueUrl, message, new Error('invalid_gold_live_payload'), {
            reason: 'envelope_parse_error',
            queueClass: 'gold-live',
          })
          await recordWorkerMetric('gold-live-worker', 'envelope_parse_error', 1, {
            queue_class: 'gold-live',
            queue_name: queueName,
            reason: 'invalid_payload',
          })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const age = resolveMessageAgeMs({
          envelopeProducedAtMs: parsedMessage.producedAtMs,
          legacyTimestampIso: payload.collectedAt,
          sentTimestampMs: parseSentTimestampMs(message.attributes.SentTimestamp),
        })
        if (stalenessEnabled && isStale(age.ageMs, staleWindowMs, staleGraceMs)) {
          await recordWorkerMetric('gold-live-worker', 'stale_dropped', 1, {
            queue_class: 'gold-live',
            queue_name: queueName,
            reason: age.source,
          })
          logger.info('gold_live_message_stale_dropped', {
            message_id: message.messageId,
            corridor_id: payload.corridorId,
            age_ms: age.ageMs,
            age_source: age.source,
            stale_window_ms: staleWindowMs,
          })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const lagSeconds = parseLagSeconds(payload.collectedAt)
        if (lagSeconds === null) {
          logger.warn('gold_live_message_invalid_timestamp', {
            message_id: message.messageId,
            collected_at: payload.collectedAt,
          })
          await sendToDLQ(queueUrl, message, new Error('invalid_collected_at_timestamp'), {
            reason: 'envelope_parse_error',
            queueClass: 'gold-live',
            ageMs: age.ageMs,
          })
          await recordWorkerMetric('gold-live-worker', 'envelope_parse_error', 1, {
            queue_class: 'gold-live',
            queue_name: queueName,
            reason: 'invalid_timestamp',
          })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const extender = createVisibilityTimeoutExtender(
          queueUrl,
          message.receiptHandle,
          () => logger.debug('visibility_extended', { message_id: message.messageId }),
        )
        stopExtenders.push(extender)
        activeExtenders.add(extender)

        const traceContext = message.traceContext
        const spanContext = traceContext ? trace.getSpanContext(traceContext) : undefined
        const traceId = spanContext?.traceId
        debouncer.add(payload.corridorId, message.receiptHandle, lagSeconds, traceContext, traceId)
      }

      if (deleteHandles.length > 0) {
        const { failed } = await deleteMessages(queueUrl, deleteHandles)
        if (failed.length > 0) {
          logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
        }
      }

      const shouldFlush = messages.length === 0 || debouncer.size >= batchSize * 2
      const batch = debouncer.flush(shouldFlush)

      if (batch.corridorIds.length > 0) {
        const batchContext = batch.traceContext ?? otelContext.active()
        const result = await otelContext.with(batchContext, () =>
          startSpan('gold-live.batch', async (span) => {
            if (typeof span.setAttributes === 'function') {
              span.setAttributes({
                'corridor.count': batch.corridorIds.length,
                'message.count': batch.receiptHandles.length,
              })
            }
            return await processBatch(batch, silverPool, goldPool, publisher)
          }),
        )

        for (const extender of stopExtenders) {
          activeExtenders.delete(extender)
          await extender()
        }

        if (result.success) {
          const { failed } = await deleteMessages(queueUrl, batch.receiptHandles)
          if (failed.length > 0) {
            logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
          }
          await recordWorkerMetric('gold-live-worker', 'message_processed', batch.receiptHandles.length)
          logger.info('gold_live_corridors_updated', {
            corridor_count: batch.corridorIds.length,
            trace_id_sample: batch.traceIdSample.length > 0 ? batch.traceIdSample : null,
          })
        } else {
          await recordWorkerMetric('gold-live-worker', 'message_failed', batch.receiptHandles.length)

          const err = new Error(
            result.publisherSuccess
              ? 'Indices update failed'
              : result.indicesSuccess
                ? 'Publisher update failed'
                : 'Both publisher and indices updates failed',
          )

          for (const message of messages.filter((m) => batch.receiptHandles.includes(m.receiptHandle))) {
            await sendToDLQ(queueUrl, message, err, {
              reason: 'processing_failure',
              queueClass: 'gold-live',
            })
            await recordWorkerMetric('gold-live-worker', 'dlq_sent', 1)
          }
          const { failed } = await deleteMessages(queueUrl, batch.receiptHandles)
          if (failed.length > 0) {
            logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
          }

          logger.warn('gold_live_batch_failed', {
            publisher_success: result.publisherSuccess,
            indices_success: result.indicesSuccess,
            corridor_count: batch.corridorIds.length,
            dlq_count: batch.receiptHandles.length,
            trace_id_sample: batch.traceIdSample.length > 0 ? batch.traceIdSample : null,
          })
        }
      } else {
        for (const extender of stopExtenders) {
          activeExtenders.delete(extender)
          await extender()
        }
      }

      if (messages.length === 0) {
        await sleep(idleSleepMs)
      }
    }
  } finally {
    const finalBatch = debouncer.flush(true)
    if (finalBatch.corridorIds.length > 0) {
      logger.info('gold_live_shutdown_flush', {
        corridor_count: finalBatch.corridorIds.length,
        message_count: finalBatch.receiptHandles.length,
      })
      try {
        await processBatch(finalBatch, silverPool, goldPool, publisher)
        const { failed } = await deleteMessages(queueUrl, finalBatch.receiptHandles)
        if (failed.length > 0) {
          logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
        }
      } catch (error) {
        logger.error('gold_live_shutdown_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    await silverPool.end()
    await goldPool.end()
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

  return 0
}

if (require.main === module) {
  runGoldLiveWorker()
    .catch((error) => {
      logger.error('gold_live_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
