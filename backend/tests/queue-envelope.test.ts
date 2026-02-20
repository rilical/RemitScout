import { describe, expect, it } from 'vitest'
import {
  isStale,
  resolveMessageAgeMs,
  unwrapEnvelopeOrLegacy,
  wrapEnvelope,
} from '../shared/queue-staleness'

describe('queue envelope + staleness helpers', () => {
  it('wraps and unwraps v1 envelope', () => {
    const envelope = wrapEnvelope('gold-live', { corridorId: 'US-MX-USD-MXN' }, {
      producedAtIso: '2026-02-20T00:00:00.000Z',
      runId: 'run-1',
      correlationId: 'corridor-1',
    })

    expect(envelope.envelopeVersion).toBe(1)
    expect(envelope.queueClass).toBe('gold-live')

    const parsed = unwrapEnvelopeOrLegacy<{ corridorId: string }>(envelope, 'gold-live')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.usedEnvelope).toBe(true)
    expect(parsed.payload.corridorId).toBe('US-MX-USD-MXN')
    expect(parsed.producedAtMs).toBeGreaterThan(0)
  })

  it('falls back to legacy payload when envelope fields are missing', () => {
    const legacy = { requestId: 'req-1', providerId: 'wise' }
    const parsed = unwrapEnvelopeOrLegacy<typeof legacy>(legacy, 'quote-refresh')

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.usedEnvelope).toBe(false)
    expect(parsed.payload).toEqual(legacy)
    expect(parsed.producedAtMs).toBeNull()
  })

  it('fails on queue-class mismatch', () => {
    const envelope = wrapEnvelope('quote-refresh', { requestId: 'req-1' }, {
      producedAtIso: '2026-02-20T00:00:00.000Z',
    })
    const parsed = unwrapEnvelopeOrLegacy(envelope, 'fx-rate-refresh')
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.reason).toBe('queue_class_mismatch')
  })

  it('resolves message age source in priority order', () => {
    const now = Date.parse('2026-02-20T01:00:00.000Z')
    const envelopeAge = resolveMessageAgeMs({
      envelopeProducedAtMs: Date.parse('2026-02-20T00:59:00.000Z'),
      legacyTimestampIso: '2026-02-20T00:30:00.000Z',
      sentTimestampMs: Date.parse('2026-02-20T00:20:00.000Z'),
      nowMs: now,
    })
    expect(envelopeAge.source).toBe('envelope')
    expect(envelopeAge.ageMs).toBe(60_000)

    const legacyAge = resolveMessageAgeMs({
      envelopeProducedAtMs: null,
      legacyTimestampIso: '2026-02-20T00:50:00.000Z',
      sentTimestampMs: Date.parse('2026-02-20T00:40:00.000Z'),
      nowMs: now,
    })
    expect(legacyAge.source).toBe('legacy')
    expect(legacyAge.ageMs).toBe(10 * 60_000)

    const sentAge = resolveMessageAgeMs({
      envelopeProducedAtMs: null,
      legacyTimestampIso: null,
      sentTimestampMs: Date.parse('2026-02-20T00:45:00.000Z'),
      nowMs: now,
    })
    expect(sentAge.source).toBe('sqs_sent_timestamp')
    expect(sentAge.ageMs).toBe(15 * 60_000)
  })

  it('applies stale boundary and grace period', () => {
    expect(isStale(1200, 1000, 0)).toBe(true)
    expect(isStale(1000, 1000, 0)).toBe(false)
    expect(isStale(1100, 1000, 200)).toBe(false)
    expect(isStale(1301, 1000, 300)).toBe(true)
  })
})
