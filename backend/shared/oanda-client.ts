import type { Pool } from 'pg'
import { createLogger } from './logger'
import { query } from './db'
import { config } from './config'
import { fxRateHistoryCache } from './repository-cache'
import { mapOandaCurrencyPair } from './oanda-code-map'
import { computeBackoffMs, getOandaTokenBucket, parseRetryAfterMs, sleep } from './oanda-cache'
import { toBoolean } from './oanda-transform'

const logger = createLogger('shared.oanda-rate-fetcher')

const OANDA_API_URL = 'https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies'
const RATE_LIMIT_STATUSES = new Set([429, 502, 503, 504])
const DEFAULT_HEADERS = {
  'Pragma': 'no-cache',
  'Accept': 'application/json, text/plain, */*',
  'Sec-Fetch-Site': 'same-site',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Mode': 'cors',
  'Origin': 'https://www.oanda.com',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15',
  'Referer': 'https://www.oanda.com/',
  'Sec-Fetch-Dest': 'empty',
  'Priority': 'u=3, i',
}

type OandaFetchOptions = {
  maxWaitMs?: number
  source?: string
}

export type OandaRateData = {
  base_currency: string
  quote_currency: string
  rate: number
  bid: number | null
  ask: number | null
  source: string
  last_updated: Date
}

export type OandaHistoricalRate = {
  date: string
  rate: number
  bid: number
  ask: number
}

export type OandaFetchResult = {
  success: boolean
  data: OandaRateData | null
  historical_rates: OandaHistoricalRate[]
  cached: boolean
  error?: string
}

export class OandaRateFetcher {
  private readonly useAuthenticatedApi: boolean
  private readonly apiKey?: string

  constructor(
    private readonly pool: Pool,
    useAuthenticatedApi: boolean = false,
    apiKey?: string,
  ) {
    this.useAuthenticatedApi = useAuthenticatedApi || toBoolean(process.env.OANDA_USE_AUTHENTICATED_API)
    this.apiKey = apiKey || process.env.OANDA_API_KEY
  }

  async fetchRate(
    baseCurrency: string,
    quoteCurrency: string,
    useCache: boolean = true,
    options: OandaFetchOptions = {},
  ): Promise<OandaFetchResult> {
    const mapped = mapOandaCurrencyPair(baseCurrency, quoteCurrency)
    const base = mapped.base
    const quote = mapped.quote

    if (!base || !quote) {
      logger.warn('oanda_currency_unmapped', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
      })
      return {
        success: false,
        data: null,
        historical_rates: [],
        cached: false,
        error: 'Invalid currency codes for OANDA',
      }
    }

    if (base === quote) {
      return {
        success: true,
        data: {
          base_currency: base,
          quote_currency: quote,
          rate: 1.0,
          bid: 1.0,
          ask: 1.0,
          source: 'IDENTITY',
          last_updated: new Date(),
        },
        historical_rates: [],
        cached: false,
      }
    }

    if (useCache) {
      const cached = await this.getCachedRate(base, quote)
      if (cached) {
        return {
          success: true,
          data: cached.data,
          historical_rates: cached.historical_rates,
          cached: true,
        }
      }
    }

    if (this.useAuthenticatedApi && this.apiKey) {
      return this.fetchFromAuthenticatedApi(base, quote, options)
    }

    return this.fetchFromPublicApi(base, quote, options)
  }

  private async getCachedRate(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<{ data: OandaRateData; historical_rates: OandaHistoricalRate[] } | null> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const result = await query<{
        base_currency: string
        quote_currency: string
        rate: number
        bid: number | null
        ask: number | null
        source: string
        last_updated: Date
      }>(
        `SELECT base_currency, quote_currency, rate, bid, ask, source, last_updated
         FROM gold.fx_rates
         WHERE base_currency = $1 AND quote_currency = $2 AND last_updated >= $3
         ORDER BY last_updated DESC
         LIMIT 1`,
        [baseCurrency, quoteCurrency, oneHourAgo],
        this.pool,
      )

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      const historicalRates = await this.getHistoricalRates(baseCurrency, quoteCurrency)

      return {
        data: {
          base_currency: row.base_currency,
          quote_currency: row.quote_currency,
          rate: Number(row.rate),
          bid: row.bid ? Number(row.bid) : null,
          ask: row.ask ? Number(row.ask) : null,
          source: row.source,
          last_updated: row.last_updated,
        },
        historical_rates: historicalRates,
      }
    } catch (error) {
      logger.warn('cache_lookup_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  private async fetchFromPublicApi(
    baseCurrency: string,
    quoteCurrency: string,
    options: OandaFetchOptions = {},
  ): Promise<OandaFetchResult> {
    const today = new Date().toISOString().split('T')[0]
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const url = `${OANDA_API_URL}?base=${baseCurrency}&quote=${quoteCurrency}&data_type=chart&start_date=${oneMonthAgo}&end_date=${today}`

    const startedAt = Date.now()
    const maxRetries = Math.max(0, config.fxRates?.oandaRateLimitMaxRetries ?? 3)

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        logger.info('fetching_from_oanda', {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          url,
          attempt,
          source: options.source ?? 'unknown',
        })

        try {
          await getOandaTokenBucket().acquireToken(1, options.maxWaitMs)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.warn('oanda_rate_limit_wait_failed', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            error: message,
            source: options.source ?? 'unknown',
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        const response = await fetch(url, {
          headers: DEFAULT_HEADERS,
          signal: AbortSignal.timeout(10000),
        })

        if (RATE_LIMIT_STATUSES.has(response.status)) {
          if (attempt >= maxRetries) {
            logger.warn('oanda_rate_limit_exhausted', {
              status: response.status,
              base_currency: baseCurrency,
              quote_currency: quoteCurrency,
              source: options.source ?? 'unknown',
            })
            return this.getFallbackRate(baseCurrency, quoteCurrency)
          }

          const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
          const backoffMs = computeBackoffMs(attempt, retryAfterMs)
          if (Number.isFinite(options.maxWaitMs) && options.maxWaitMs !== undefined) {
            const elapsedMs = Date.now() - startedAt
            if (elapsedMs + backoffMs > options.maxWaitMs) {
              logger.warn('oanda_rate_limit_budget_exhausted', {
                status: response.status,
                base_currency: baseCurrency,
                quote_currency: quoteCurrency,
                backoff_ms: backoffMs,
                max_wait_ms: options.maxWaitMs,
                source: options.source ?? 'unknown',
              })
              return this.getFallbackRate(baseCurrency, quoteCurrency)
            }
          }

          logger.info('oanda_rate_limit_backoff', {
            status: response.status,
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            backoff_ms: backoffMs,
            attempt,
            source: options.source ?? 'unknown',
          })
          await sleep(backoffMs)
          continue
        }

        if (response.status !== 200) {
          logger.warn('oanda_api_error', {
            status: response.status,
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        const text = await response.text()
        if (!text.trim()) {
          logger.warn('oanda_empty_response', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        let data: { response?: Array<{ average_bid?: string | number; average_ask?: string | number; close_time?: string }> }
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          logger.warn('oanda_json_parse_failed', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            response_preview: text.substring(0, 100),
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        if (!data?.response || !Array.isArray(data.response) || data.response.length === 0) {
          logger.warn('oanda_empty_response_data', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            data_keys: Object.keys(data || {}),
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        const rateEntry = data.response[0]
        const bid = parseFloat(String(rateEntry?.average_bid || '0'))
        const ask = parseFloat(String(rateEntry?.average_ask || '0'))

        if (bid === 0 && ask === 0) {
          logger.warn('oanda_zero_rates', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            rate_entry: rateEntry,
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        let midRate: number
        if (bid > 0 && ask > 0) {
          midRate = (bid + ask) / 2
        } else {
          midRate = bid > 0 ? bid : ask
        }

        const historicalRates: OandaHistoricalRate[] = []
        for (const entry of data.response) {
          try {
            const entryBid = parseFloat(String(entry?.average_bid || '0'))
            const entryAsk = parseFloat(String(entry?.average_ask || '0'))
            const closeTime = entry?.close_time
            if (!closeTime || Number.isNaN(entryBid) || Number.isNaN(entryAsk)) {
              continue
            }
            const rateDate = new Date(closeTime).toISOString().split('T')[0]
            const entryRate = entryBid > 0 && entryAsk > 0 ? (entryBid + entryAsk) / 2 : entryBid || entryAsk
            historicalRates.push({
              date: rateDate,
              rate: entryRate,
              bid: entryBid,
              ask: entryAsk,
            })
          } catch (entryError) {
            logger.warn('oanda_historical_entry_error', {
              base_currency: baseCurrency,
              quote_currency: quoteCurrency,
              error: entryError instanceof Error ? entryError.message : String(entryError),
            })
          }
        }

        const rateData: OandaRateData = {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          rate: midRate,
          bid: bid || null,
          ask: ask || null,
          source: 'OANDA',
          last_updated: new Date(),
        }

        await this.saveRate(rateData)
        await this.storeHistory(baseCurrency, quoteCurrency, historicalRates, rateData.source)

        logger.info('oanda_rate_fetched', {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          rate: midRate,
          historical_count: historicalRates.length,
        })

        return {
          success: true,
          data: rateData,
          historical_rates: historicalRates,
          cached: false,
        }
      }
    } catch (error) {
      logger.error('oanda_fetch_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return this.getFallbackRate(baseCurrency, quoteCurrency)
    }

    return this.getFallbackRate(baseCurrency, quoteCurrency)
  }

  private async fetchFromAuthenticatedApi(
    baseCurrency: string,
    quoteCurrency: string,
    options: OandaFetchOptions = {},
  ): Promise<OandaFetchResult> {
    logger.info('fetching_from_authenticated_api', {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
    })

    if (!this.apiKey) {
      logger.warn('oanda_api_key_missing', {
        message: 'Authenticated API requested but API key not provided',
      })
      return this.fetchFromPublicApi(baseCurrency, quoteCurrency)
    }

    const startedAt = Date.now()
    const maxRetries = Math.max(0, config.fxRates?.oandaRateLimitMaxRetries ?? 3)

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const url = `https://api-fxtrade.oanda.com/v3/accounts/${this.apiKey}/instruments/${baseCurrency}_${quoteCurrency}/candles`

        try {
          await getOandaTokenBucket().acquireToken(1, options.maxWaitMs)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.warn('oanda_rate_limit_wait_failed', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            error: message,
            source: options.source ?? 'unknown',
          })
          return this.getFallbackRate(baseCurrency, quoteCurrency)
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (RATE_LIMIT_STATUSES.has(response.status)) {
          if (attempt >= maxRetries) {
            logger.warn('oanda_rate_limit_exhausted', {
              status: response.status,
              base_currency: baseCurrency,
              quote_currency: quoteCurrency,
              source: options.source ?? 'unknown',
            })
            return this.fetchFromPublicApi(baseCurrency, quoteCurrency, options)
          }

          const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
          const backoffMs = computeBackoffMs(attempt, retryAfterMs)
          if (Number.isFinite(options.maxWaitMs) && options.maxWaitMs !== undefined) {
            const elapsedMs = Date.now() - startedAt
            if (elapsedMs + backoffMs > options.maxWaitMs) {
              logger.warn('oanda_rate_limit_budget_exhausted', {
                status: response.status,
                base_currency: baseCurrency,
                quote_currency: quoteCurrency,
                backoff_ms: backoffMs,
                max_wait_ms: options.maxWaitMs,
                source: options.source ?? 'unknown',
              })
              return this.getFallbackRate(baseCurrency, quoteCurrency)
            }
          }

          logger.info('oanda_rate_limit_backoff', {
            status: response.status,
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
            backoff_ms: backoffMs,
            attempt,
            source: options.source ?? 'unknown',
          })
          await sleep(backoffMs)
          continue
        }

        if (response.status !== 200) {
          logger.warn('oanda_authenticated_api_error', {
            status: response.status,
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
          })
          return this.fetchFromPublicApi(baseCurrency, quoteCurrency, options)
        }

        const data = await response.json()

        if (!data?.candles || data.candles.length === 0) {
          logger.warn('oanda_authenticated_empty_data', {
            base_currency: baseCurrency,
            quote_currency: quoteCurrency,
          })
          return this.fetchFromPublicApi(baseCurrency, quoteCurrency, options)
        }

        const latestCandle = data.candles[data.candles.length - 1]
        const midRate = (parseFloat(latestCandle.mid.c) + parseFloat(latestCandle.mid.c)) / 2
        const bid = parseFloat(latestCandle.bid.c)
        const ask = parseFloat(latestCandle.ask.c)

        const rateData: OandaRateData = {
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          rate: midRate,
          bid,
          ask,
          source: 'OANDA_AUTH',
          last_updated: new Date(),
        }

        await this.saveRate(rateData)
        await this.storeHistory(baseCurrency, quoteCurrency, [
          {
            date: new Date().toISOString().split('T')[0],
            rate: midRate,
            bid: bid || midRate,
            ask: ask || midRate,
          },
        ], rateData.source)

        return {
          success: true,
          data: rateData,
          historical_rates: [],
          cached: false,
        }
      }
    } catch (error) {
      logger.error('oanda_authenticated_fetch_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
      })
      return this.fetchFromPublicApi(baseCurrency, quoteCurrency, options)
    }

    return this.fetchFromPublicApi(baseCurrency, quoteCurrency, options)
  }

  private async getFallbackRate(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<OandaFetchResult> {
    logger.info('using_fallback_rate', {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
    })

    try {
      const result = await query<{
        base_currency: string
        quote_currency: string
        rate: number
        bid: number | null
        ask: number | null
        source: string
        last_updated: Date
      }>(
        `SELECT base_currency, quote_currency, rate, bid, ask, source, last_updated
         FROM gold.fx_rates
         WHERE base_currency = $1 AND quote_currency = $2
         ORDER BY last_updated DESC
         LIMIT 1`,
        [baseCurrency, quoteCurrency],
        this.pool,
      )

      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
          historical_rates: [],
          cached: false,
          error: 'No rate data available',
        }
      }

      const row = result.rows[0]
      const historicalRates = await this.getHistoricalRates(baseCurrency, quoteCurrency)

      return {
        success: true,
        data: {
          base_currency: row.base_currency,
          quote_currency: row.quote_currency,
          rate: Number(row.rate),
          bid: row.bid ? Number(row.bid) : null,
          ask: row.ask ? Number(row.ask) : null,
          source: `${row.source} (fallback)`,
          last_updated: row.last_updated,
        },
        historical_rates: historicalRates,
        cached: false,
      }
    } catch (error) {
      logger.error('fallback_rate_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        success: false,
        data: null,
        historical_rates: [],
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async saveRate(rateData: OandaRateData): Promise<void> {
    try {
      await query(
        `INSERT INTO gold.fx_rates (base_currency, quote_currency, rate, bid, ask, source, last_updated, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
         ON CONFLICT (base_currency, quote_currency)
         DO UPDATE SET
           rate = EXCLUDED.rate,
           bid = EXCLUDED.bid,
           ask = EXCLUDED.ask,
           source = EXCLUDED.source,
           last_updated = EXCLUDED.last_updated,
           updated_at = EXCLUDED.updated_at`,
        [
          rateData.base_currency,
          rateData.quote_currency,
          rateData.rate,
          rateData.bid,
          rateData.ask,
          rateData.source,
          rateData.last_updated,
        ],
        this.pool,
      )
    } catch (error) {
      logger.warn('save_rate_failed', {
        base_currency: rateData.base_currency,
        quote_currency: rateData.quote_currency,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private async getHistoricalRates(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<OandaHistoricalRate[]> {
    try {
      const days = config.fxRates?.historyDays ?? 30
      const cacheKey = `latest:${baseCurrency}:${quoteCurrency}:${days}`
      const cached = await fxRateHistoryCache.get<{
        base_currency: string
        quote_currency: string
        rate: number
        bid: number | null
        ask: number | null
        rate_date: Date | string
        source: string | null
        created_at: Date
      }[]>(cacheKey)

      const records = cached ?? (await query<{
        base_currency: string
        quote_currency: string
        rate: number
        bid: number | null
        ask: number | null
        rate_date: Date | string
        source: string | null
        created_at: Date
      }>(
        `SELECT base_currency, quote_currency, rate, bid, ask, rate_date, source, created_at
         FROM gold.fx_rate_history
         WHERE base_currency = $1
           AND quote_currency = $2
           AND rate_date >= (CURRENT_DATE - $3::int)
         ORDER BY rate_date ASC
         LIMIT $4`,
        [baseCurrency, quoteCurrency, days, 100000],
        this.pool,
      )).rows

      if (!cached) {
        await fxRateHistoryCache.set(cacheKey, records, config.fxRates?.historyCacheTtlSeconds ?? 3600)
      }

      return records.map((row) => {
        const rate = Number(row.rate)
        const bid = row.bid !== null && row.bid !== undefined ? Number(row.bid) : rate * 0.999
        const ask = row.ask !== null && row.ask !== undefined ? Number(row.ask) : rate * 1.001
        const date = row.rate_date instanceof Date
          ? row.rate_date.toISOString().split('T')[0]
          : String(row.rate_date)
        return {
          date,
          rate,
          bid,
          ask,
        }
      })
    } catch (error) {
      logger.warn('historical_rates_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  private async storeHistory(
    baseCurrency: string,
    quoteCurrency: string,
    historicalRates: OandaHistoricalRate[],
    source: string,
  ): Promise<void> {
    if (historicalRates.length === 0) return
    try {
      const baseCurrencies = historicalRates.map(() => baseCurrency)
      const quoteCurrencies = historicalRates.map(() => quoteCurrency)
      const rates = historicalRates.map((rate) => rate.rate)
      const bids = historicalRates.map((rate) => rate.bid)
      const asks = historicalRates.map((rate) => rate.ask)
      const dates = historicalRates.map((rate) => rate.date)
      const sources = historicalRates.map(() => source)

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

      await fxRateHistoryCache.invalidatePattern(`latest:${baseCurrency}:${quoteCurrency}:*`)
      await fxRateHistoryCache.invalidatePattern(`${baseCurrency}:${quoteCurrency}:*`)
    } catch (error) {
      logger.warn('historical_rates_store_failed', {
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
