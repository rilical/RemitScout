import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { createLogger } from '../../../../shared/logger'
import { formatError, isError } from '../../../../shared/utils/error-handling'
import { fxRateCache } from '../../../../shared/repository-cache'
import { recordRepositoryMetric } from '../../../../shared/repository-metrics'
import { withRetry, withCircuitBreaker } from '../../../../shared/repository-retry'
import { FxRateHistoryRepository } from './fx-rate-history-repository'
import type {
  FxRateAggregationRow,
  FxRateInput,
  FxRateRecord,
  FxRateWithHistory,
  IFxRateRepository,
} from '../interfaces/fx-rate-repository.interface'

const logger = createLogger('plane-b.fx-rate-repository')

export class FxRateRepository implements IFxRateRepository {
  constructor(private readonly pool: Pool) {}

  async upsertRate(input: FxRateInput): Promise<void> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      await withCircuitBreaker('fx-rate', async () => {
        await withRetry(async () => {
          const providerCount = Number.isFinite(input.providerCount ?? Number.NaN)
            ? Number(input.providerCount)
            : null
          const sampleCount = Number.isFinite(input.sampleCount ?? Number.NaN)
            ? Number(input.sampleCount)
            : null
          const providerUpdatedAt = input.updatedAt ?? new Date()

          const result = await query(
            `UPDATE gold.fx_rates
             SET provider_agg_rate = $3,
                 provider_agg_provider_count = $4,
                 provider_agg_sample_count = $5,
                 provider_agg_updated_at = $6,
                 updated_at = NOW()
             WHERE base_currency = $1 AND quote_currency = $2`,
            [
              input.baseCurrency,
              input.quoteCurrency,
              input.rate,
              providerCount,
              sampleCount,
              providerUpdatedAt,
            ],
            this.pool,
          )

          if (result.rowCount === 0) {
            logger.debug('fx_rate_provider_agg_missing_base', {
              base_currency: input.baseCurrency,
              quote_currency: input.quoteCurrency,
            })
          }
        })
      })

      success = true
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_upsert_failed', {
        base_currency: input.baseCurrency,
        quote_currency: input.quoteCurrency,
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate', 'upsert', durationMs, success, errorType)
    }
  }

  async aggregateFxRates(): Promise<FxRateAggregationRow[]> {
    const startTime = Date.now()
    const cacheKey = 'aggregate'
    let success = false
    let errorType: string | undefined

    try {
      // Check cache first
      const cached = await fxRateCache.get<FxRateAggregationRow[]>(cacheKey)
      if (cached) {
        return cached
      }

      const result = await withCircuitBreaker('fx-rate', async () => {
        return await withRetry(async () => {
          return await query<{
            base_currency: string
            quote_currency: string
            rate: number | string | null
            provider_count: number | string
            sample_count: number | string
          }>(
      `WITH weighted_rates AS (
        SELECT
          c.source_currency AS base_currency,
          c.dest_currency AS quote_currency,
          lqp.implied_fx_rate,
          lqp.send_amount,
          lqp.provider_id,
          CASE
            WHEN ct.corridor_tier = 'tier_1' THEN 1
            WHEN ct.corridor_tier = 'tier_2' THEN 4
            ELSE 24
          END AS freshness_hours
        FROM silver.latest_quote_by_provider lqp
        JOIN silver.corridor c ON c.corridor_id = lqp.corridor_id
        LEFT JOIN silver.corridor_tier ct ON ct.corridor_id = lqp.corridor_id
        JOIN silver.rights_matrix rm ON rm.provider_id = lqp.provider_id
        WHERE lqp.status = 'ok'
          AND rm.allowed_b2c = true
          AND rm.stoplist_status = 'active'
          AND lqp.collected_at >= NOW() - INTERVAL '1 hour' * COALESCE(
            CASE
              WHEN ct.corridor_tier = 'tier_1' THEN 1
              WHEN ct.corridor_tier = 'tier_2' THEN 4
              ELSE 24
            END,
            4
          )
      ),
      aggregated AS (
        SELECT
          base_currency,
          quote_currency,
          SUM(implied_fx_rate * send_amount) / NULLIF(SUM(send_amount), 0) AS weighted_avg_rate,
          COUNT(*) AS sample_count,
          COUNT(DISTINCT provider_id) AS provider_count
        FROM weighted_rates
        GROUP BY base_currency, quote_currency
        HAVING COUNT(DISTINCT provider_id) >= 3
      )
      SELECT
        base_currency,
        quote_currency,
        weighted_avg_rate AS rate,
        provider_count,
        sample_count
      FROM aggregated
      WHERE weighted_avg_rate > 0
      ORDER BY base_currency, quote_currency`,
            [],
            this.pool,
          )
        })
      })

      // Normalize types (convert string numbers to numbers)
      const normalized: FxRateAggregationRow[] = result.rows.map((row) => ({
        base_currency: row.base_currency,
        quote_currency: row.quote_currency,
        rate: typeof row.rate === 'number' ? row.rate : Number(row.rate) || 0,
        provider_count: typeof row.provider_count === 'number' ? row.provider_count : Number(row.provider_count) || 0,
        sample_count: typeof row.sample_count === 'number' ? row.sample_count : Number(row.sample_count) || 0,
      }))

      // Cache result
      await fxRateCache.set(cacheKey, normalized)
      success = true
      return normalized
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_aggregate_failed', { error: message })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate', 'aggregate', durationMs, success, errorType)
    }
  }

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null> {
    const startTime = Date.now()
    const cacheKey = `${baseCurrency}:${quoteCurrency}`
    let success = false
    let errorType: string | undefined

    try {
      // Check cache first
      const cached = await fxRateCache.get<number>(cacheKey)
      if (cached !== null) {
        return cached
      }

      const result = await withCircuitBreaker('fx-rate', async () => {
        return await withRetry(async () => {
          return await query<{ rate: number }>(
            `SELECT rate FROM gold.fx_rates
             WHERE base_currency = $1 AND quote_currency = $2`,
            [baseCurrency, quoteCurrency],
            this.pool,
          )
        })
      })

      const rate = result.rows[0]?.rate ?? null

      // Cache result
      if (rate !== null) {
        await fxRateCache.set(cacheKey, rate)
      }

      success = true
      return rate
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_get_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate', 'get', durationMs, success, errorType)
    }
  }

  async getRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRateRecord[]> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      const result = await withCircuitBreaker('fx-rate', async () => {
        return await withRetry(async () => {
          if (baseCurrency && quoteCurrency) {
            return await query<FxRateRecord>(
              `SELECT base_currency, quote_currency, rate, updated_at
               FROM gold.fx_rates
               WHERE base_currency = $1 AND quote_currency = $2`,
              [baseCurrency, quoteCurrency],
              this.pool,
            )
          } else if (baseCurrency) {
            return await query<FxRateRecord>(
              `SELECT base_currency, quote_currency, rate, updated_at
               FROM gold.fx_rates
               WHERE base_currency = $1`,
              [baseCurrency],
              this.pool,
            )
          } else if (quoteCurrency) {
            return await query<FxRateRecord>(
              `SELECT base_currency, quote_currency, rate, updated_at
               FROM gold.fx_rates
               WHERE quote_currency = $1`,
              [quoteCurrency],
              this.pool,
            )
          } else {
            return await query<FxRateRecord>(
              `SELECT base_currency, quote_currency, rate, updated_at
               FROM gold.fx_rates
               ORDER BY updated_at DESC`,
              [],
              this.pool,
            )
          }
        })
      })

      success = true
      return result.rows
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_get_rates_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate', 'get', durationMs, success, errorType)
    }
  }

  async getRateWithHistory(
    baseCurrency: string,
    quoteCurrency: string,
    days: number,
  ): Promise<FxRateWithHistory> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      const currentRows = await this.getRates(baseCurrency, quoteCurrency)
      const current = currentRows[0] ?? null
      const historyRepository = new FxRateHistoryRepository(this.pool)
      const history = await historyRepository.getLatestHistory(baseCurrency, quoteCurrency, days)

      success = true
      return { current, history }
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_history_get_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate', 'get', durationMs, success, errorType)
    }
  }
}
