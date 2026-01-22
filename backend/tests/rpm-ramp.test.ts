import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'

import { applyRpmRamp, type RampThresholds } from '../plane-b/src/collectors/rpm-ramp'
import type { ProviderRates } from '../plane-b/src/collectors/rate-config'
import * as rateConfig from '../plane-b/src/collectors/rate-config'

vi.mock('../plane-b/src/collectors/rate-config', () => ({
  persistProviderRates: vi.fn(),
}))

describe('applyRpmRamp', () => {
  const mockPool = {} as Pool
  const providerId = 'test-provider'
  const baseRates: ProviderRates = {
    rpm: 100,
    perCorridorRpm: 10,
    source: 'db',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('collector type filtering', () => {
    it('skips non-sweep collectors', async () => {
      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'regular_collector',
        stats: {
          attemptCount: 100,
          successCount: 95,
          blockCount: 0,
          rateLimitCount: 0,
          http2xxCount: 95,
        },
        rates: baseRates,
      })

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })

    it('processes sweep collectors', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 95,
          blockCount: 0,
          rateLimitCount: 0,
          http2xxCount: 95,
        },
        rates: baseRates,
      })

      expect(persistSpy).toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('skips when attemptCount is zero', async () => {
      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 0,
          successCount: 0,
          blockCount: 0,
          rateLimitCount: 0,
          http2xxCount: 0,
        },
        rates: baseRates,
      })

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })

    it('skips when rpm is invalid', async () => {
      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 95,
          blockCount: 0,
          rateLimitCount: 0,
          http2xxCount: 95,
        },
        rates: { ...baseRates, rpm: -1 },
      })

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })

    it('validates non-negative counters', async () => {
      await expect(
        applyRpmRamp({
          pool: mockPool,
          providerId,
          collectorType: 'b2b_full_sweep',
          stats: {
            attemptCount: 100,
            successCount: -1,
            blockCount: 0,
            rateLimitCount: 0,
            http2xxCount: 95,
          },
          rates: baseRates,
        }),
      ).resolves.not.toThrow()

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })

    it('validates blockCount + rateLimitCount <= attemptCount', async () => {
      await expect(
        applyRpmRamp({
          pool: mockPool,
          providerId,
          collectorType: 'b2b_full_sweep',
          stats: {
            attemptCount: 100,
            successCount: 50,
            blockCount: 60,
            rateLimitCount: 50,
            http2xxCount: 50,
          },
          rates: baseRates,
        }),
      ).resolves.not.toThrow()

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })

    it('validates http2xxCount <= attemptCount', async () => {
      await expect(
        applyRpmRamp({
          pool: mockPool,
          providerId,
          collectorType: 'b2b_full_sweep',
          stats: {
            attemptCount: 100,
            successCount: 50,
            blockCount: 0,
            rateLimitCount: 0,
            http2xxCount: 150,
          },
          rates: baseRates,
        }),
      ).resolves.not.toThrow()

      expect(rateConfig.persistProviderRates).not.toHaveBeenCalled()
    })
  })

  describe('decrease logic - high pressure', () => {
    it('decreases RPM when rate limit detected', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 0,
          rateLimitCount: 10,
          http2xxCount: 50,
        },
        rates: baseRates,
      })

      expect(persistSpy).toHaveBeenCalledWith(
        mockPool,
        providerId,
        expect.objectContaining({
          rpm: expect.any(Number),
          perCorridorRpm: expect.any(Number),
        }),
      )

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeLessThan(baseRates.rpm)
      expect(newRates.perCorridorRpm).toBeLessThan(baseRates.perCorridorRpm)
    })

    it('decreases RPM when block rate >= highBlockRate', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: baseRates,
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeLessThan(baseRates.rpm)
    })

    it('scales decrease based on pressure severity', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      const lowPressure = {
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: baseRates,
      }

      const highPressure = {
        ...lowPressure,
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 5,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
      }

      await applyRpmRamp(lowPressure)
      const lowCall = persistSpy.mock.calls[0]
      const lowRpm = lowCall[2].rpm

      vi.clearAllMocks()

      await applyRpmRamp(highPressure)
      const highCall = persistSpy.mock.calls[0]
      const highRpm = highCall[2].rpm

      expect(highRpm).toBeLessThan(lowRpm)
    })

    it('uses less aggressive decrease for minimal pressure', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 500,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 500,
        },
        rates: baseRates,
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      const decreasePercent = (baseRates.rpm - newRates.rpm) / baseRates.rpm
      expect(decreasePercent).toBeLessThan(0.1)
    })
  })

  describe('decrease logic - moderate pressure', () => {
    it('decreases RPM for moderate block rate (0.005 <= blockRate < 0.01)', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 500,
          blockCount: 7,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
        rates: baseRates,
      })

      expect(persistSpy).toHaveBeenCalled()
      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeLessThan(baseRates.rpm)
      const decreasePercent = (baseRates.rpm - newRates.rpm) / baseRates.rpm
      expect(decreasePercent).toBeCloseTo(0.075, 1)
    })

    it('does not decrease if rate limits present with moderate block rate', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 500,
          blockCount: 7,
          rateLimitCount: 1,
          http2xxCount: 950,
        },
        rates: baseRates,
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeLessThan(baseRates.rpm)
    })
  })

  describe('increase logic', () => {
    it('increases RPM when block rate is low and http2xx is stable', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 950,
          blockCount: 2,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
        rates: baseRates,
      })

      expect(persistSpy).toHaveBeenCalled()
      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeGreaterThan(baseRates.rpm)
      expect(newRates.perCorridorRpm).toBeGreaterThan(baseRates.perCorridorRpm)
    })

    it('does not increase if http2xx rate is below threshold', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 900,
          blockCount: 2,
          rateLimitCount: 0,
          http2xxCount: 900,
        },
        rates: baseRates,
      })

      expect(persistSpy).not.toHaveBeenCalled()
    })

    it('applies success rate bonus for high success rates', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      const highSuccess = {
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 980,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
        rates: baseRates,
      }

      const lowSuccess = {
        ...highSuccess,
        stats: {
          attemptCount: 1000,
          successCount: 850,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
      }

      await applyRpmRamp(highSuccess)
      const highCall = persistSpy.mock.calls[0]
      const highRpm = highCall[2].rpm

      vi.clearAllMocks()

      await applyRpmRamp(lowSuccess)
      const lowCall = persistSpy.mock.calls[0]
      const lowRpm = lowCall[2].rpm

      expect(highRpm).toBeGreaterThanOrEqual(lowRpm)
    })
  })

  describe('hold logic', () => {
    it('holds when conditions are moderate', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 900,
          blockCount: 3,
          rateLimitCount: 0,
          http2xxCount: 900,
        },
        rates: baseRates,
      })

      expect(persistSpy).not.toHaveBeenCalled()
    })

    it('holds when nextRpm equals current rpm', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 95,
          blockCount: 0,
          rateLimitCount: 0,
          http2xxCount: 95,
        },
        rates: { ...baseRates, rpm: 1 },
      })

      expect(persistSpy).not.toHaveBeenCalled()
    })
  })

  describe('perCorridorRpm adjustment', () => {
    it('adjusts perCorridorRpm proportionally when rpm decreases', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: { rpm: 100, perCorridorRpm: 10, source: 'db' },
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      const rpmRatio = newRates.rpm / 100
      const expectedPerCorridorRpm = Math.max(1, Math.round(10 * rpmRatio))
      expect(newRates.perCorridorRpm).toBe(expectedPerCorridorRpm)
    })

    it('adjusts perCorridorRpm proportionally when rpm increases', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 950,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
        rates: { rpm: 100, perCorridorRpm: 10, source: 'db' },
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      const rpmRatio = newRates.rpm / 100
      const expectedPerCorridorRpm = Math.max(1, Math.round(10 * rpmRatio))
      expect(newRates.perCorridorRpm).toBe(expectedPerCorridorRpm)
    })

    it('handles zero perCorridorRpm gracefully', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: { rpm: 100, perCorridorRpm: 0, source: 'db' },
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.perCorridorRpm).toBe(0)
    })
  })

  describe('custom thresholds', () => {
    it('uses custom thresholds when provided', async () => {
      const customThresholds: RampThresholds = {
        highBlockRate: 0.02,
        moderateBlockRate: 0.01,
        lowBlockRate: 0.0,
        http2xxStableThreshold: 0.9,
        decreaseBasePercent: 0.1,
        decreaseMaxPercent: 0.5,
        increaseBasePercent: 0.1,
        increaseMaxPercent: 0.2,
        moderateDecreasePercent: 0.15,
        successRateWeight: 0.2,
      }

      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: baseRates,
        thresholds: customThresholds,
      })

      expect(persistSpy).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles persistence errors gracefully without throwing', async () => {
      const persistSpy = vi
        .spyOn(rateConfig, 'persistProviderRates')
        .mockRejectedValue(new Error('Database error'))

      await expect(
        applyRpmRamp({
          pool: mockPool,
          providerId,
          collectorType: 'b2b_full_sweep',
          stats: {
            attemptCount: 100,
            successCount: 50,
            blockCount: 1,
            rateLimitCount: 0,
            http2xxCount: 50,
          },
          rates: baseRates,
        }),
      ).resolves.not.toThrow()

      expect(persistSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles minimum RPM (1)', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 100,
          successCount: 50,
          blockCount: 10,
          rateLimitCount: 0,
          http2xxCount: 50,
        },
        rates: { rpm: 5, perCorridorRpm: 1, source: 'db' },
      })

      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeGreaterThanOrEqual(1)
      expect(newRates.perCorridorRpm).toBeGreaterThanOrEqual(1)
    })

    it('handles very high RPM values', async () => {
      const persistSpy = vi.spyOn(rateConfig, 'persistProviderRates').mockResolvedValue(undefined)

      await applyRpmRamp({
        pool: mockPool,
        providerId,
        collectorType: 'b2b_full_sweep',
        stats: {
          attemptCount: 1000,
          successCount: 950,
          blockCount: 1,
          rateLimitCount: 0,
          http2xxCount: 950,
        },
        rates: { rpm: 10000, perCorridorRpm: 1000, source: 'db' },
      })

      expect(persistSpy).toHaveBeenCalled()
      const call = persistSpy.mock.calls[0]
      const newRates = call[2]
      expect(newRates.rpm).toBeGreaterThan(10000)
    })
  })
})
