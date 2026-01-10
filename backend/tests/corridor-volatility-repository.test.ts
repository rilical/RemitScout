import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { CorridorVolatilityRepository } from '../plane-b/src/repositories/implementations/corridor-volatility-repository'

describe('CorridorVolatilityRepository', () => {
  let pool: Pool
  let repo: CorridorVolatilityRepository
  let ingestionRunId: string
  let previousOnDemand: string | undefined

  const providerId = 'remitly'
  const corridorId = 'US-PE-USD-PEN'

  const ensureProvider = async () => {
    await pool.query(
      `INSERT INTO silver.provider (provider_id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (provider_id) DO NOTHING`,
      [providerId, providerId],
    )
  }

  const ensureCorridor = async () => {
    const [sourceCountry, destCountry, sourceCurrency, destCurrency] = corridorId.split('-')
    await pool.query(
      `INSERT INTO silver.corridor
       (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO NOTHING`,
      [corridorId, sourceCountry, destCountry, sourceCurrency, destCurrency],
    )
  }

  beforeEach(async () => {
    previousOnDemand = process.env.VOLATILITY_CACHE_ON_DEMAND
    process.env.VOLATILITY_CACHE_ON_DEMAND = '1'
    pool = createPool(config.db.planeBUrl)
    repo = new CorridorVolatilityRepository(pool)

    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = $1',
      [corridorId],
    )
    await pool.query('DELETE FROM silver.quote_record WHERE corridor_id = $1', [corridorId])

    await ensureProvider()
    await ensureCorridor()
    const result = await pool.query<{ run_id: string }>(
      `INSERT INTO silver.ingestion_run (provider_id, collector_type, status)
       VALUES ($1, $2, $3)
       RETURNING run_id`,
      [providerId, 'b2b_sweep', 'success'],
    )
    ingestionRunId = result.rows[0].run_id
  })

  afterEach(async () => {
    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = $1',
      [corridorId],
    )
    await pool.query('DELETE FROM silver.quote_record WHERE corridor_id = $1', [corridorId])
    await pool.end()
    if (previousOnDemand === undefined) {
      delete process.env.VOLATILITY_CACHE_ON_DEMAND
    } else {
      process.env.VOLATILITY_CACHE_ON_DEMAND = previousOnDemand
    }
  })

  it('returns null when corridor has no quote data', async () => {
    const emptyCorridorId = 'US-MX-USD-MXN'
    await pool.query(
      'DELETE FROM silver.quote_record WHERE corridor_id = $1',
      [emptyCorridorId],
    )
    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = $1',
      [emptyCorridorId],
    )

    const result = await repo.calculateVolatilityScore(emptyCorridorId)
    expect(result).toBeNull()
  })

  it('returns null when corridor has less than 10 samples', async () => {
    const baseRate = 18.0

    for (let i = 0; i < 5; i++) {
      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} hours', NOW(), $12, $13)`,
        [
          providerId,
          corridorId,
          100,
          'debit_card',
          'bank_deposit',
          100,
          2,
          102,
          baseRate * 100,
          baseRate,
          'ok',
          ingestionRunId,
          `bronze:${i}`,
        ],
      )
    }

    const result = await repo.calculateVolatilityScore(corridorId)
    expect(result).toBeNull()
  })

  it('calculates volatility score correctly with sufficient data', async () => {
    const baseRate = 18.0

    for (let i = 0; i < 15; i++) {
      const rateVariation = (Math.random() - 0.5) * 0.5
      const rate = baseRate + rateVariation

      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} hours', NOW(), $12, $13)`,
        [
          providerId,
          corridorId,
          100,
          'debit_card',
          'bank_deposit',
          100,
          2,
          102,
          rate * 100,
          rate,
          'ok',
          ingestionRunId,
          `bronze:${i}`,
        ],
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
    const baseRate = 18.0

    for (let i = 0; i < 15; i++) {
      const rate = baseRate + (Math.random() - 0.5) * 0.5
      await pool.query(
        `INSERT INTO silver.quote_record
         (provider_id, corridor_id, amount_bucket, payin, payout, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status, collected_at, ingested_at, ingestion_run_id, bronze_object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${i} hours', NOW(), $12, $13)`,
        [
          providerId,
          corridorId,
          100,
          'debit_card',
          'bank_deposit',
          100,
          2,
          102,
          rate * 100,
          rate,
          'ok',
          ingestionRunId,
          `bronze:${i}`,
        ],
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
    const corridors = ['US-ZA-USD-ZAR', 'US-KR-USD-KRW', 'GB-AU-GBP-AUD']

    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = ANY($1::text[])',
      [corridors],
    )

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
    expect(result.get(corridors[0])).not.toBeUndefined()
    expect(result.get(corridors[1])).not.toBeUndefined()
    expect(result.get(corridors[2])).not.toBeUndefined()
  })
})
