import { describe, expect, it } from 'vitest'

import {
  getCompletedSweepReferenceTime,
  getSweepCadenceDriftMinutes,
  isSweepTierDue,
} from '../shared/b2b-sweep-cadence'

describe('b2b sweep cadence helpers', () => {
  it('anchors cadence to completion time instead of enqueue time', () => {
    const latestCompletedRun = {
      createdAt: '2026-03-05T06:00:00.000Z',
      startedAt: '2026-03-05T06:05:00.000Z',
      finishedAt: '2026-03-05T09:10:00.000Z',
    }
    const now = new Date('2026-03-05T12:15:00.000Z')

    expect(getCompletedSweepReferenceTime(latestCompletedRun)?.toISOString()).toBe(
      '2026-03-05T09:10:00.000Z',
    )
    expect(
      isSweepTierDue({
        latestCompletedRun,
        cadenceSeconds: 10_800,
        now,
      }),
    ).toBe(true)
    expect(
      getSweepCadenceDriftMinutes({
        latestCompletedRun,
        cadenceSeconds: 10_800,
        now,
      }),
    ).toBe(5)
  })

  it('returns due when no completed run exists yet', () => {
    expect(
      isSweepTierDue({
        latestCompletedRun: null,
        cadenceSeconds: 10_800,
        now: new Date('2026-03-05T12:00:00.000Z'),
      }),
    ).toBe(true)
  })
})
