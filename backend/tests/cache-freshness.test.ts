import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { VolatilityService } from '../plane-b/src/services/volatility-service'

describe('Cache Freshness Integration', () => {
  let pool: Pool
  let volatilityService: VolatilityService
  const corridorIds = ['US-AR-USD-ARS', 'GB-NG-GBP-NGN', 'CA-AU-CAD-AUD']

  const ensureProvider = async (providerId: string) => {
    await pool.query(
      `INSERT INTO silver.provider (provider_id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (provider_id) DO NOTHING`,
      [providerId, providerId],
    )
  }

  const ensureCorridor = async (corridorId: string) => {
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
    pool = createPool(config.db.planeBUrl)
    volatilityService = new VolatilityService(pool)

    await pool.query(
      'DELETE FROM silver.latest_quote_by_provider WHERE corridor_id = ANY($1::text[])',
      [corridorIds],
    )
    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = ANY($1::text[])',
      [corridorIds],
    )
  })

  afterEach(async () => {
    await pool.query(
      'DELETE FROM silver.latest_quote_by_provider WHERE corridor_id = ANY($1::text[])',
      [corridorIds],
    )
    await pool.query(
      'DELETE FROM silver.corridor_volatility_cache WHERE corridor_id = ANY($1::text[])',
      [corridorIds],
    )
    await pool.end()
  })

  const checkQuoteFreshness = async (
    corridorId: string,
    amountBucket: number,
    payinMethod: string,
    payoutMethod: string,
    providerId: string,
  ) => {
    const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)

    const result = await query<{
      collected_at: Date | null
    }>(
      `SELECT collected_at
       FROM silver.latest_quote_by_provider
       WHERE corridor_id = $1
         AND amount_bucket = $2
         AND payin = $3
         AND payout = $4
         AND provider_id = $5
       ORDER BY collected_at DESC
       LIMIT 1`,
      [corridorId, amountBucket, payinMethod, payoutMethod, providerId],
      pool,
    )

    if (result.rows.length === 0) {
      return { exists: false, isFresh: false, ageSeconds: null, ttlSeconds: ttlResult.ttlSeconds }
    }

    const collectedAt = result.rows[0].collected_at
    if (!collectedAt) {
      return { exists: false, isFresh: false, ageSeconds: null, ttlSeconds: ttlResult.ttlSeconds }
    }

    const ageSeconds = Math.floor((Date.now() - new Date(collectedAt).getTime()) / 1000)
    const isFresh = ageSeconds <= ttlResult.ttlSeconds

    return { exists: true, isFresh, ageSeconds, ttlSeconds: ttlResult.ttlSeconds }
  }

  it('detects fresh quote for tier1 corridor (30 min TTL)', async () => {
    const corridorId = 'US-AR-USD-ARS'
    const providerId = 'remitly'

    await ensureProvider(providerId)
    await ensureCorridor(corridorId)

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.20, 20, 18.0, 3.6],
    )

    await pool.query(
      `INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '10 minutes', $6, $7, $8, $9, $10, $11)`,
      [corridorId, 100, 'debit_card', 'bank_deposit', providerId, 100, 2, 102, 1800, 18.0, 'ok'],
    )

    const freshness = await checkQuoteFreshness(
      corridorId,
      100,
      'debit_card',
      'bank_deposit',
      'remitly',
    )

    expect(freshness.exists).toBe(true)
    expect(freshness.isFresh).toBe(true)
    expect(freshness.ageSeconds).toBeLessThan(30 * 60)
    expect(freshness.ttlSeconds).toBe(30 * 60)
  })

  it('detects stale quote for tier1 corridor', async () => {
    const corridorId = 'US-AR-USD-ARS'
    const providerId = 'remitly'

    await ensureProvider(providerId)
    await ensureCorridor(corridorId)

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.20, 20, 18.0, 3.6],
    )

    await pool.query(
      `INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '45 minutes', $6, $7, $8, $9, $10, $11)`,
      [corridorId, 100, 'debit_card', 'bank_deposit', providerId, 100, 2, 102, 1800, 18.0, 'ok'],
    )

    const freshness = await checkQuoteFreshness(
      corridorId,
      100,
      'debit_card',
      'bank_deposit',
      'remitly',
    )

    expect(freshness.exists).toBe(true)
    expect(freshness.isFresh).toBe(false)
    expect(freshness.ageSeconds).toBeGreaterThan(30 * 60)
    expect(freshness.ttlSeconds).toBe(30 * 60)
  })

  it('detects fresh quote for tier3 corridor (4 hour TTL)', async () => {
    const corridorId = 'GB-NG-GBP-NGN'
    const providerId = 'wise'

    await ensureProvider(providerId)
    await ensureCorridor(corridorId)

    await pool.query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [corridorId, 0.05, 20, 105.0, 5.25],
    )

    await pool.query(
      `INSERT INTO silver.latest_quote_by_provider
       (corridor_id, amount_bucket, payin, payout, provider_id, collected_at, send_amount, fee_amount, total_debit_amount, receive_amount, implied_fx_rate, status)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 hours', $6, $7, $8, $9, $10, $11)`,
      [corridorId, 100, 'debit_card', 'bank_deposit', providerId, 100, 2, 102, 10500, 105.0, 'ok'],
    )

    const freshness = await checkQuoteFreshness(
      corridorId,
      100,
      'debit_card',
      'bank_deposit',
      'wise',
    )

    expect(freshness.exists).toBe(true)
    expect(freshness.isFresh).toBe(true)
    expect(freshness.ageSeconds).toBeLessThan(4 * 60 * 60)
    expect(freshness.ttlSeconds).toBe(4 * 60 * 60)
  })

  it('returns not fresh when quote does not exist', async () => {
    const corridorId = 'CA-AU-CAD-AUD'

    const freshness = await checkQuoteFreshness(
      corridorId,
      100,
      'debit_card',
      'bank_deposit',
      'remitly',
    )

    expect(freshness.exists).toBe(false)
    expect(freshness.isFresh).toBe(false)
    expect(freshness.ttlSeconds).toBe(2 * 60 * 60)
  })
})
