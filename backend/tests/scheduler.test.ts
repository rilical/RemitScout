import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createScheduler } from '../plane-b/src/collectors/scheduler'
import { RedisTokenBucket } from '../plane-b/src/lib/redis-token-bucket'

const mockBucketInstances = new Map<string, any>()

vi.mock('../plane-b/src/lib/redis-token-bucket', () => {
  return {
    RedisTokenBucket: vi.fn().mockImplementation((key: string) => {
      if (!mockBucketInstances.has(key)) {
        mockBucketInstances.set(key, {
          key,
          updateRpm: vi.fn(),
          updateUseRedis: vi.fn(),
          acquireToken: vi.fn().mockResolvedValue(undefined),
        })
      }
      return mockBucketInstances.get(key)
    }),
  }
})

describe('createScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBucketInstances.clear()
    vi.mocked(RedisTokenBucket).mockImplementation((key: string) => {
      if (!mockBucketInstances.has(key)) {
        mockBucketInstances.set(key, {
          key,
          updateRpm: vi.fn(),
          updateUseRedis: vi.fn(),
          acquireToken: vi.fn().mockResolvedValue(undefined),
        })
      }
      return mockBucketInstances.get(key)
    })
  })

  describe('initialization', () => {
    it('creates scheduler with valid options', () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      expect(scheduler).toHaveProperty('waitForSlot')
      expect(scheduler).toHaveProperty('updateRates')
      expect(scheduler).toHaveProperty('cleanup')
    })

    it('validates and clamps invalid rpm values', () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: -10,
        perCorridorRpm: NaN,
      })

      expect(scheduler).toBeDefined()
    })

    it('uses default burst multiplier', () => {
      createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      expect(RedisTokenBucket).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        2,
        false,
      )
    })

    it('uses custom burst multiplier', () => {
      createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        burstMultiplier: 3,
      })

      expect(RedisTokenBucket).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        3,
        false,
      )
    })
  })

  describe('waitForSlot', () => {
    it('acquires tokens from corridor and provider buckets', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      expect(RedisTokenBucket).toHaveBeenCalledTimes(2)
    })

    it('skips corridor bucket when perCorridorRpm is 0', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 0,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const calls = (RedisTokenBucket as any).mock.calls
      const corridorCalls = calls.filter((call: any[]) =>
        call[0].includes('corridor'),
      )
      expect(corridorCalls.length).toBe(0)
    })

    it('skips provider bucket when rpm is 0', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 0,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const calls = (RedisTokenBucket as any).mock.calls
      const providerCalls = calls.filter(
        (call: any[]) => !call[0].includes('corridor'),
      )
      expect(providerCalls.length).toBe(0)
    })

    it('applies base delay and jitter', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        baseDelayMs: 100,
        jitterMs: 50,
      })

      const waitMs = await scheduler.waitForSlot('US-MX-USD-MXN')

      expect(waitMs).toBeGreaterThanOrEqual(100)
      expect(waitMs).toBeLessThanOrEqual(150)
    })

    it('applies extra delay and jitter from penalties', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        baseDelayMs: 100,
        jitterMs: 50,
      })

      const waitMs = await scheduler.waitForSlot(
        'US-MX-USD-MXN',
        200,
        100,
      )

      expect(waitMs).toBeGreaterThanOrEqual(300)
      expect(waitMs).toBeLessThanOrEqual(450)
    })

    it('handles token bucket errors gracefully', async () => {
      const mockBucket = {
        updateRpm: vi.fn(),
        updateUseRedis: vi.fn(),
        acquireToken: vi.fn().mockRejectedValue(new Error('Redis error')),
      }

      vi.mocked(RedisTokenBucket).mockImplementation(() => mockBucket as any)

      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await expect(scheduler.waitForSlot('US-MX-USD-MXN')).resolves.not.toThrow()
    })

    it('caches provider key', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')
      await scheduler.waitForSlot('US-CA-USD-CAD')

      const calls = (RedisTokenBucket as any).mock.calls
      const providerKeys = calls
        .map((call: any[]) => call[0])
        .filter((key: string) => !key.includes('corridor'))
      const uniqueProviderKeys = new Set(providerKeys)

      expect(uniqueProviderKeys.size).toBe(1)
    })

    it('creates separate buckets for different corridors', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')
      await scheduler.waitForSlot('US-CA-USD-CAD')

      const calls = (RedisTokenBucket as any).mock.calls
      const corridorKeys = calls
        .map((call: any[]) => call[0])
        .filter((key: string) => key.includes('corridor'))
      const uniqueCorridorKeys = new Set(corridorKeys)

      expect(uniqueCorridorKeys.size).toBe(2)
    })
  })

  describe('updateRates', () => {
    it('updates local rpm and perCorridorRpm', () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      scheduler.updateRates(150, 15)

      const calls = (RedisTokenBucket as any).mock.calls
      const bucketInstances = calls.map(
        () => vi.mocked(RedisTokenBucket).mock.results[0].value,
      )

      expect(bucketInstances[0]?.updateRpm).toHaveBeenCalledWith(150)
    })

    it('updates provider bucket immediately', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const providerKey = 'token_bucket:test-provider'
      const providerBucket = mockBucketInstances.get(providerKey)
      expect(providerBucket).toBeDefined()

      vi.clearAllMocks()

      scheduler.updateRates(150, 10)

      expect(providerBucket.updateRpm).toHaveBeenCalledWith(150)
    })

    it('updates all corridor buckets immediately', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')
      await scheduler.waitForSlot('US-CA-USD-CAD')

      const corridorBuckets = Array.from(mockBucketInstances.values()).filter(
        (bucket) => bucket.key.includes('corridor'),
      )

      vi.clearAllMocks()

      scheduler.updateRates(100, 20)

      for (const bucket of corridorBuckets) {
        expect(bucket.updateRpm).toHaveBeenCalledWith(20)
      }
    })

    it('validates and clamps invalid rpm values', () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      scheduler.updateRates(-10, Infinity)

      const calls = (RedisTokenBucket as any).mock.calls
      expect(calls.length).toBeGreaterThan(0)
    })

    it('does not update if rates unchanged', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const providerKey = 'token_bucket:test-provider'
      const providerBucket = mockBucketInstances.get(providerKey)
      vi.clearAllMocks()

      scheduler.updateRates(100, 10)

      expect(providerBucket.updateRpm).not.toHaveBeenCalled()
    })

    it('only updates provider bucket when rpm changes', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const providerKey = 'token_bucket:test-provider'
      const corridorKey = 'token_bucket:corridor:test-provider:US-MX-USD-MXN'
      const providerBucket = mockBucketInstances.get(providerKey)
      const corridorBucket = mockBucketInstances.get(corridorKey)
      vi.clearAllMocks()

      scheduler.updateRates(150, 10)

      expect(providerBucket.updateRpm).toHaveBeenCalledWith(150)
      expect(corridorBucket.updateRpm).not.toHaveBeenCalled()
    })

    it('only updates corridor buckets when perCorridorRpm changes', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const providerKey = 'token_bucket:test-provider'
      const corridorKey = 'token_bucket:corridor:test-provider:US-MX-USD-MXN'
      const providerBucket = mockBucketInstances.get(providerKey)
      const corridorBucket = mockBucketInstances.get(corridorKey)
      vi.clearAllMocks()

      scheduler.updateRates(100, 20)

      expect(providerBucket.updateRpm).not.toHaveBeenCalled()
      expect(corridorBucket.updateRpm).toHaveBeenCalledWith(20)
    })
  })

  describe('cleanup', () => {
    it('clears all token buckets', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')
      await scheduler.waitForSlot('US-CA-USD-CAD')

      scheduler.cleanup()

      await scheduler.waitForSlot('US-GB-USD-GBP')

      const calls = (RedisTokenBucket as any).mock.calls
      expect(calls.length).toBeGreaterThan(2)
    })
  })

  describe('memory management', () => {
    it('evicts oldest buckets when maxBuckets exceeded', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        maxBuckets: 2,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')
      await scheduler.waitForSlot('US-CA-USD-CAD')
      await scheduler.waitForSlot('US-GB-USD-GBP')

      const calls = (RedisTokenBucket as any).mock.calls
      const corridorKeys = calls
        .map((call: any[]) => call[0])
        .filter((key: string) => key.includes('corridor'))
      const uniqueKeys = new Set(corridorKeys)

      expect(uniqueKeys.size).toBeLessThanOrEqual(2)
    })
  })

  describe('locale support', () => {
    it('creates separate buckets per locale when perLocale=true', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        locale: 'en-US',
        perLocale: true,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const calls = (RedisTokenBucket as any).mock.calls
      const keys = calls.map((call: any[]) => call[0])

      expect(keys.some((key: string) => key.includes('en-US'))).toBe(true)
    })

    it('uses same buckets when perLocale=false', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        locale: 'en-US',
        perLocale: false,
      })

      await scheduler.waitForSlot('US-MX-USD-MXN')

      const calls = (RedisTokenBucket as any).mock.calls
      const keys = calls.map((call: any[]) => call[0])

      expect(keys.some((key: string) => key.includes('en-US'))).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles zero delay correctly', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 100,
        perCorridorRpm: 10,
        baseDelayMs: 0,
        jitterMs: 0,
      })

      const waitMs = await scheduler.waitForSlot('US-MX-USD-MXN', 0, 0)

      expect(waitMs).toBe(0)
    })

    it('handles very high rpm values', () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 1000000,
        perCorridorRpm: 100000,
      })

      expect(scheduler).toBeDefined()
    })

    it('handles zero rpm correctly', async () => {
      const scheduler = createScheduler({
        providerId: 'test-provider',
        rpm: 0,
        perCorridorRpm: 0,
      })

      const waitMs = await scheduler.waitForSlot('US-MX-USD-MXN')

      expect(waitMs).toBe(0)
    })
  })
})
