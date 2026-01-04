import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from 'redis'
import { getRedisClient } from '../shared/redis'
import * as configModule from '../shared/config'

vi.mock('redis', () => ({
  createClient: vi.fn(),
}))

vi.mock('../shared/config', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('redis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRedisClient', () => {
    it('returns null when redis URL is not configured', async () => {
      vi.mocked(configModule.config).redis.url = ''

      const client = await getRedisClient()

      expect(client).toBeNull()
      expect(createClient).not.toHaveBeenCalled()
    })

    it('creates and connects client when URL is configured', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const client = await getRedisClient()

      expect(client).toBe(mockClient)
      expect(createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' })
      expect(mockClient.connect).toHaveBeenCalled()
    })

    it('returns cached client on subsequent calls', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const client1 = await getRedisClient()
      const client2 = await getRedisClient()

      expect(client1).toBe(client2)
      expect(createClient).toHaveBeenCalledTimes(1)
    })

    it('returns same promise when connection is in progress', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const mockClient = {
        connect: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        ),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const promise1 = getRedisClient()
      const promise2 = getRedisClient()

      expect(promise1).toBe(promise2)
    })

    it('handles connection errors gracefully', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const error = new Error('Connection failed')
      const mockClient = {
        connect: vi.fn().mockRejectedValue(error),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const client = await getRedisClient()

      expect(client).toBeNull()
    })

    it('sets up error handler on client', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      await getRedisClient()

      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('handles error events', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Redis error')), 10)
          }
        }),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      await getRedisClient()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(mockClient.on).toHaveBeenCalled()
    })

    it('resets connecting promise on failure', async () => {
      vi.mocked(configModule.config).redis.url = 'redis://localhost:6379'
      const error = new Error('Connection failed')
      const mockClient = {
        connect: vi.fn().mockRejectedValue(error),
        on: vi.fn(),
      }
      vi.mocked(createClient).mockReturnValue(mockClient as any)

      await getRedisClient()
      const client2 = await getRedisClient()

      expect(client2).toBeNull()
      expect(createClient).toHaveBeenCalledTimes(2)
    })
  })
})


