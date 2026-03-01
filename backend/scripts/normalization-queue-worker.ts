/**
 * Normalization Queue Worker — SQS consumer for factor extraction.
 *
 * Receives raw quote payloads from the normalization queue, runs
 * FactorExtractionRouter.extract() for each, and persists the
 * normalized factors to the database.
 *
 * Queue mode: controlled by NORMALIZATION_QUEUE_MODE (queue/off).
 */

import { setTimeout as sleep } from 'timers/promises'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from '../shared/health-server'
import {
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  type SqsMessage,
} from '../shared/sqs'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { initErrorTracking } from '../shared/error-tracker'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { FactorExtractionRouter } from '../plane-b/src/normalization/router'
import { FeeExtractor } from '../plane-b/src/normalization/extractors/fee-extractor'
import { RateExtractor } from '../plane-b/src/normalization/extractors/rate-extractor'
import { DeliveryTimeExtractor } from '../plane-b/src/normalization/extractors/delivery-time-extractor'
import { PromotionalExtractor } from '../plane-b/src/normalization/extractors/promotional-extractor'

type NormalizationMessage = {
  providerId: string
  corridorId: string
  quoteId?: string
  rawPayload: Record<string, unknown>
  collectorType: string
  collectedAt: string
}

const logger = createLogger('script.normalization-queue-worker')

initTracing('normalization-queue-worker')
initErrorTracking('normalization-queue-worker')

const BATCH_SIZE = Number(process.env.NORMALIZATION_BATCH_SIZE) || 5
const IDLE_SLEEP_MS = Number(process.env.NORMALIZATION_IDLE_SLEEP_MS) || 2_000
const SHUTDOWN_TIMEOUT_MS = Number(process.env.NORMALIZATION_SHUTDOWN_TIMEOUT_MS) || 30_000

export async function runNormalizationWorkerLoop(): Promise<number> {
  const queueUrl = config.queues.normalization.url
  const queueMode = config.queues.normalization.mode

  if (!queueUrl || queueMode === 'off') {
    logger.info('normalization_worker_disabled', { queueUrl, queueMode })
    return 0
  }

  const pool = createPool(config.db.planeBUrl)

  // Build factor extraction router with all extractors
  const router = new FactorExtractionRouter()
  router.register(new FeeExtractor())
  router.register(new RateExtractor())
  router.register(new DeliveryTimeExtractor())
  router.register(new PromotionalExtractor())

  // Health server
  const healthPort = Number(process.env.HEALTH_PORT) || 8080
  const healthEnabled = process.env.WORKER_HEALTH_ENABLED !== '0'
  if (healthEnabled && !config.runtime.isLambda) {
    await startHealthServer({ port: healthPort, pool })
  }

  const shutdown = createShutdownHandler({
    name: 'normalization-queue-worker',
    logger,
    timeoutMs: SHUTDOWN_TIMEOUT_MS,
    exitOnSignal: false,
  })

  logger.info('normalization_worker_starting', { queueUrl, batchSize: BATCH_SIZE })

  while (!shutdown.isShuttingDown()) {
    const { messages, error } = await receiveJsonMessages<NormalizationMessage>(queueUrl, BATCH_SIZE)

    if (error) {
      logger.error('normalization_receive_error', { error: error.message })
      await sleep(IDLE_SLEEP_MS)
      continue
    }

    if (messages.length === 0) {
      await sleep(IDLE_SLEEP_MS)
      continue
    }

    const toDelete: string[] = []

    for (const msg of messages) {
      if (shutdown.isShuttingDown()) break

      try {
        await processNormalizationMessage(pool, router, msg)
        toDelete.push(msg.receiptHandle)
        recordWorkerMetric('normalization-worker', 'message_processed').catch(() => {})
      } catch (err) {
        logger.error('normalization_process_error', {
          error: err instanceof Error ? err.message : String(err),
          providerId: msg.payload?.providerId,
        })
        await sendToDLQ(queueUrl, msg, err instanceof Error ? err : new Error(String(err)))
        toDelete.push(msg.receiptHandle)
        recordWorkerMetric('normalization-worker', 'message_failed').catch(() => {})
      }
    }

    if (toDelete.length > 0) {
      await deleteMessages(queueUrl, toDelete)
    }
  }

  await pool.end()
  logger.info('normalization_worker_stopped')
  return 0
}

async function processNormalizationMessage(
  pool: import('pg').Pool,
  router: FactorExtractionRouter,
  msg: SqsMessage<NormalizationMessage>,
): Promise<void> {
  const payload = msg.payload
  if (!payload?.providerId || !payload?.corridorId || !payload?.rawPayload) {
    logger.warn('normalization_invalid_message', { messageId: msg.messageId })
    return
  }

  const result = await router.extract({
    providerId: payload.providerId,
    corridorId: payload.corridorId,
    collectorType: payload.collectorType,
    rawPayload: payload.rawPayload,
  })

  if (result.factors.length === 0) {
    logger.debug('normalization_no_factors', {
      providerId: payload.providerId,
      corridorId: payload.corridorId,
    })
    return
  }

  // Persist extracted factors
  for (const factor of result.factors) {
    await pool.query(
      `INSERT INTO silver.factor
       (provider_id, corridor_id, factor_type, raw_value, normalized_value, unit, confidence, source, extractor_id, metadata, collected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [
        payload.providerId,
        payload.corridorId,
        factor.factorType,
        String(factor.rawValue),
        factor.normalizedValue,
        factor.unit,
        factor.confidence,
        factor.source,
        factor.extractorId,
        JSON.stringify(factor.metadata ?? {}),
        payload.collectedAt,
      ],
    )
  }

  logger.debug('normalization_factors_persisted', {
    providerId: payload.providerId,
    corridorId: payload.corridorId,
    factorCount: result.factors.length,
  })
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runNormalizationWorkerLoop()
    .then((code) => process.exit(code))
    .catch((err) => {
      logger.error('normalization_worker_fatal', {
        error: err instanceof Error ? err.message : String(err),
      })
      process.exit(1)
    })
}
