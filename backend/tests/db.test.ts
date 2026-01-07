import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Pool } from 'pg'
import { createPool, getPool, query } from '../shared/db'
import * as dbMetrics from '../shared/db-metrics'
import * as configModule from '../shared/config'

vi.mock('../shared/db-metrics', () => ({
  recordQueryFromSql: vi.fn(),
  updateConnectionPoolMetrics: vi.fn(),
}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      url: 'postgresql://test:test@localhost:5432/test',
      planeAUrl: 'postgresql://test:test@localhost:5432/plane-a',
      planeBUrl: 'postgresql://test:test@localhost:5432/plane-b',
      planeCUrl: 'postgresql://test:test@localhost:5432/plane-c',
    },
  },
}))

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPool', () => {
    it('creates a pool with default connection string', () => {
      const pool = createPool()

      expect(pool).toBeInstanceOf(Pool)
    })

    it('creates a pool with custom connection string', () => {
      const customUrl = 'postgresql://custom:custom@localhost:5432/custom'
      const pool = createPool(customUrl)

      expect(pool).toBeInstanceOf(Pool)
    })
  })

  describe('getPool', () => {
    it('returns cached pool for same connection string', () => {
      const pool1 = getPool()
      const pool2 = getPool()

      expect(pool1).toBe(pool2)
    })

    it('creates new pool for different connection string', () => {
      const pool1 = getPool()
      const pool2 = getPool('postgresql://different:different@localhost:5432/different')

      expect(pool1).not.toBe(pool2)
    })

    it('caches pool by connection string', () => {
      const url1 = 'postgresql://test1:test1@localhost:5432/test1'
      const url2 = 'postgresql://test2:test2@localhost:5432/test2'

      const pool1a = getPool(url1)
      const pool1b = getPool(url1)
      const pool2a = getPool(url2)
      const pool2b = getPool(url2)

      expect(pool1a).toBe(pool1b)
      expect(pool2a).toBe(pool2b)
      expect(pool1a).not.toBe(pool2a)
    })
  })

  describe('query', () => {
    it('records successful query', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
      } as unknown as Pool

      await query('SELECT * FROM test', [], mockPool)

      expect(dbMetrics.recordQueryFromSql).toHaveBeenCalledWith(
        'SELECT * FROM test',
        expect.any(Number),
        'success',
      )
    })

    it('records failed query', async () => {
      const error = new Error('Query failed')
      const mockPool = {
        query: vi.fn().mockRejectedValue(error),
      } as unknown as Pool

      await expect(query('SELECT * FROM test', [], mockPool)).rejects.toThrow('Query failed')

      expect(dbMetrics.recordQueryFromSql).toHaveBeenCalledWith(
        'SELECT * FROM test',
        expect.any(Number),
        'error',
      )
    })

    it('returns query result', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 }
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockResult),
      } as unknown as Pool

      const result = await query('SELECT * FROM test', [], mockPool)

      expect(result).toBe(mockResult)
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', [])
    })

    it('passes parameters to query', async () => {
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      } as unknown as Pool

      await query('SELECT * FROM test WHERE id = $1', [123], mockPool)

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [123])
    })

    it('handles metrics recording errors gracefully on success', async () => {
      vi.mocked(dbMetrics.recordQueryFromSql).mockImplementation(() => {
        throw new Error('Metrics error')
      })

      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      } as unknown as Pool

      const result = await query('SELECT * FROM test', [], mockPool)

      expect(result).toEqual({ rows: [] })
    })

    it('handles metrics recording errors gracefully on failure', async () => {
      const error = new Error('Query failed')
      vi.mocked(dbMetrics.recordQueryFromSql).mockImplementation(() => {
        throw new Error('Metrics error')
      })

      const mockPool = {
        query: vi.fn().mockRejectedValue(error),
      } as unknown as Pool

      await expect(query('SELECT * FROM test', [], mockPool)).rejects.toThrow('Query failed')
    })

    it('calculates query duration', async () => {
      const mockPool = {
        query: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return { rows: [] }
        }),
      } as unknown as Pool

      await query('SELECT * FROM test', [], mockPool)

      const call = vi.mocked(dbMetrics.recordQueryFromSql).mock.calls[0]
      const duration = call[1] as number
      expect(duration).toBeGreaterThanOrEqual(0.01)
      expect(duration).toBeLessThan(0.1)
    })

    it('uses default pool when poolInstance not provided', async () => {
      const mockResult = { rows: [] }
      const defaultPool = getPool()
      vi.spyOn(defaultPool, 'query').mockResolvedValue(mockResult as any)

      const result = await query('SELECT * FROM test')

      expect(result).toBe(mockResult)
    })
  })
})



