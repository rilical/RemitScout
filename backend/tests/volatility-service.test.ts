import { expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import {
  VolatilityService as SharedVolatilityService,
  buildCacheTtlResult,
  type CacheTtlResult,
} from '../shared/volatility-service'
import { CorridorVolatilityRepository } from '../plane-b/src/repositories/implementations/corridor-volatility-repository.ts'
import { describeDbIntegration, withTestTransaction } from './helpers/test-db'

class VolatilityService {
  private readonly repo: CorridorVolatilityRepository
  private readonly service: SharedVolatilityService

  constructor(pool: Pool) {
    this.repo = new CorridorVolatilityRepository(pool)
    this.service = new SharedVolatilityService(this.repo)
  }

  getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult> {
    return this.service.getCacheTtlForCorridor(corridorId)
  }

  async getCacheTtlForCorridors(
    corridorIds: string[],
  ): Promise<Map<string, CacheTtlResult>> {
    const volatilityMap = await this.repo.getVolatilityScores(corridorIds)
    const resultMap = new Map<string, CacheTtlResult>()

    for (const corridorId of corridorIds) {
      const record = volatilityMap.get(corridorId)
      resultMap.set(
        corridorId,
        record
          ? buildCacheTtlResult(record.volatility_score, true)
          : buildCacheTtlResult(null, false),
      )
    }

    return resultMap
  }
}

describeDbIntegration('VolatilityService', () => {
  let pool: Pool
  let service: VolatilityService

  beforeEach(async () => {
    pool = createPool(config.db.planeBUrl)
    service = new VolatilityService(pool)
  })

  afterEach(async () => {
    await pool.end()
  })

  it('assigns tier1 (30 min) for high volatility (>= 0.15)', async () => {
    await withTestTransaction(pool, async () => {
      const corridorId = 'US-BR-USD-BRL'

      await pool.query(
        `INSERT INTO silver.corridor_volatility_cache
         (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [corridorId, 0.20, 20, 18.0, 3.6],
      )

      const result = await service.getCacheTtlForCorridor(corridorId)
      expect(result.tier).toBe('tier1')
      expect(result.ttlSeconds).toBe(30 * 60)
      expect(result.volatilityScore).toBe(0.20)
      expect(result.hasData).toBe(true)
    })
  })

  it('assigns tier2 (2 hours) for moderate volatility (>= 0.08, < 0.15)', async () => {
    await withTestTransaction(pool, async () => {
      const corridorId = 'US-TH-USD-THB'

      await pool.query(
        `INSERT INTO silver.corridor_volatility_cache
         (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [corridorId, 0.10, 20, 55.0, 5.5],
      )

      const result = await service.getCacheTtlForCorridor(corridorId)
      expect(result.tier).toBe('tier2')
      expect(result.ttlSeconds).toBe(2 * 60 * 60)
      expect(result.volatilityScore).toBe(0.10)
      expect(result.hasData).toBe(true)
    })
  })

  it('assigns tier3 (6 hours) for low volatility (< 0.08)', async () => {
    await withTestTransaction(pool, async () => {
      const corridorId = 'GB-ZA-GBP-ZAR'

      await pool.query(
        `INSERT INTO silver.corridor_volatility_cache
         (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [corridorId, 0.05, 20, 105.0, 5.25],
      )

      const result = await service.getCacheTtlForCorridor(corridorId)
      expect(result.tier).toBe('tier3')
      expect(result.ttlSeconds).toBe(6 * 60 * 60)
      expect(result.volatilityScore).toBe(0.05)
      expect(result.hasData).toBe(true)
    })
  })

  it('defaults to 4 hours when no volatility data exists', async () => {
    await withTestTransaction(pool, async () => {
      const corridorId = 'CA-JP-CAD-JPY'

      const result = await service.getCacheTtlForCorridor(corridorId)
      expect(result.tier).toBe('tier2')
      expect(result.ttlSeconds).toBe(4 * 60 * 60)
      expect(result.volatilityScore).toBeNull()
      expect(result.hasData).toBe(false)
    })
  })

  it('handles multiple corridors correctly', async () => {
    await withTestTransaction(pool, async () => {
      const corridors = [
        { id: 'US-BR-USD-BRL', score: 0.20, expectedTier: 'tier1' },
        { id: 'US-TH-USD-THB', score: 0.10, expectedTier: 'tier2' },
        { id: 'GB-ZA-GBP-ZAR', score: 0.05, expectedTier: 'tier3' },
      ]

      for (const corridor of corridors) {
        await pool.query(
          `INSERT INTO silver.corridor_volatility_cache
           (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [corridor.id, corridor.score, 20, 18.0, 18.0 * corridor.score],
        )
      }

      const result = await service.getCacheTtlForCorridors(corridors.map(c => c.id))

      expect(result.size).toBe(3)
      expect(result.get('US-BR-USD-BRL')?.tier).toBe('tier1')
      expect(result.get('US-TH-USD-THB')?.tier).toBe('tier2')
      expect(result.get('GB-ZA-GBP-ZAR')?.tier).toBe('tier3')
    })
  })
})
