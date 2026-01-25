import type { Pool } from 'pg'

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireCorridorId } from '../../../shared/corridor'
import { getTracer } from '../../../shared/tracing'
import { sendJsonMessage } from '../../../shared/sqs'
import type { NormalizedQuote } from '../normalize/quote-normalizer'
import { detectAnomaly } from '../signals/anomaly-detector'
import {
  CircuitBreakerRepository,
  CorridorRepository,
  IngestionRunRepository,
  OpsAlertRepository,
  ProviderCapabilityRepository,
  ProviderRepository,
  QuoteRecordRepository,
  QuoteAttemptRepository,
  RightsMatrixRepository,
} from '../repositories'
import { StoplistService, getBlockTypeFromReason } from '../services'
import { recordCollection, updateCircuitBreakerState } from './collector-metrics'

const logger = createLogger('plane-b.collectors.base')
const tracer = getTracer('plane-b.collectors')
const opsAlertsQueueUrl = config.queues.opsAlerts.url
const opsAlertsQueueMode = config.queues.opsAlerts.mode
let notifiedOpsAlertsQueueMisconfig = false
const goldLiveQueueUrl = config.queues.goldLive.url
const goldLiveQueueMode = config.queues.goldLive.mode
let notifiedGoldLiveQueueMisconfig = false

type OpsAlertsQueueMessage = {
  alertId: string
  providerId: string
  corridorId: string
  amountBucket: number | null
  httpStatus: number | null
  blockReason: string | null
  bronzeObjectKey: string | null
  requestId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

type GoldLiveQueueMessage = {
  corridorId: string
  collectedAt: string
  amountBucket: number
  payin: string
  payout: string
  providerId: string
}

const enqueueOpsAlert = async (payload: OpsAlertsQueueMessage): Promise<boolean> => {
  if (!opsAlertsQueueUrl) {
    if (!notifiedOpsAlertsQueueMisconfig && opsAlertsQueueMode !== 'off') {
      notifiedOpsAlertsQueueMisconfig = true
      logger.warn('ops_alert_queue_disabled', { reason: 'missing_queue_url' })
    }
    return false
  }

  try {
    await sendJsonMessage(opsAlertsQueueUrl, payload)
    return true
  } catch (error) {
    logger.warn('ops_alert_queue_enqueue_failed', {
      alert_id: payload.alertId,
      provider_id: payload.providerId,
      corridor_id: payload.corridorId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

const enqueueGoldLiveUpdate = async (
  payload: GoldLiveQueueMessage,
  collectorType?: string,
): Promise<boolean> => {
  if (!collectorType || !collectorType.startsWith('b2b_')) {
    return false
  }
  if (goldLiveQueueMode !== 'queue') {
    return false
  }
  if (!goldLiveQueueUrl) {
    if (!notifiedGoldLiveQueueMisconfig) {
      notifiedGoldLiveQueueMisconfig = true
      logger.warn('gold_live_queue_disabled', { reason: 'missing_queue_url' })
    }
    return false
  }

  try {
    await sendJsonMessage(goldLiveQueueUrl, payload)
    return true
  } catch (error) {
    logger.warn('gold_live_queue_enqueue_failed', {
      corridor_id: payload.corridorId,
      provider_id: payload.providerId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export type CollectorResumeStatus = {
  canCollect: boolean
  reason: string
}

export type AttemptInput = {
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  success: boolean
  errorType?: string | null
  httpStatus?: number | null
  errorMessage?: string | null
  bronzeObjectKey?: string | null
  requestFingerprint: string
}

export type OpsAlertInput = {
  corridorId: string
  amountBucket: number
  payinMethod: string
  payoutMethod: string
  httpStatus: number | null
  blockReason: string | null
  bronzeObjectKey: string | null
  collectorType: string
  traceId: string
  requestFingerprint: string
}

type AnomalyDetectionInput = {
  pool: Pool
  providerId: string
  corridorId: string
  currentRate: number
  collectorType: string
}

const isTier1Collector = (collectorType: string) =>
  collectorType === 'b2b_tier_1' || collectorType === 'b2b_tier_1_alpha'

export const ensureProvider = async (
  pool: Pool,
  providerId: string,
  displayName: string,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('ensure_provider_invalid_id', { provider_id: providerId })
    throw new Error('Invalid provider ID')
  }

  try {
    const repo = new ProviderRepository(pool)
    await repo.upsertProvider({ providerId, displayName })
    logger.debug('provider_ensured', { provider_id: providerId, display_name: displayName })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('ensure_provider_failed', {
      provider_id: providerId,
      display_name: displayName,
      error: errorMessage,
      stack: errorStack,
    })
    throw error
  }
}

export const loadObservedCorridors = async (pool: Pool, providerId: string) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('load_observed_corridors_invalid_provider_id', { provider_id: providerId })
    return []
  }

  try {
    const repo = new ProviderCapabilityRepository(pool)
    const rows = await repo.loadObservedCorridors(providerId)
    const corridors = rows.map(row => row.corridor_id).filter(Boolean)
    logger.debug('observed_corridors_loaded', {
      provider_id: providerId,
      count: corridors.length,
    })
    return corridors
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('load_observed_corridors_failed', {
      provider_id: providerId,
      error: errorMessage,
      stack: errorStack,
    })
    return []
  }
}

export const loadUnsupportedCorridors = async (pool: Pool, providerId: string): Promise<Set<string>> => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('load_unsupported_corridors_invalid_provider_id', { provider_id: providerId })
    return new Set()
  }

  try {
    const repo = new ProviderCapabilityRepository(pool)
    const rows = await repo.loadUnsupportedCorridors(providerId)
    const corridors = new Set(rows.map(row => row.corridor_id).filter((id): id is string => Boolean(id)))
    logger.debug('unsupported_corridors_loaded', {
      provider_id: providerId,
      count: corridors.size,
    })
    return corridors
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('load_unsupported_corridors_failed', {
      provider_id: providerId,
      error: errorMessage,
      stack: errorStack,
    })
    return new Set()
  }
}

export const ensureCorridor = async (pool: Pool, corridorId: string) => {
  if (!corridorId || typeof corridorId !== 'string' || corridorId.trim().length === 0) {
    logger.warn('ensure_corridor_invalid_id', { corridor_id: corridorId })
    throw new Error('Invalid corridor ID')
  }

  try {
    const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(corridorId)
    const repo = new CorridorRepository(pool)
    await repo.insertIfMissing({
      corridorId,
      sourceCountry,
      destCountry,
      sourceCurrency,
      destCurrency,
    })
    logger.debug('corridor_ensured', { corridor_id: corridorId })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('ensure_corridor_failed', {
      corridor_id: corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    throw error
  }
}

export const insertAttempt = async (
  pool: Pool,
  providerId: string,
  input: AttemptInput,
  durationSeconds?: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('insert_attempt_invalid_provider_id', { provider_id: providerId })
    return
  }

  if (!input.corridorId || typeof input.corridorId !== 'string' || input.corridorId.trim().length === 0) {
    logger.warn('insert_attempt_invalid_corridor_id', { corridor_id: input.corridorId })
    return
  }

  try {
    if (durationSeconds !== undefined) {
      recordCollection(
        providerId,
        input.corridorId,
        input.success,
        durationSeconds,
        input.success ? undefined : (input.errorType ?? input.errorMessage ?? undefined),
      )
    }
  } catch {
    // Silently ignore metrics errors
  }

  try {
    const repo = new QuoteAttemptRepository(pool)
    await repo.insertAttempt({
      providerId,
      corridorId: input.corridorId,
      amountBucket: input.amountBucket,
      payinMethod: input.payinMethod,
      payoutMethod: input.payoutMethod,
      success: input.success,
      errorType: input.errorType ?? null,
      httpStatus: input.httpStatus ?? null,
      errorMessage: input.errorMessage ?? null,
      bronzeObjectKey: input.bronzeObjectKey ?? null,
      requestFingerprint: input.requestFingerprint,
    })
    logger.debug('attempt_inserted', {
      provider_id: providerId,
      corridor_id: input.corridorId,
      success: input.success,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('insert_attempt_failed', {
      provider_id: providerId,
      corridor_id: input.corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const insertOpsAlert = async (
  pool: Pool,
  providerId: string,
  input: OpsAlertInput,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('insert_ops_alert_invalid_provider_id', { provider_id: providerId })
    return null
  }

  if (!input.corridorId || typeof input.corridorId !== 'string' || input.corridorId.trim().length === 0) {
    logger.warn('insert_ops_alert_invalid_corridor_id', { corridor_id: input.corridorId })
    return null
  }

  try {
    const payload = {
      payin_method: input.payinMethod,
      payout_method: input.payoutMethod,
      collector_type: input.collectorType,
      trace_id: input.traceId,
      request_fingerprint: input.requestFingerprint,
    }
    const repo = new OpsAlertRepository(pool)
    const alertId = await repo.insertAlert({
      providerId,
      corridorId: input.corridorId,
      amountBucket: input.amountBucket,
      httpStatus: input.httpStatus,
      blockReason: input.blockReason,
      bronzeObjectKey: input.bronzeObjectKey,
      requestId: input.traceId,
      payload,
    })
    logger.debug('ops_alert_inserted', {
      provider_id: providerId,
      corridor_id: input.corridorId,
      alert_id: alertId,
      http_status: input.httpStatus,
    })

    if (alertId && opsAlertsQueueMode !== 'off') {
      const enqueued = await enqueueOpsAlert({
        alertId,
        providerId,
        corridorId: input.corridorId,
        amountBucket: input.amountBucket,
        httpStatus: input.httpStatus,
        blockReason: input.blockReason,
        bronzeObjectKey: input.bronzeObjectKey,
        requestId: input.traceId,
        payload,
        createdAt: new Date().toISOString(),
      })
      logger.debug('ops_alert_enqueued', {
        alert_id: alertId,
        provider_id: providerId,
        corridor_id: input.corridorId,
        enqueued,
        mode: opsAlertsQueueMode,
      })
    }

    if (input.blockReason) {
      await handleBlockDetectionAutoStop(pool, providerId, input.corridorId, input.blockReason, input.httpStatus)
    }

    return alertId
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('insert_ops_alert_failed', {
      provider_id: providerId,
      corridor_id: input.corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
    return null
  }
}

export const handleBlockDetectionAutoStop = async (
  pool: Pool,
  providerId: string,
  corridorId: string,
  blockReason: string | null,
  httpStatus: number | null,
) => {
  if (!blockReason) {
    return
  }

  try {
    const blockType = getBlockTypeFromReason(blockReason, httpStatus)
    const stoplistService = new StoplistService(pool)
    await stoplistService.handleBlockDetection(providerId, corridorId, blockType)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('auto_stop_on_block_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      block_reason: blockReason,
      http_status: httpStatus,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const markCorridorUnsupported = async (
  pool: Pool,
  providerId: string,
  corridorId: string,
  source: string,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('mark_corridor_unsupported_invalid_provider_id', { provider_id: providerId })
    return
  }

  if (!corridorId || typeof corridorId !== 'string' || corridorId.trim().length === 0) {
    logger.warn('mark_corridor_unsupported_invalid_corridor_id', { corridor_id: corridorId })
    return
  }

  try {
    const repo = new ProviderCapabilityRepository(pool)
    await repo.markCorridorUnsupported(providerId, corridorId, source)
    logger.debug('corridor_marked_unsupported', {
      provider_id: providerId,
      corridor_id: corridorId,
      source,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('mark_corridor_unsupported_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      source,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const persistNormalizedQuote = async (
  pool: Pool,
  normalized: NormalizedQuote,
  collectorType?: string,
) => {
  if (!normalized.provider_id || typeof normalized.provider_id !== 'string' || normalized.provider_id.trim().length === 0) {
    logger.warn('persist_quote_invalid_provider_id', { provider_id: normalized.provider_id })
    return
  }

  if (!normalized.corridor_id || typeof normalized.corridor_id !== 'string' || normalized.corridor_id.trim().length === 0) {
    logger.warn('persist_quote_invalid_corridor_id', { corridor_id: normalized.corridor_id })
    return
  }

  const span = tracer.startSpan('collector.persist_quote')
  span.setAttributes({
    'provider.id': normalized.provider_id,
    'corridor.id': normalized.corridor_id,
    'amount.bucket': normalized.amount_bucket,
  })

  let qualityFlags: string
  try {
    qualityFlags = JSON.stringify(normalized.quality_flags)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.warn('quality_flags_serialization_failed', {
      provider_id: normalized.provider_id,
      corridor_id: normalized.corridor_id,
      error: errorMessage,
    })
    qualityFlags = '[]' // Fallback to empty array
  }

  try {
    const quoteRepo = new QuoteRecordRepository(pool)
    await quoteRepo.insertQuoteAndUpsertLatest({
    quote: {
      providerId: normalized.provider_id,
      corridorId: normalized.corridor_id,
      amountBucket: normalized.amount_bucket,
      payin: normalized.payin,
      payout: normalized.payout,
      sendAmount: normalized.send_amount,
      feeAmount: normalized.fee_amount,
      promotionalFeeAmount: normalized.promotional_fee_amount,
      feeCurrency: normalized.fee_currency ?? null,
      totalDebitAmount: normalized.total_debit_amount,
      receiveAmount: normalized.receive_amount,
      impliedFxRate: normalized.implied_fx_rate,
      promotionalRate: normalized.promotional_rate,
      baseRate: normalized.base_rate,
      promotionalCapAmount: normalized.promotional_cap_amount,
      deliveryTimeMinMinutes: normalized.delivery_time_min_minutes ?? null,
      deliveryTimeMaxMinutes: normalized.delivery_time_max_minutes ?? null,
      status: 'ok',
      errorCode: null,
      errorMessage: null,
      collectedAt: normalized.collected_at,
      ingestedAt: normalized.ingested_at,
      ingestionRunId: normalized.ingestion_run_id,
      bronzeObjectKey: normalized.bronze_object_key,
      parserVersion: normalized.parser_version ?? null,
      qualityFlags,
    },
    latest: {
      corridorId: normalized.corridor_id,
      amountBucket: normalized.amount_bucket,
      payin: normalized.payin,
      payout: normalized.payout,
      providerId: normalized.provider_id,
      collectedAt: normalized.collected_at,
      sendAmount: normalized.send_amount,
      feeAmount: normalized.fee_amount,
      promotionalFeeAmount: normalized.promotional_fee_amount,
      totalDebitAmount: normalized.total_debit_amount,
      receiveAmount: normalized.receive_amount,
      impliedFxRate: normalized.implied_fx_rate,
      promotionalRate: normalized.promotional_rate,
      baseRate: normalized.base_rate,
      promotionalCapAmount: normalized.promotional_cap_amount,
      deliveryTimeMinMinutes: normalized.delivery_time_min_minutes ?? null,
      deliveryTimeMaxMinutes: normalized.delivery_time_max_minutes ?? null,
      status: 'ok',
      qualityFlags,
    },
    })
    logger.debug('quote_persisted', {
      provider_id: normalized.provider_id,
      corridor_id: normalized.corridor_id,
      amount_bucket: normalized.amount_bucket,
    })
    if (normalized.amount_bucket === 500) {
      await enqueueGoldLiveUpdate(
        {
          corridorId: normalized.corridor_id,
          collectedAt: normalized.collected_at,
          amountBucket: normalized.amount_bucket,
          payin: normalized.payin,
          payout: normalized.payout,
          providerId: normalized.provider_id,
        },
        collectorType,
      )
    }
    span.end()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('persist_quote_failed', {
      provider_id: normalized.provider_id,
      corridor_id: normalized.corridor_id,
      error: errorMessage,
      stack: errorStack,
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    span.end()
    // Don't throw - allow collector to continue
  }
}

export const runAnomalyDetection = async (input: AnomalyDetectionInput) => {
  if (!isTier1Collector(input.collectorType)) {
    return null
  }
  if (!Number.isFinite(input.currentRate) || input.currentRate <= 0) {
    return null
  }
  try {
    return await detectAnomaly(
      input.pool,
      input.corridorId,
      input.providerId,
      input.currentRate,
    )
  } catch (error: unknown) {
    logger.warn('anomaly_detection_error', {
      provider_id: input.providerId,
      corridor_id: input.corridorId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}

export const pauseProviderForBlock = async (
  pool: Pool,
  providerId: string,
  corridorId: string,
  reason: string,
  cooldownMs: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('pause_provider_invalid_id', { provider_id: providerId })
    return
  }

  try {
    const cooldownUntil = cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null
    const rightsRepo = new RightsMatrixRepository(pool)
    const circuitRepo = new CircuitBreakerRepository(pool)

    await rightsRepo.pauseProvider(providerId, `auto_paused:${reason}`)
    await circuitRepo.openCircuit(providerId, corridorId, reason, cooldownUntil)
    logger.debug('provider_paused', {
      provider_id: providerId,
      corridor_id: corridorId,
      reason,
      cooldown_ms: cooldownMs,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('pause_provider_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      reason,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const resumeProviderIfCooldownExpired = async (
  pool: Pool,
  providerId: string,
): Promise<CollectorResumeStatus> => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('resume_provider_invalid_id', { provider_id: providerId })
    return { canCollect: false, reason: 'invalid_provider_id' }
  }

  try {
    const rightsRepo = new RightsMatrixRepository(pool)
    const circuitRepo = new CircuitBreakerRepository(pool)
    const statusRow = await rightsRepo.getProviderStatus(providerId)
    if (!statusRow || statusRow.stoplist_status !== 'paused') {
      return { canCollect: true, reason: 'active' }
    }

    const notes = statusRow.notes ?? ''
    if (!notes.startsWith('auto_paused:')) {
      return { canCollect: false, reason: 'manual_stoplist' }
    }

    const openRows = await circuitRepo.loadOpenCircuits(providerId)

    const now = Date.now()
    const hasActiveCooldown = openRows.some((row) => {
      if (!row.cooldown_until) return true
      return new Date(row.cooldown_until).getTime() > now
    })

    if (hasActiveCooldown) {
      return { canCollect: false, reason: 'cooldown_active' }
    }

    await rightsRepo.setProviderActive(providerId)
    await circuitRepo.closeExpiredOpenCircuits(providerId)

    logger.debug('provider_resumed', { provider_id: providerId })
    return { canCollect: true, reason: 'auto_resume' }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('resume_provider_failed', {
      provider_id: providerId,
      error: errorMessage,
      stack: errorStack,
    })
    // Return safe default - don't allow collection if we can't verify status
    return { canCollect: false, reason: 'resume_check_failed' }
  }
}

export const loadActiveCircuits = async (pool: Pool, providerId: string) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('load_active_circuits_invalid_provider_id', { provider_id: providerId })
    return new Set<string>()
  }

  try {
    const circuitRepo = new CircuitBreakerRepository(pool)
    const rows = await circuitRepo.loadOpenCircuits(providerId)

    const now = Date.now()
    const active = new Set<string | null>()
    for (const row of rows) {
      if (!row.cooldown_until || new Date(row.cooldown_until).getTime() > now) {
        active.add(row.corridor_id)
      }
    }
    logger.debug('active_circuits_loaded', {
      provider_id: providerId,
      count: active.size,
    })
    return active
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('load_active_circuits_failed', {
      provider_id: providerId,
      error: errorMessage,
      stack: errorStack,
    })
    return new Set<string>()
  }
}

export const createIngestionRun = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
  startedAt: Date,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('create_ingestion_run_invalid_provider_id', { provider_id: providerId })
    throw new Error('Invalid provider ID')
  }

  const span = tracer.startSpan('collector.create_ingestion_run')
  span.setAttributes({
    'provider.id': providerId,
    'collector.type': collectorType,
  })

  try {
    const repo = new IngestionRunRepository(pool)
    const runId = await repo.insertRun({
      providerId,
      collectorType,
      startedAt,
      finishedAt: startedAt,
      status: 'success',
    })
    span.setAttribute('ingestion.run_id', runId)
    logger.debug('ingestion_run_created', {
      provider_id: providerId,
      collector_type: collectorType,
      run_id: runId,
    })
    span.end()
    return runId
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('create_ingestion_run_failed', {
      provider_id: providerId,
      collector_type: collectorType,
      error: errorMessage,
      stack: errorStack,
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    span.end()
    throw error
  }
}

export const finishIngestionRun = async (
  pool: Pool,
  runId: string,
  status: string,
  errorCode: string | null,
) => {
  if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
    logger.warn('finish_ingestion_run_invalid_id', { run_id: runId })
    return
  }

  try {
    const repo = new IngestionRunRepository(pool)
    await repo.updateRunStatus(runId, status, errorCode)
    logger.debug('ingestion_run_finished', {
      run_id: runId,
      status,
      error_code: errorCode,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('finish_ingestion_run_failed', {
      run_id: runId,
      status,
      error_code: errorCode,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export type CircuitState = 'open' | 'half_open' | 'closed'

const fetchCircuitRow = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
) => {
  const circuitRepo = new CircuitBreakerRepository(pool)
  return circuitRepo.getCircuitState(providerId, corridorId)
}

const computeCooldownMs = (cooldownUntil: string | null, now: number) => {
  if (!cooldownUntil) return null
  const ts = new Date(cooldownUntil).getTime()
  if (!Number.isFinite(ts)) return null
  return Math.max(0, ts - now)
}

export const recordCircuitOpen = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  reason: string,
  ttlMs: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('record_circuit_open_invalid_provider_id', { provider_id: providerId })
    return
  }

  const span = tracer.startSpan('collector.circuit_open')
  span.setAttributes({
    'provider.id': providerId,
    'corridor.id': corridorId ?? 'global',
    'circuit.reason': reason,
    'circuit.ttl_ms': ttlMs,
  })

  try {
    const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null
    const circuitRepo = new CircuitBreakerRepository(pool)
    await circuitRepo.openCircuit(providerId, corridorId, reason, cooldownUntil)
    try {
      updateCircuitBreakerState(providerId, corridorId ?? 'global', 'open')
    } catch {
      // Silently ignore metrics errors
    }
    logger.debug('circuit_opened', {
      provider_id: providerId,
      corridor_id: corridorId,
      reason,
      ttl_ms: ttlMs,
    })
    span.end()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('record_circuit_open_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      reason,
      error: errorMessage,
      stack: errorStack,
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    span.end()
    // Don't throw - allow collector to continue
  }
}

export const recordCircuitHalfOpen = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  ttlMs: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('record_circuit_half_open_invalid_provider_id', { provider_id: providerId })
    return
  }

  try {
    const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null
    const circuitRepo = new CircuitBreakerRepository(pool)
    await circuitRepo.halfOpenCircuit(providerId, corridorId, cooldownUntil)
    try {
      updateCircuitBreakerState(providerId, corridorId ?? 'global', 'half_open')
    } catch {
      // Silently ignore metrics errors
    }
    logger.debug('circuit_half_opened', {
      provider_id: providerId,
      corridor_id: corridorId,
      ttl_ms: ttlMs,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('record_circuit_half_open_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const recordCircuitClosed = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('record_circuit_closed_invalid_provider_id', { provider_id: providerId })
    return
  }

  try {
    const circuitRepo = new CircuitBreakerRepository(pool)
    await circuitRepo.closeCircuit(providerId, corridorId)
    try {
      updateCircuitBreakerState(providerId, corridorId ?? 'global', 'closed')
    } catch {
      // Silently ignore metrics errors
    }
    logger.debug('circuit_closed', {
      provider_id: providerId,
      corridor_id: corridorId,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('record_circuit_closed_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    // Don't throw - allow collector to continue
  }
}

export const loadCircuitStateFromDb = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  halfOpenMs: number,
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    logger.warn('load_circuit_state_invalid_provider_id', { provider_id: providerId })
    return { state: 'closed' as CircuitState, cooldownMs: null }
  }

  try {
    const row = await fetchCircuitRow(pool, providerId, corridorId)
    if (!row) {
      return { state: 'closed' as CircuitState, cooldownMs: null }
    }

    const now = Date.now()
    const cooldownMs = computeCooldownMs(row.cooldown_until, now)

    if (row.state === 'open') {
      if (cooldownMs && cooldownMs > 0) {
        return { state: 'open' as CircuitState, cooldownMs }
      }
      if (halfOpenMs > 0) {
        await recordCircuitHalfOpen(pool, providerId, corridorId, halfOpenMs)
        return { state: 'half_open' as CircuitState, cooldownMs: halfOpenMs }
      }
      await recordCircuitClosed(pool, providerId, corridorId)
      return { state: 'closed' as CircuitState, cooldownMs: null }
    }

    if (row.state === 'half_open') {
      if (cooldownMs && cooldownMs > 0) {
        return { state: 'half_open' as CircuitState, cooldownMs }
      }
      await recordCircuitClosed(pool, providerId, corridorId)
      return { state: 'closed' as CircuitState, cooldownMs: null }
    }

    return { state: 'closed' as CircuitState, cooldownMs: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('load_circuit_state_failed', {
      provider_id: providerId,
      corridor_id: corridorId,
      error: errorMessage,
      stack: errorStack,
    })
    return { state: 'closed' as CircuitState, cooldownMs: null }
  }
}
