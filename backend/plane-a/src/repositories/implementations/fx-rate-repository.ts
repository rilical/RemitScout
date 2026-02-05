import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { createLogger } from '../../../../shared/logger'
import { fxRateCache } from '../../../../shared/repository-cache'
import { recordRepositoryMetric } from '../../../../shared/repository-metrics'
import { withRetry, withCircuitBreaker } from '../../../../shared/repository-retry'
import { config } from '../../../../shared/config'
import { formatError, isError } from '../../../../shared/utils/error-handling'
import type {
  FxRateInput,
  FxRateRecord,
  FxRateWithHistory,
  IFxRateRepository,
} from '../interfaces/fx-rate-repository.interface'
import { FxRateHistoryRepository } from './fx-rate-history-repository'
import { OandaRateFetcher } from '../../services/oanda-rate-fetcher'

const logger = createLogger('plane-a.fx-rate-repository')

export class FxRateRepository implements IFxRateRepository {
  private oandaFetcher: OandaRateFetcher | null = null
  private readonly historyRepository: FxRateHistoryRepository

  constructor(private readonly pool: Pool) {
    this.historyRepository = new FxRateHistoryRepository(pool)
  }

  private getOandaFetcher(): OandaRateFetcher {
    if (!this.oandaFetcher) {
      this.oandaFetcher = new OandaRateFetcher(this.pool)
    }
    return this.oandaFetcher
  }

  async upsertRate(input: FxRateInput): Promise<void> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      await withCircuitBreaker('fx-rate', async () => {
        await withRetry(async () => {
          await query(
            `INSERT INTO gold.fx_rates (base_currency, quote_currency, rate, bid, ask, source, last_updated)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
               rate = EXCLUDED.rate,
               bid = EXCLUDED.bid,
               ask = EXCLUDED.ask,
               source = EXCLUDED.source,
               last_updated = EXCLUDED.last_updated,
               updated_at = NOW()`,
            [
              input.baseCurrency,
              input.quoteCurrency,
              input.rate,
              input.bid ?? null,
              input.ask ?? null,
              input.source ?? 'OANDA',
              input.lastUpdated ?? new Date(),
            ],
            this.pool,
          )
        })
      })

      await fxRateCache.invalidate(`${input.baseCurrency}:${input.quoteCurrency}`)

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

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null> {
    const startTime = Date.now()
    const cacheKey = `${baseCurrency}:${quoteCurrency}`
    let success = false
    let errorType: string | undefined

    try {
      const cached = await fxRateCache.get<number>(cacheKey)
      if (cached !== null) {
        return cached
      }

      const record = await this.getRateRecord(baseCurrency, quoteCurrency)
      const normalizedRate = this.normalizeRate(record?.rate)
      if (normalizedRate === null) {
        return null
      }

      const ttlSeconds = config.fxRates?.cacheTtlSeconds ?? 300
      await fxRateCache.set(cacheKey, normalizedRate, ttlSeconds)
      success = true
      return normalizedRate
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

  async getRateRecord(baseCurrency: string, quoteCurrency: string): Promise<FxRateRecord | null> {
    const startTime = Date.now()
    let success = false
    let errorType: string | undefined

    try {
      const result = await withCircuitBreaker('fx-rate', async () => {
        return await withRetry(async () => {
          return await query<FxRateRecord>(
            `SELECT base_currency, quote_currency, rate, bid, ask, source, last_updated, updated_at
             FROM gold.fx_rates
             WHERE base_currency = $1 AND quote_currency = $2
             ORDER BY last_updated DESC
             LIMIT 1`,
            [baseCurrency, quoteCurrency],
            this.pool,
          )
        })
      })

      const row = result.rows[0] ?? null
      const freshnessHours = config.fxRates?.dbFreshnessHours ?? 1
      const lastUpdated = row?.last_updated ? new Date(row.last_updated).getTime() : 0
      const isStale = lastUpdated > 0
        ? Date.now() - lastUpdated > freshnessHours * 60 * 60 * 1000
        : true

      if ((row === null || isStale) && this.shouldUseOandaFallback()) {
        logger.info('rate_missing_or_stale_fetching_oanda', {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          stale: isStale,
        })
        try {
          const fetcher = this.getOandaFetcher()
          const fetchResult = await fetcher.fetchRate(baseCurrency, quoteCurrency, false, {
            maxWaitMs: config.fxRates?.oandaFallbackMaxWaitMs,
            source: 'plane-a',
          })
          if (fetchResult.success && fetchResult.data) {
            await this.upsertRate({
              baseCurrency,
              quoteCurrency,
              rate: fetchResult.data.rate,
              bid: fetchResult.data.bid,
              ask: fetchResult.data.ask,
              source: fetchResult.data.source,
              lastUpdated: fetchResult.data.last_updated,
            })

            success = true
            return {
              base_currency: fetchResult.data.base_currency,
              quote_currency: fetchResult.data.quote_currency,
              rate: fetchResult.data.rate,
              bid: fetchResult.data.bid,
              ask: fetchResult.data.ask,
              source: fetchResult.data.source,
              last_updated: fetchResult.data.last_updated,
              updated_at: fetchResult.data.last_updated,
            }
          }
        } catch (error) {
          logger.warn('oanda_fallback_failed', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      success = true
      return row
    } catch (error: unknown) {
      const { message } = formatError(error)
      errorType = isError(error) ? error.code || 'unknown' : 'unknown'
      logger.error('fx_rate_record_get_failed', {
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
    const current = await this.getRateRecord(baseCurrency, quoteCurrency)
    const history = await this.historyRepository.getLatestHistory(baseCurrency, quoteCurrency, days)
    const cached = false
    return { current, history, cached }
  }

  private shouldUseOandaFallback(): boolean {
    if (config.fxRates?.refreshEnabled) {
      return false
    }
    return config.fxRates?.oandaFallbackEnabled ?? false
  }

  private normalizeRate(rate: unknown): number | null {
    if (rate === null || rate === undefined) {
      return null
    }
    const numeric = typeof rate === 'string' ? Number(rate) : rate
    if (typeof numeric !== 'number' || !Number.isFinite(numeric)) {
      return null
    }
    return numeric
  }
}
