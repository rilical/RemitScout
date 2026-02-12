import { afterEach, describe, expect, it, vi } from 'vitest'

import { assessFxFreshness } from '../scripts/gold-indices-job'

describe('Gold indices FX freshness guard', () => {
  const now = new Date('2026-02-11T16:00:00.000Z')

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows run when fx history is fresh', () => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())

    const result = assessFxFreshness({
      historyMaxDate: new Date('2026-02-11T12:00:00.000Z'),
      snapshotMaxUpdatedAt: null,
      maxAgeHours: 24,
    })

    expect(result.historyFresh).toBe(true)
    expect(result.snapshotFresh).toBe(false)
    expect(result.canProceed).toBe(true)
  })

  it('allows run when fx history is stale but snapshot is fresh', () => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())

    const result = assessFxFreshness({
      historyMaxDate: new Date('2026-02-08T00:00:00.000Z'),
      snapshotMaxUpdatedAt: new Date('2026-02-11T15:30:00.000Z'),
      maxAgeHours: 24,
    })

    expect(result.historyFresh).toBe(false)
    expect(result.snapshotFresh).toBe(true)
    expect(result.canProceed).toBe(true)
  })

  it('blocks run when both history and snapshot are stale or missing', () => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())

    const stale = assessFxFreshness({
      historyMaxDate: new Date('2026-02-08T00:00:00.000Z'),
      snapshotMaxUpdatedAt: new Date('2026-02-09T00:00:00.000Z'),
      maxAgeHours: 24,
    })
    expect(stale.canProceed).toBe(false)

    const missing = assessFxFreshness({
      historyMaxDate: null,
      snapshotMaxUpdatedAt: null,
      maxAgeHours: 24,
    })
    expect(missing.canProceed).toBe(false)
  })
})
