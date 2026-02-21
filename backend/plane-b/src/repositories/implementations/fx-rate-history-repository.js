"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxRateHistoryRepository = void 0;
const db_1 = require("../../../../shared/db");
const logger_1 = require("../../../../shared/logger");
const repository_cache_1 = require("../../../../shared/repository-cache");
const repository_metrics_1 = require("../../../../shared/repository-metrics");
const repository_retry_1 = require("../../../../shared/repository-retry");
const error_handling_1 = require("../../../../shared/utils/error-handling");
const config_1 = require("../../../../shared/config");
const logger = (0, logger_1.createLogger)('plane-b.fx-rate-history-repository');
const normalizeDate = (value) => {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    return value;
};
class FxRateHistoryRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getHistory(baseCurrency, quoteCurrency, startDate, endDate) {
        const startTime = Date.now();
        const cacheKey = `${baseCurrency}:${quoteCurrency}:${startDate}:${endDate}`;
        let success = false;
        let errorType;
        try {
            const cached = await repository_cache_1.fxRateHistoryCache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const result = await (0, repository_retry_1.withCircuitBreaker)('fx-rate-history', async () => {
                return await (0, repository_retry_1.withRetry)(async () => {
                    return await (0, db_1.query)(`SELECT base_currency, quote_currency, rate, bid, ask, rate_date, source, created_at
             FROM gold.fx_rate_history
             WHERE base_currency = $1
               AND quote_currency = $2
               AND rate_date >= $3::date
               AND rate_date <= $4::date
             ORDER BY rate_date ASC`, [baseCurrency, quoteCurrency, startDate, endDate], this.pool);
                });
            });
            const records = result.rows;
            const ttlSeconds = config_1.config.fxRates?.historyCacheTtlSeconds ?? 3600;
            await repository_cache_1.fxRateHistoryCache.set(cacheKey, records, ttlSeconds);
            success = true;
            return records;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('fx_rate_history_get_failed', {
                base_currency: baseCurrency,
                quote_currency: quoteCurrency,
                error: message,
            });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('fx-rate-history', 'get', durationMs, success, errorType);
        }
    }
    async getLatestHistory(baseCurrency, quoteCurrency, days) {
        const startTime = Date.now();
        const cacheKey = `latest:${baseCurrency}:${quoteCurrency}:${days}`;
        let success = false;
        let errorType;
        try {
            const cached = await repository_cache_1.fxRateHistoryCache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const result = await (0, repository_retry_1.withCircuitBreaker)('fx-rate-history', async () => {
                return await (0, repository_retry_1.withRetry)(async () => {
                    return await (0, db_1.query)(`SELECT base_currency, quote_currency, rate, bid, ask, rate_date, source, created_at
             FROM gold.fx_rate_history
             WHERE base_currency = $1
               AND quote_currency = $2
               AND rate_date >= (CURRENT_DATE - $3::int)
             ORDER BY rate_date ASC`, [baseCurrency, quoteCurrency, days], this.pool);
                });
            });
            const records = result.rows;
            const ttlSeconds = config_1.config.fxRates?.historyCacheTtlSeconds ?? 3600;
            await repository_cache_1.fxRateHistoryCache.set(cacheKey, records, ttlSeconds);
            success = true;
            return records;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('fx_rate_history_latest_failed', {
                base_currency: baseCurrency,
                quote_currency: quoteCurrency,
                days,
                error: message,
            });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('fx-rate-history', 'get', durationMs, success, errorType);
        }
    }
    async upsertHistory(records) {
        const startTime = Date.now();
        let success = false;
        let errorType;
        try {
            if (records.length === 0) {
                success = true;
                return;
            }
            const baseCurrencies = records.map((record) => record.baseCurrency);
            const quoteCurrencies = records.map((record) => record.quoteCurrency);
            const rates = records.map((record) => record.rate);
            const bids = records.map((record) => record.bid ?? null);
            const asks = records.map((record) => record.ask ?? null);
            const dates = records.map((record) => normalizeDate(record.rateDate));
            const sources = records.map((record) => record.source ?? 'OANDA');
            await (0, repository_retry_1.withCircuitBreaker)('fx-rate-history', async () => {
                await (0, repository_retry_1.withRetry)(async () => {
                    await (0, db_1.query)(`INSERT INTO gold.fx_rate_history
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
               created_at = NOW()`, [baseCurrencies, quoteCurrencies, rates, bids, asks, dates, sources], this.pool);
                });
            });
            const uniquePairs = new Set(records.map((record) => `${record.baseCurrency}:${record.quoteCurrency}`));
            for (const pair of uniquePairs) {
                await repository_cache_1.fxRateHistoryCache.invalidatePattern(`${pair}:*`);
            }
            success = true;
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            errorType = (0, error_handling_1.isError)(error) ? error.code || 'unknown' : 'unknown';
            logger.error('fx_rate_history_upsert_failed', {
                error: message,
            });
            throw error;
        }
        finally {
            const durationMs = Date.now() - startTime;
            await (0, repository_metrics_1.recordRepositoryMetric)('fx-rate-history', 'upsert', durationMs, success, errorType);
        }
    }
}
exports.FxRateHistoryRepository = FxRateHistoryRepository;
