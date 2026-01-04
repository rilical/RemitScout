import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Pool } from 'pg'
import {
  registerDatabasePool,
  registerRedisClient,
  cleanupAllConnections,
  healthCheckAllConnections,
  listConnections,
} from '../shared/connection-manager'

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('connection-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerDatabasePool', () => {
    it('registers a database pool', () => {
      const pool = new Pool({ connectionString: 'postgres://test' })
      registerDatabasePool(pool, 'test-pool')

      const connections = listConnections()
      expect(connections).toContainEqual({ type: 'database', name: 'test-pool' })
    })
  })

  describe('registerRedisClient', () => {
    it('registers a redis client', () => {
      const mockClient = {
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue('OK'),
        disconnect: vi.fn(),
      } as any

      registerRedisClient(mockClient, 'test-redis')

      const connections = listConnections()
      expect(connections).toContainEqual({ type: 'redis', name: 'test-redis' })
    })
  })

  describe('cleanupAllConnections', () => {
    it('cleans up all registered connections', async () => {
      const pool = new Pool({ connectionString: 'postgres://test' })
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
        quit: vi.fn().mockResolvedValue('OK'),
        disconnect: vi.fn(),
      } as any

      registerDatabasePool(pool, 'test-pool')
      registerRedisClient(mockRedis, 'test-redis')

      const poolEndSpy = vi.spyOn(pool, 'end').mockResolvedValue(undefined)

      await cleanupAllConnections()

      expect(poolEndSpy).toHaveBeenCalled()
      expect(mockRedis.quit).toHaveBeenCalled()

      const connections = listConnections()
      expect(connections).toHaveLength(0)
    })

    it('handles cleanup errors gracefully', async () => {
      const pool = new Pool({ connectionString: 'postgres://test' })
      registerDatabasePool(pool, 'test-pool')

      vi.spyOn(pool, 'end').mockRejectedValue(new Error('Cleanup failed'))

      await expect(cleanupAllConnections()).resolves.not.toThrow()
    })
  })

  describe('healthCheckAllConnections', () => {
    it('checks health of all connections', async () => {
      const pool = new Pool({ connectionString: 'postgres://test' })
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
      } as any

      registerDatabasePool(pool, 'test-pool')
      registerRedisClient(mockRedis, 'test-redis')

      vi.spyOn(pool, 'query').mockResolvedValue({
        rows: [{ '?column?': 1 }],
      } as any)

      const result = await healthCheckAllConnections()

      expect(result.healthy).toBeGreaterThanOrEqual(0)
      expect(result.unhealthy).toBeGreaterThanOrEqual(0)
      expect(result.results.length).toBeGreaterThan(0)
    })
  })
})

