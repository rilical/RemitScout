import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { VolatilityService } from '../plane-b/src/services/volatility-service'

describe('VolatilityService', () => {
  let pool: Pool
  let service: VolatilityService

  beforeEach(async () => {
    pool = createPool(config.db.planeBUrl)
    service = new VolatilityService(pool)

    await pool.query('DELETE FROM silver.corridor_volatility_cache')
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.corridor_volatility_cache')
    await pool.end()
  })

  it('assigns tier1 (30 min) for high volatility (>= 0.15)', async () => {
    const corridorId = 'US-MX-USD-MXN'

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

  it('assigns tier2 (1 hour) for moderate volatility (>= 0.08, < 0.15)', async () => {
    const corridorId = 'US-PH-USD-PHP'

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.10, 20, 55.0, 5.5],
    )

    const result = await service.getCacheTtlForCorridor(corridorId)
    expect(result.tier).toBe('tier2')
    expect(result.ttlSeconds).toBe(60 * 60)
    expect(result.volatilityScore).toBe(0.10)
    expect(result.hasData).toBe(true)
  })

  it('assigns tier3 (4 hours) for low volatility (< 0.08)', async () => {
    const corridorId = 'GB-IN-GBP-INR'

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.05, 20, 105.0, 5.25],
    )

    const result = await service.getCacheTtlForCorridor(corridorId)
    expect(result.tier).toBe('tier3')
    expect(result.ttlSeconds).toBe(4 * 60 * 60)
    expect(result.volatilityScore).toBe(0.05)
    expect(result.hasData).toBe(true)
  })

  it('defaults to 2 hours when no volatility data exists', async () => {
    const corridorId = 'US-CA-USD-CAD'

    const result = await service.getCacheTtlForCorridor(corridorId)
    expect(result.tier).toBe('tier2')
    expect(result.ttlSeconds).toBe(2 * 60 * 60)
    expect(result.volatilityScore).toBeNull()
    expect(result.hasData).toBe(false)
  })

  it('handles multiple corridors correctly', async () => {
    const corridors = [
      { id: 'US-MX-USD-MXN', score: 0.20, expectedTier: 'tier1' },
      { id: 'US-PH-USD-PHP', score: 0.10, expectedTier: 'tier2' },
      { id: 'GB-IN-GBP-INR', score: 0.05, expectedTier: 'tier3' },
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
    expect(result.get('US-MX-USD-MXN')?.tier).toBe('tier1')
    expect(result.get('US-PH-USD-PHP')?.tier).toBe('tier2')
    expect(result.get('GB-IN-GBP-INR')?.tier).toBe('tier3')
  })
})

