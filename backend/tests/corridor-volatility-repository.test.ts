import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { CorridorVolatilityRepository } from '../plane-b/src/repositories/implementations/corridor-volatility-repository'

describe('CorridorVolatilityRepository', () => {
  let pool: Pool
  let repo: CorridorVolatilityRepository

  beforeEach(async () => {
    pool = createPool(config.db.planeBUrl)
    repo = new CorridorVolatilityRepository(pool)

    await pool.query('DELETE FROM silver.corridor_volatility_cache')
    await pool.query('DELETE FROM silver.quote_record')
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.corridor_volatility_cache')
    await pool.query('DELETE FROM silver.quote_record')
    await pool.end()
  })

  it('returns null when corridor has no quote data', async () => {
    const result = await repo.calculateVolatilityScore('US-MX-USD-MXN')
    expect(result).toBeNull()
  })

  it('returns null when corridor has less than 10 samples', async () => {
    const corridorId = 'US-MX-USD-MXN'
    const baseRate = 18.0

    for (let i = 0; i < 5; i++) {
      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} days', NOW(), gen_random_uuid(), $12)`,
        ['remitly', corridorId, 100, 'debit_card', 'bank_deposit', 100, 2, 102, baseRate * 100, baseRate, 'ok', `bronze:${i}`],
      )
    }

    const result = await repo.calculateVolatilityScore(corridorId)
    expect(result).toBeNull()
  })

  it('calculates volatility score correctly with sufficient data', async () => {
    const corridorId = 'US-MX-USD-MXN'
    const baseRate = 18.0

    for (let i = 0; i < 15; i++) {
      const rateVariation = (Math.random() - 0.5) * 0.5
      const rate = baseRate + rateVariation

      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} days', NOW(), gen_random_uuid(), $12)`,
        ['remitly', corridorId, 100, 'debit_card', 'bank_deposit', 100, 2, 102, rate * 100, rate, 'ok', `bronze:${i}`],
      )
    }

    const result = await repo.calculateVolatilityScore(corridorId)
    expect(result).not.toBeNull()
    expect(result?.corridor_id).toBe(corridorId)
    expect(result?.volatility_score).toBeGreaterThanOrEqual(0)
    expect(result?.volatility_score).toBeLessThanOrEqual(1)
    expect(result?.sample_count).toBeGreaterThanOrEqual(10)
    expect(result?.mean_rate).toBeGreaterThan(0)
    expect(result?.stddev_rate).toBeGreaterThanOrEqual(0)
  })

  it('caches volatility score after calculation', async () => {
    const corridorId = 'US-MX-USD-MXN'
    const baseRate = 18.0

    for (let i = 0; i < 15; i++) {
      const rate = baseRate + (Math.random() - 0.5) * 0.5
      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} days', NOW(), gen_random_uuid(), $12)`,
        ['remitly', corridorId, 100, 'debit_card', 'bank_deposit', 100, 2, 102, rate * 100, rate, 'ok', `bronze:${i}`],
      )
    }

    const calculated = await repo.calculateVolatilityScore(corridorId)
    expect(calculated).not.toBeNull()

    const cached = await repo.getVolatilityScore(corridorId)
    expect(cached).not.toBeNull()
    expect(cached?.corridor_id).toBe(corridorId)
    expect(cached?.volatility_score).toBe(calculated?.volatility_score)
  })

  it('returns cached score when available', async () => {
    const corridorId = 'US-MX-USD-MXN'

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.12, 20, 18.0, 2.16],
    )

    const result = await repo.getVolatilityScore(corridorId)
    expect(result).not.toBeNull()
    expect(result?.corridor_id).toBe(corridorId)
    expect(result?.volatility_score).toBe(0.12)
    expect(result?.sample_count).toBe(20)
  })

  it('handles multiple corridors in getVolatilityScores', async () => {
    const corridors = ['US-MX-USD-MXN', 'US-PH-USD-PHP', 'GB-IN-GBP-INR']

    for (const corridorId of corridors) {
      await pool.query(
        `INSERT INTO silver.corridor_volatility_cache
         (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [corridorId, 0.10, 15, 18.0, 1.8],
      )
    }

    const result = await repo.getVolatilityScores(corridors)
    expect(result.size).toBe(3)
    expect(result.get('US-MX-USD-MXN')).not.toBeUndefined()
    expect(result.get('US-PH-USD-PHP')).not.toBeUndefined()
    expect(result.get('GB-IN-GBP-INR')).not.toBeUndefined()
  })
})

