import type { QueueClass, QueueMessageEnvelopeV1 } from './queue-envelope'
import { isQueueClass } from './queue-envelope'

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const parseIsoToMs = (value: unknown): number | null => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) {
    return null
  }
  return ms
}

export type QueueEnvelopeUnwrapReason =
  | 'invalid_message_shape'
  | 'unsupported_envelope_version'
  | 'invalid_queue_class'
  | 'queue_class_mismatch'
  | 'invalid_produced_at'

export type QueueEnvelopeUnwrapSuccess<T> = {
  ok: true
  payload: T
  queueClass: QueueClass | null
  producedAtIso: string | null
  producedAtMs: number | null
  usedEnvelope: boolean
}

export type QueueEnvelopeUnwrapFailure = {
  ok: false
  reason: QueueEnvelopeUnwrapReason
  message: string
}

export type QueueEnvelopeUnwrapResult<T> =
  | QueueEnvelopeUnwrapSuccess<T>
  | QueueEnvelopeUnwrapFailure

export type WrapEnvelopeOptions = {
  producedAtIso?: string
  runId?: string
  correlationId?: string
}

export const wrapEnvelope = <T>(
  queueClass: QueueClass,
  payload: T,
  options: WrapEnvelopeOptions = {},
): QueueMessageEnvelopeV1<T> => {
  return {
    envelopeVersion: 1,
    queueClass,
    producedAtIso: options.producedAtIso || new Date().toISOString(),
    ...(options.runId ? { runId: options.runId } : {}),
    ...(options.correlationId ? { correlationId: options.correlationId } : {}),
    payload,
  }
}

export const unwrapEnvelopeOrLegacy = <T>(
  raw: unknown,
  expectedQueueClass: QueueClass,
): QueueEnvelopeUnwrapResult<T> => {
  if (!isObject(raw)) {
    return {
      ok: false,
      reason: 'invalid_message_shape',
      message: 'Message payload must be an object',
    }
  }

  const looksLikeEnvelope =
    'envelopeVersion' in raw
    || ('queueClass' in raw && 'payload' in raw)

  if (!looksLikeEnvelope) {
    return {
      ok: true,
      payload: raw as T,
      queueClass: null,
      producedAtIso: null,
      producedAtMs: null,
      usedEnvelope: false,
    }
  }

  if (raw.envelopeVersion !== 1) {
    return {
      ok: false,
      reason: 'unsupported_envelope_version',
      message: `Unsupported envelope version: ${String(raw.envelopeVersion)}`,
    }
  }

  if (!isQueueClass(raw.queueClass)) {
    return {
      ok: false,
      reason: 'invalid_queue_class',
      message: `Invalid queue class: ${String(raw.queueClass)}`,
    }
  }

  if (raw.queueClass !== expectedQueueClass) {
    return {
      ok: false,
      reason: 'queue_class_mismatch',
      message: `Expected ${expectedQueueClass}, got ${raw.queueClass}`,
    }
  }

  const producedAtMs = parseIsoToMs(raw.producedAtIso)
  if (producedAtMs === null) {
    return {
      ok: false,
      reason: 'invalid_produced_at',
      message: `Invalid producedAtIso: ${String(raw.producedAtIso)}`,
    }
  }

  return {
    ok: true,
    payload: raw.payload as T,
    queueClass: raw.queueClass,
    producedAtIso: String(raw.producedAtIso),
    producedAtMs,
    usedEnvelope: true,
  }
}

export type ResolveMessageAgeInput = {
  envelopeProducedAtMs?: number | null
  legacyTimestampIso?: string | null
  sentTimestampMs?: number | null
  nowMs?: number
}

export type ResolveMessageAgeResult = {
  ageMs: number | null
  source: 'envelope' | 'legacy' | 'sqs_sent_timestamp' | 'none'
}

const toAgeMs = (eventMs: number | null, nowMs: number): number | null => {
  if (!Number.isFinite(eventMs)) {
    return null
  }
  return Math.max(0, nowMs - (eventMs as number))
}

export const resolveMessageAgeMs = (
  input: ResolveMessageAgeInput,
): ResolveMessageAgeResult => {
  const nowMs = input.nowMs ?? Date.now()

  const envelopeAge = toAgeMs(input.envelopeProducedAtMs ?? null, nowMs)
  if (envelopeAge !== null) {
    return { ageMs: envelopeAge, source: 'envelope' }
  }

  const legacyMs = parseIsoToMs(input.legacyTimestampIso)
  const legacyAge = toAgeMs(legacyMs, nowMs)
  if (legacyAge !== null) {
    return { ageMs: legacyAge, source: 'legacy' }
  }

  const sentAge = toAgeMs(input.sentTimestampMs ?? null, nowMs)
  if (sentAge !== null) {
    return { ageMs: sentAge, source: 'sqs_sent_timestamp' }
  }

  return { ageMs: null, source: 'none' }
}

export const isStale = (
  ageMs: number | null,
  staleWindowMs: number,
  graceMs = 0,
): boolean => {
  if (ageMs === null || !Number.isFinite(ageMs)) {
    return false
  }

  const effectiveWindow = Math.max(0, staleWindowMs) + Math.max(0, graceMs)
  return ageMs > effectiveWindow
}
