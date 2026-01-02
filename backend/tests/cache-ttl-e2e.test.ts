import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { VolatilityService } from '../plane-b/src/services/volatility-service'
import { CorridorVolatilityRepository } from '../plane-b/src/repositories/implementations/corridor-volatility-repository'

describe('Cache TTL End-to-End', () => {
  let pool: Pool
  let volatilityService: VolatilityService
  let volatilityRepo: CorridorVolatilityRepository

  beforeEach(async () => {
    pool = createPool(config.db.planeBUrl)
    volatilityService = new VolatilityService(pool)
    volatilityRepo = new CorridorVolatilityRepository(pool)

    await pool.query('DELETE FROM silver.latest_quote_by_provider')
    await pool.query('DELETE FROM silver.corridor_volatility_cache')
    await pool.query('DELETE FROM silver.quote_record')
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.latest_quote_by_provider')
    await pool.query('DELETE FROM silver.corridor_volatility_cache')
    await pool.query('DELETE FROM silver.quote_record')
    await pool.end()
  })

  it('calculates volatility from quote_record and assigns correct TTL', async () => {
    const corridorId = 'US-MX-USD-MXN'
    const baseRate = 18.0

    for (let i = 0; i < 15; i++) {
      const rateVariation = (Math.random() - 0.5) * 1.0
      const rate = baseRate + rateVariation

      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} days', NOW(), gen_random_uuid(), $12)`,
        ['remitly', corridorId, 100, 'debit_card', 'bank_deposit', 100, 2, 102, rate * 100, rate, 'ok', `bronze:${i}`],
      )
    }

    const calculated = await volatilityRepo.calculateVolatilityScore(corridorId)
    expect(calculated).not.toBeNull()

    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)
    expect(ttlResult.hasData).toBe(true)
    expect(ttlResult.volatilityScore).not.toBeNull()
    expect(['tier1', 'tier2', 'tier3']).toContain(ttlResult.tier)
    expect([30 * 60, 60 * 60, 4 * 60 * 60]).toContain(ttlResult.ttlSeconds)
  })

  it('uses cached volatility score when available', async () => {
    const corridorId = 'US-PH-USD-PHP'

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.12, 20, 55.0, 6.6],
    )

    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)
    expect(ttlResult.hasData).toBe(true)
    expect(ttlResult.volatilityScore).toBe(0.12)
    expect(ttlResult.tier).toBe('tier2')
    expect(ttlResult.ttlSeconds).toBe(60 * 60)
  })

  it('handles quote freshness check with dynamic TTL', async () => {
    const corridorId = 'GB-IN-GBP-INR'

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.05, 20, 105.0, 5.25],
    )

    await pool.query(
      `INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 hour', $6, $7, $8, $9, $10, $11)`,
      [corridorId, 100, 'debit_card', 'bank_deposit', 'wise', 100, 2, 102, 10500, 105.0, 'ok'],
    )

    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)
    expect(ttlResult.tier).toBe('tier3')
    expect(ttlResult.ttlSeconds).toBe(4 * 60 * 60)

    const result = await query<{ collected_at: Date }>(
      `SELECT collected_at
       FROM silver.latest_quote_by_provider
       WHERE corridor_id = $1
         AND amount_bucket = $2
         AND payin = $3
         AND payout = $4
         AND provider_id = $5`,
      [corridorId, 100, 'debit_card', 'bank_deposit', 'wise'],
      pool,
    )

    const ageSeconds = Math.floor(
      (Date.now() - new Date(result.rows[0].collected_at).getTime()) / 1000,
    )
    const isFresh = ageSeconds <= ttlResult.ttlSeconds

    expect(isFresh).toBe(true)
    expect(ageSeconds).toBeLessThan(4 * 60 * 60)
  })
})

