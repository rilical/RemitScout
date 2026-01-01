import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireCorridorId } from '../../../shared/corridor'
import type { NormalizedQuote } from '../normalize/quote-normalizer'
import { detectAnomaly } from '../signals/anomaly-detector'
import { persistProviderRates } from './rate-config'

const logger = createLogger('plane-b.collectors.base')

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

const isTier1Collector = (collectorType: string) => collectorType === 'b2b_tier_1_alpha'

export const ensureProvider = async (
  pool: Pool,
  providerId: string,
  displayName: string,
) => {
  await query(
    `INSERT INTO silver.provider (provider_id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (provider_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       updated_at = NOW()`,
    [providerId, displayName],
    pool,
  )
}

export const loadObservedCorridors = async (pool: Pool, providerId: string) => {
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.provider_corridor_capability
      WHERE provider_id = $1
        AND is_supported = true`,
    [providerId],
    pool,
  )
  return result.rows.map(row => row.corridor_id).filter(Boolean)
}

export const ensureCorridor = async (pool: Pool, corridorId: string) => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(corridorId)
  await query(
    `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (corridor_id) DO NOTHING`,
    [corridorId, sourceCountry, destCountry, sourceCurrency, destCurrency],
    pool,
  )
}

export const insertAttempt = async (
  pool: Pool,
  providerId: string,
  input: AttemptInput,
) => {
  await query(
    `INSERT INTO silver.quote_attempt
     (provider_id, corridor_id, amount_bucket, payin_method, payout_method, success, error_type, http_status, error_message, bronze_object_key, request_fingerprint)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      providerId,
      input.corridorId,
      input.amountBucket,
      input.payinMethod,
      input.payoutMethod,
      input.success,
      input.errorType ?? null,
      input.httpStatus ?? null,
      input.errorMessage ?? null,
      input.bronzeObjectKey ?? null,
      input.requestFingerprint,
    ],
    pool,
  )
}

export const insertOpsAlert = async (
  pool: Pool,
  providerId: string,
  input: OpsAlertInput,
) => {
  const payload = {
    payin_method: input.payinMethod,
    payout_method: input.payoutMethod,
    collector_type: input.collectorType,
    trace_id: input.traceId,
    request_fingerprint: input.requestFingerprint,
  }
  const result = await query<{ alert_id: string }>(
    `INSERT INTO silver.ops_alert_event
     (provider_id, corridor_id, amount_bucket, http_status, block_reason, bronze_object_key, request_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING alert_id`,
    [
      providerId,
      input.corridorId,
      input.amountBucket,
      input.httpStatus,
      input.blockReason,
      input.bronzeObjectKey,
      input.traceId,
      payload,
    ],
    pool,
  )
  return result.rows[0]?.alert_id ?? null
}

export const markCorridorUnsupported = async (
  pool: Pool,
  providerId: string,
  corridorId: string,
  source: string,
) => {
  await query(
    `INSERT INTO silver.provider_corridor_capability
     (provider_id, corridor_id, is_supported, source, last_verified_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       is_supported = EXCLUDED.is_supported,
       source = EXCLUDED.source,
       last_verified_at = EXCLUDED.last_verified_at,
       updated_at = NOW()`,
    [providerId, corridorId, false, source],
    pool,
  )
}

export const persistNormalizedQuote = async (
  pool: Pool,
  normalized: NormalizedQuote,
) => {
  const qualityFlags = JSON.stringify(normalized.quality_flags)
  await query(
    `WITH quote_insert AS (
       INSERT INTO silver.quote_record
       (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, promotional_fee_amount, fee_currency, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, error_code, error_message, collected_at, ingested_at, ingestion_run_id, bronze_object_key, parser_version, quality_flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
       RETURNING 1
     )
     INSERT INTO silver.latest_quote_by_provider
     (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, promotional_fee_amount, total_debit_amount, receive_amount, implied_fx_rate, promotional_rate, base_rate, promotional_cap_amount, delivery_time_min_minutes, delivery_time_max_minutes, status, quality_flags)
     VALUES ($27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45)
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
      normalized.provider_id,
      normalized.corridor_id,
      normalized.amount_bucket,
      normalized.payin,
      normalized.payout,
      normalized.send_amount,
      normalized.fee_amount,
      normalized.promotional_fee_amount,
      normalized.fee_currency,
      normalized.total_debit_amount,
      normalized.receive_amount,
      normalized.implied_fx_rate,
      normalized.promotional_rate,
      normalized.base_rate,
      normalized.promotional_cap_amount,
      normalized.delivery_time_min_minutes,
      normalized.delivery_time_max_minutes,
      'ok',
      null,
      null,
      normalized.collected_at,
      normalized.ingested_at,
      normalized.ingestion_run_id,
      normalized.bronze_object_key,
      normalized.parser_version,
      qualityFlags,
      normalized.corridor_id,
      normalized.amount_bucket,
      normalized.payin,
      normalized.payout,
      normalized.provider_id,
      normalized.collected_at,
      normalized.send_amount,
      normalized.fee_amount,
      normalized.promotional_fee_amount,
      normalized.total_debit_amount,
      normalized.receive_amount,
      normalized.implied_fx_rate,
      normalized.promotional_rate,
      normalized.base_rate,
      normalized.promotional_cap_amount,
      normalized.delivery_time_min_minutes,
      normalized.delivery_time_max_minutes,
      'ok',
      qualityFlags,
    ],
    pool,
  )
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
  } catch (error) {
    logger.warn('anomaly_detection_error', {
      provider_id: input.providerId,
      corridor_id: input.corridorId,
      error,
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
  const cooldownUntil = cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null

  await query(
    `INSERT INTO silver.rights_matrix
     (provider_id, stoplist_status, notes)
     VALUES ($1, 'paused', $2)
     ON CONFLICT (provider_id) DO UPDATE SET
       stoplist_status = 'paused',
       notes = EXCLUDED.notes,
       updated_at = NOW()`,
    [providerId, `auto_paused:${reason}`],
    pool,
  )

  await query(
    `INSERT INTO silver.circuit_breaker
     (provider_id, corridor_id, state, reason, cooldown_until)
     VALUES ($1, $2, 'open', $3, $4)
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       state = EXCLUDED.state,
       reason = EXCLUDED.reason,
       cooldown_until = EXCLUDED.cooldown_until,
       updated_at = NOW()`,
    [providerId, corridorId, reason, cooldownUntil],
    pool,
  )
}

export const resumeProviderIfCooldownExpired = async (
  pool: Pool,
  providerId: string,
): Promise<CollectorResumeStatus> => {
  const statusResult = await query<{ stoplist_status: string; notes: string | null }>(
    `SELECT stoplist_status, notes
       FROM silver.rights_matrix
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )
  const statusRow = statusResult.rows[0]
  if (!statusRow || statusRow.stoplist_status !== 'paused') {
    return { canCollect: true, reason: 'active' }
  }

  const notes = statusRow.notes ?? ''
  if (!notes.startsWith('auto_paused:')) {
    return { canCollect: false, reason: 'manual_stoplist' }
  }

  const openResult = await query<{ corridor_id: string | null; cooldown_until: string | null }>(
    `SELECT corridor_id, cooldown_until
       FROM silver.circuit_breaker
      WHERE provider_id = $1
        AND state = 'open'`,
    [providerId],
    pool,
  )

  const now = Date.now()
  const hasActiveCooldown = openResult.rows.some((row) => {
    if (!row.cooldown_until) return true
    return new Date(row.cooldown_until).getTime() > now
  })

  if (hasActiveCooldown) {
    return { canCollect: false, reason: 'cooldown_active' }
  }

  await query(
    `UPDATE silver.rights_matrix
        SET stoplist_status = 'active',
            notes = NULL,
            updated_at = NOW()
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )

  await query(
    `UPDATE silver.circuit_breaker
        SET state = 'closed',
            updated_at = NOW()
      WHERE provider_id = $1
        AND state = 'open'
        AND cooldown_until IS NOT NULL
        AND cooldown_until <= NOW()`,
    [providerId],
    pool,
  )

  return { canCollect: true, reason: 'auto_resume' }
}

export const loadActiveCircuits = async (pool: Pool, providerId: string) => {
  const result = await query<{ corridor_id: string | null; cooldown_until: string | null }>(
    `SELECT corridor_id, cooldown_until
       FROM silver.circuit_breaker
      WHERE provider_id = $1
        AND state = 'open'`,
    [providerId],
    pool,
  )

  const now = Date.now()
  const active = new Set<string | null>()
  for (const row of result.rows) {
    if (!row.cooldown_until || new Date(row.cooldown_until).getTime() > now) {
      active.add(row.corridor_id)
    }
  }
  return active
}

export const createIngestionRun = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
  startedAt: Date,
) => {
  const result = await query<{ run_id: string }>(
    `INSERT INTO silver.ingestion_run
     (provider_id, collector_type, started_at, finished_at, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING run_id`,
    [providerId, collectorType, startedAt, startedAt, 'success'],
    pool,
  )
  return result.rows[0]?.run_id ?? ''
}

export const finishIngestionRun = async (
  pool: Pool,
  runId: string,
  status: string,
  errorCode: string | null,
) => {
  if (!runId) return
  await query(
    `UPDATE silver.ingestion_run
     SET status = $1,
         finished_at = NOW(),
         error_code = $2
     WHERE run_id = $3`,
    [status, errorCode, runId],
    pool,
  )
}

export type CircuitState = 'open' | 'half_open' | 'closed'

type CircuitRow = {
  state: CircuitState
  cooldown_until: string | null
}

const fetchCircuitRow = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
) => {
  const result = await query<CircuitRow>(
    `SELECT state, cooldown_until
       FROM silver.circuit_breaker
      WHERE provider_id = $1
        AND corridor_id ${corridorId ? '= $2' : 'IS NULL'}`,
    corridorId ? [providerId, corridorId] : [providerId],
    pool,
  )
  return result.rows[0] ?? null
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
  const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null
  await query(
    `INSERT INTO silver.circuit_breaker
     (provider_id, corridor_id, state, reason, cooldown_until)
     VALUES ($1, $2, 'open', $3, $4)
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       state = EXCLUDED.state,
       reason = EXCLUDED.reason,
       cooldown_until = EXCLUDED.cooldown_until,
       updated_at = NOW()`,
    [providerId, corridorId, reason, cooldownUntil],
    pool,
  )
}

export const recordCircuitHalfOpen = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  ttlMs: number,
) => {
  const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null
  await query(
    `INSERT INTO silver.circuit_breaker
     (provider_id, corridor_id, state, reason, cooldown_until)
     VALUES ($1, $2, 'half_open', NULL, $3)
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       state = EXCLUDED.state,
       reason = NULL,
       cooldown_until = EXCLUDED.cooldown_until,
       updated_at = NOW()`,
    [providerId, corridorId, cooldownUntil],
    pool,
  )
}

export const recordCircuitClosed = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
) => {
  await query(
    `INSERT INTO silver.circuit_breaker
     (provider_id, corridor_id, state, reason, cooldown_until)
     VALUES ($1, $2, 'closed', NULL, NULL)
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       state = EXCLUDED.state,
       reason = NULL,
       cooldown_until = NULL,
       updated_at = NOW()`,
    [providerId, corridorId],
    pool,
  )
}

export const loadCircuitStateFromDb = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  halfOpenMs: number,
) => {
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
}

export const penalizeRpmImmediately = async (
  pool: Pool,
  providerId: string,
  currentRates: { rpm: number; perCorridorRpm: number },
  multiplier: number,
) => {
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return null
  }
  if (!Number.isFinite(currentRates.rpm) || currentRates.rpm <= 0) {
    return null
  }

  const nextRpm = Math.max(1, Math.floor(currentRates.rpm * multiplier))
  const nextPerCorridorRpm = Math.max(1, Math.floor(currentRates.perCorridorRpm * multiplier))

  await persistProviderRates(pool, providerId, {
    rpm: nextRpm,
    perCorridorRpm: nextPerCorridorRpm,
  })

  logger.warn('rpm_penalty_applied', {
    provider_id: providerId,
    prev_rpm: currentRates.rpm,
    next_rpm: nextRpm,
    prev_corridor_rpm: currentRates.perCorridorRpm,
    next_corridor_rpm: nextPerCorridorRpm,
    multiplier,
    at: new Date().toISOString(),
  })

  return { rpm: nextRpm, perCorridorRpm: nextPerCorridorRpm }
}
