import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { createLogger } from '../../../../shared/logger'
import { fxRateHistoryCache } from '../../../../shared/repository-cache'
import { recordRepositoryMetric } from '../../../../shared/repository-metrics'
import { withRetry, withCircuitBreaker } from '../../../../shared/repository-retry'
import { formatError, isError } from '../../../../shared/utils/error-handling'
import { config } from '../../../../shared/config'
import type {
  FxRateHistoryInput,
  FxRateHistoryRecord,
  IFxRateHistoryRepository,
} from '../interfaces/fx-rate-history-repository.interface'

const logger = createLogger('plane-a.fx-rate-history-repository')

const normalizeDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return value
}

export class FxRateHistoryRepository implements IFxRateHistoryRepository {
  constructor(private readonly pool: Pool) {}

  async getHistory(
    baseCurrency: string,
    quoteCurrency: string,
    startDate: string,
    endDate: string,
  ): Promise<FxRateHistoryRecord[]> {
    const startTime = Date.now()
    const cacheKey = `${baseCurrency}:${quoteCurrency}:${startDate}:${endDate}`
    let success = false
    let errorType: string | undefined

    try {
      const cached = await fxRateHistoryCache.get<FxRateHistoryRecord[]>(cacheKey)
      if (cached) {
        return cached
      }

      const result = await withCircuitBreaker('fx-rate-history', async () => {
        return await withRetry(async () => {
          return await query<FxRateHistoryRecord>(
            `SELECT base_currency, quote_currency, rate, bid, ask, rate_date, source, created_at
             FROM gold.fx_rate_history
             WHERE base_currency = $1
               AND quote_currency = $2
               AND rate_date >= $3::date
               AND rate_date <= $4::date
             ORDER BY rate_date ASC`,
            [baseCurrency, quoteCurrency, startDate, endDate],
            this.pool,
          )
        })
      })

      const records = result.rows
      const ttlSeconds = config.fxRates?.historyCacheTtlSeconds ?? 3600
      await fxRateHistoryCache.set(cacheKey, records, ttlSeconds)

      success = true
      return records
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
      await recordRepositoryMetric('fx-rate-history', 'get', durationMs, success, errorType)
    }
  }

  async getLatestHistory(
    baseCurrency: string,
    quoteCurrency: string,
    days: number,
  ): Promise<FxRateHistoryRecord[]> {
    const startTime = Date.now()
    const cacheKey = `latest:${baseCurrency}:${quoteCurrency}:${days}`
    let success = false
    let errorType: string | undefined

    try {
      const cached = await fxRateHistoryCache.get<FxRateHistoryRecord[]>(cacheKey)
      if (cached) {
        return cached
      }

      const result = await withCircuitBreaker('fx-rate-history', async () => {
        return await withRetry(async () => {
          return await query<FxRateHistoryRecord>(
            `SELECT base_currency, quote_currency, rate, bid, ask, rate_date, source, created_at
             FROM gold.fx_rate_history
             WHERE base_currency = $1
               AND quote_currency = $2
               AND rate_date >= (CURRENT_DATE - $3::int)
             ORDER BY rate_date ASC`,
            [baseCurrency, quoteCurrency, days],
            this.pool,
          )
        })
      })

      const records = result.rows
      const ttlSeconds = config.fxRates?.historyCacheTtlSeconds ?? 3600
      await fxRateHistoryCache.set(cacheKey, records, ttlSeconds)

      success = true
      return records
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_history_latest_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        days,
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate-history', 'get', durationMs, success, errorType)
    }
  }

  async upsertHistory(records: FxRateHistoryInput[]): Promise<void> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      if (records.length === 0) {
        success = true
        return
      }

      const baseCurrencies = records.map((record) => record.baseCurrency)
      const quoteCurrencies = records.map((record) => record.quoteCurrency)
      const rates = records.map((record) => record.rate)
      const bids = records.map((record) => record.bid ?? null)
      const asks = records.map((record) => record.ask ?? null)
      const dates = records.map((record) => normalizeDate(record.rateDate))
      const sources = records.map((record) => record.source ?? 'OANDA')

      await withCircuitBreaker('fx-rate-history', async () => {
        await withRetry(async () => {
          await query(
            `INSERT INTO gold.fx_rate_history
              (base_currency, quote_currency, rate, bid, ask, rate_date, source)
             SELECT * FROM UNNEST(
              $1::text[],
              $2::text[],
              $3::numeric[],
              $4::numeric[],
              $5::numeric[],
              $6::date[],
              $7::text[]
             )
             ON CONFLICT (base_currency, quote_currency, rate_date) DO UPDATE SET
               rate = EXCLUDED.rate,
               bid = EXCLUDED.bid,
               ask = EXCLUDED.ask,
               source = EXCLUDED.source,
               created_at = NOW()`,
            [baseCurrencies, quoteCurrencies, rates, bids, asks, dates, sources],
            this.pool,
          )
        })
      })

      const uniquePairs = new Set(records.map((record) => `${record.baseCurrency}:${record.quoteCurrency}`))
      for (const pair of uniquePairs) {
        await fxRateHistoryCache.invalidatePattern(`${pair}:*`)
      }

      success = true
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_history_upsert_failed', {
        error: message,
      })
      throw error
    } finally {
      const durationMs = Date.now() - startTime
      await recordRepositoryMetric('fx-rate-history', 'upsert', durationMs, success, errorType)
    }
  }
}
