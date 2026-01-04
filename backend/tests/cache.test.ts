import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTtlCache } from '../shared/cache'
import * as redisModule from '../shared/redis'

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn(),
}))

describe('createTtlCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('memory-only cache (no Redis)', () => {
    it('stores and retrieves values', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 1000)
      const result = await cache.get('key1')

      expect(result).toBe('value1')
    })

    it('returns null for non-existent keys', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      const result = await cache.get('nonexistent')

      expect(result).toBeNull()
    })

    it('expires entries after TTL', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 100)
      await new Promise((resolve) => setTimeout(resolve, 150))
      const result = await cache.get('key1')

      expect(result).toBeNull()
    })

    it('handles zero TTL', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 0)
      const result = await cache.get('key1')

      expect(result).toBe('value1')
    })

    it('handles negative TTL', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', -1000)
      const result = await cache.get('key1')

      expect(result).toBe('value1')
    })

    it('returns correct size', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      expect(cache.size()).toBe(0)
      await cache.set('key1', 'value1', 1000)
      expect(cache.size()).toBe(1)
      await cache.set('key2', 'value2', 1000)
      expect(cache.size()).toBe(2)
    })

    it('clears all entries', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 1000)
      await cache.set('key2', 'value2', 1000)
      expect(cache.size()).toBe(2)

      await cache.clear()
      expect(cache.size()).toBe(0)
      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })

    it('handles null values', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<string | null>()

      await cache.set('key1', null, 1000)
      const result = await cache.get('key1')

      expect(result).toBeNull()
    })
  })

  describe('Redis-backed cache', () => {
    it('stores and retrieves values from Redis', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      mockRedis.get.mockResolvedValue(JSON.stringify('value1'))
      const result = await cache.get('key1')

      expect(result).toBe('value1')
      expect(mockRedis.get).toHaveBeenCalledWith('key1')
    })

    it('falls back to memory when Redis get fails', async () => {
      const mockRedis = {
        get: vi.fn().mockRejectedValue(new Error('Redis error')),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 1000)
      const result = await cache.get('key1')

      expect(result).toBe('value1')
    })

    it('stores values in Redis with TTL', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 5000)

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('value1'),
        { PX: 5000 },
      )
    })

    it('falls back to memory when Redis set fails', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn().mockRejectedValue(new Error('Redis error')),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 1000)
      const result = await cache.get('key1')

      expect(result).toBe('value1')
    })

    it('returns null when Redis key does not exist', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      const result = await cache.get('nonexistent')

      expect(result).toBeNull()
    })

    it('handles invalid JSON from Redis', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('invalid json'),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>()

      await cache.set('key1', 'value1', 1000)
      await expect(cache.get('key1')).rejects.toThrow()
    })
  })

  describe('namespaced cache', () => {
    it('uses namespace in Redis keys', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>({ namespace: 'test-ns' })

      await cache.set('key1', 'value1', 1000)

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-ns:key1',
        JSON.stringify('value1'),
        { PX: 1000 },
      )

      mockRedis.get.mockResolvedValue(JSON.stringify('value1'))
      await cache.get('key1')

      expect(mockRedis.get).toHaveBeenCalledWith('test-ns:key1')
    })

    it('handles empty namespace', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>({ namespace: '' })

      await cache.set('key1', 'value1', 1000)

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('value1'),
        { PX: 1000 },
      )
    })

    it('trims namespace whitespace', async () => {
      const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
      }
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(mockRedis as any)

      const cache = createTtlCache<string>({ namespace: '  test-ns  ' })

      await cache.set('key1', 'value1', 1000)

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-ns:key1',
        JSON.stringify('value1'),
        { PX: 1000 },
      )
    })
  })

  describe('complex data types', () => {
    it('handles objects', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<{ name: string; count: number }>()

      const value = { name: 'test', count: 42 }
      await cache.set('key1', value, 1000)
      const result = await cache.get('key1')

      expect(result).toEqual(value)
    })

    it('handles arrays', async () => {
      vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
      const cache = createTtlCache<number[]>()

      const value = [1, 2, 3]
      await cache.set('key1', value, 1000)
      const result = await cache.get('key1')

      expect(result).toEqual(value)
    })
  })
})


