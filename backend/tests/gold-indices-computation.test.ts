import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../shared/tracing', () => ({
  initTracing: () => undefined,
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/shutdown', () => ({
  createShutdownHandler: () => ({
    isShutdownRequested: () => false,
    signal: new AbortController().signal,
  }),
}))

vi.mock('../scripts/gold-indices-job-health', () => ({
  startHealthServer: vi.fn().mockResolvedValue(null),
}))

import { assessFxFreshness } from '../scripts/gold-indices-job'

describe('gold indices computation freshness checks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-12T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows processing when history feed is fresh', () => {
    const result = assessFxFreshness({
      historyMaxDate: new Date('2026-02-12T11:00:00.000Z'),
      snapshotMaxUpdatedAt: new Date('2026-02-10T12:00:00.000Z'),
      maxAgeHours: 6,
    })

    expect(result.historyFresh).toBe(true)
    expect(result.snapshotFresh).toBe(false)
    expect(result.canProceed).toBe(true)
  })

  it('allows processing when snapshot feed is fresh', () => {
    const result = assessFxFreshness({
      historyMaxDate: new Date('2026-02-10T12:00:00.000Z'),
      snapshotMaxUpdatedAt: new Date('2026-02-12T10:00:00.000Z'),
      maxAgeHours: 6,
    })

    expect(result.historyFresh).toBe(false)
    expect(result.snapshotFresh).toBe(true)
    expect(result.canProceed).toBe(true)
  })

  it('blocks processing when both feeds are stale', () => {
    const result = assessFxFreshness({
      historyMaxDate: new Date('2026-02-10T12:00:00.000Z'),
      snapshotMaxUpdatedAt: new Date('2026-02-10T11:00:00.000Z'),
      maxAgeHours: 6,
    })

    expect(result.historyFresh).toBe(false)
    expect(result.snapshotFresh).toBe(false)
    expect(result.canProceed).toBe(false)
  })
})
