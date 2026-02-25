import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { AppError, ValidationError } from '../../../shared/errors'

const logger = createLogger('plane-a.rates')

const pairSchema = z.object({
  base: z.string().min(3).max(3),
  quote: z.string().min(3).max(3),
})

const providersSchema = pairSchema.extend({
  maxAgeHours: z.coerce.number().int().positive().optional(),
})

const historySchema = pairSchema.extend({
  days: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const toIsoString = (value: string | Date | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const formatSpeed = (min: number | null, max: number | null) => {
  if (!min && !max) return 'N/A'
  if (min && max && min !== max) return `${Math.round(min)}-${Math.round(max)} min`
  if (min) return `${Math.round(min)} min`
  if (max) return `${Math.round(max)} min`
  return 'N/A'
}

type RateHistoryPoint = {
  date: string
  rate: number
  bid: number | null
  ask: number | null
  source: string | null
}

type FxRefreshRequestState = {
  status: string
  retryCount: number
  processedAt: string | Date | null
}

const HISTORY_BRIDGE_CURRENCIES = ['USD', 'EUR'] as const
const FX_RATE_REFRESH_EXHAUSTED_RETRY_COUNT = 3
const FX_RATE_REFRESH_FAILURE_COOLDOWN_MS = 15 * 60 * 1000

const toRateDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  const raw = String(value)
  return raw.length >= 10 ? raw.slice(0, 10) : raw
}

const mapHistoryRows = (rows: Array<{
  rate_date: string | Date
  rate: number
  bid: number | null
  ask: number | null
  source: string | null
}>): RateHistoryPoint[] => {
  return rows.map((row) => ({
    date: toRateDate(row.rate_date),
    rate: Number(row.rate),
    bid: row.bid !== null && row.bid !== undefined ? Number(row.bid) : null,
    ask: row.ask !== null && row.ask !== undefined ? Number(row.ask) : null,
    source: row.source ?? null,
  }))
}

const deriveHistoryFromBridge = (
  baseToBridgeRows: Array<{ rate_date: string | Date; rate: number }>,
  bridgeToQuoteRows: Array<{ rate_date: string | Date; rate: number }>,
  bridgeCurrency: 'USD' | 'EUR',
): RateHistoryPoint[] => {
  const baseRatesByDate = new Map<string, number>()
  for (const row of baseToBridgeRows) {
    const rate = Number(row.rate)
    if (!Number.isFinite(rate) || rate <= 0) continue
    baseRatesByDate.set(toRateDate(row.rate_date), rate)
  }

  const derived: RateHistoryPoint[] = []
  for (const row of bridgeToQuoteRows) {
    const rightRate = Number(row.rate)
    if (!Number.isFinite(rightRate) || rightRate <= 0) continue
    const date = toRateDate(row.rate_date)
    const leftRate = baseRatesByDate.get(date)
    if (!leftRate || !Number.isFinite(leftRate) || leftRate <= 0) continue

    derived.push({
      date,
      rate: leftRate * rightRate,
      bid: null,
      ask: null,
      source: `DERIVED_${bridgeCurrency}_BRIDGE`,
    })
  }

  return derived.sort((a, b) => a.date.localeCompare(b.date))
}

const isRecentlyExhaustedFailure = (
  state: FxRefreshRequestState | null,
  nowMs = Date.now(),
) => {
  if (!state) return false
  if ((state.status || '').toLowerCase() !== 'failed') return false
  if ((state.retryCount ?? 0) < FX_RATE_REFRESH_EXHAUSTED_RETRY_COUNT) return false
  if (!state.processedAt) return false
  const processedAtMs = new Date(state.processedAt).getTime()
  if (!Number.isFinite(processedAtMs)) return false
  return nowMs - processedAtMs <= FX_RATE_REFRESH_FAILURE_COOLDOWN_MS
}

const getFxRateStaleness = (
  record: { last_updated?: string | Date | null; updated_at?: string | Date | null } | null,
) => {
  const freshnessHours = config.fxRates?.dbFreshnessHours ?? 1
  const lastUpdated = record?.last_updated ?? record?.updated_at
  if (!lastUpdated) {
    return { stale: true, ageSeconds: null }
  }
  const ageSeconds = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
  return {
    stale: ageSeconds > freshnessHours * 60 * 60,
    ageSeconds,
  }
}

const enqueueFxRateRefreshIfNeeded = async (
  base: string,
  quote: string,
  record: { last_updated?: string | Date | null; updated_at?: string | Date | null } | null,
  fxRateRefreshRepository: FastifyInstance['container']['repositories']['fxRateRefresh'],
) => {
  if (!config.fxRates?.refreshEnabled) {
    return null
  }
  const { stale } = getFxRateStaleness(record)
  if (!stale) {
    return null
  }
  try {
    return await fxRateRefreshRepository.enqueueRequest({
      baseCurrency: base,
      quoteCurrency: quote,
    })
  } catch (error) {
    logger.warn('fx_rate_refresh_enqueue_failed', {
      base,
      quote,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export const ratesRoutes = async (app: FastifyInstance) => {
  const fxRateRepository = app.container.repositories.fxRate
  const fxRateHistoryRepository = app.container.repositories.fxRateHistory
  const fxRateRefreshRepository = app.container.repositories.fxRateRefresh
  const latestQuoteRepository = app.container.repositories.latestQuote

  app.get('/rates/spot', async (request, _reply) => {
    const parsed = pairSchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()

    try {
      const record = await fxRateRepository.getRateRecord(base, quote)
      const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
        base,
        quote,
        record,
        fxRateRefreshRepository,
      )
      if (!record || record.rate === null || record.rate === undefined) {
        throw new AppError('Rate unavailable', {
          statusCode: 404,
          code: 'rate_unavailable',
          details: {
            base,
            quote,
            refreshQueued: Boolean(refreshRequestId),
            refreshRequestId,
          },
        })
      }

      const updatedAt = toIsoString(record.last_updated ?? record.updated_at)
      const { stale, ageSeconds } = getFxRateStaleness(record)

      return {
        rate: Number(record.rate),
        updatedAt,
        base,
        quote,
        stale,
        ageSeconds,
        refreshQueued: Boolean(refreshRequestId),
        refreshRequestId,
      }
    } catch (error) {
      logger.error('spot_rate_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  app.get('/rates/providers', async (request, _reply) => {
    const parsed = providersSchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const maxAgeHours = parsed.data.maxAgeHours ?? 24

    try {
      const [rateRecord, latestQuotes] = await Promise.all([
        fxRateRepository.getRateRecord(base, quote),
        latestQuoteRepository.listLatestByCurrencyPair(base, quote, maxAgeHours),
      ])
      const midMarketRate = rateRecord?.rate !== null && rateRecord?.rate !== undefined
        ? Number(rateRecord.rate)
        : null
      const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
        base,
        quote,
        rateRecord,
        fxRateRefreshRepository,
      )

      const data = latestQuotes
        .filter((quoteRow) => quoteRow.implied_fx_rate !== null && quoteRow.implied_fx_rate !== undefined)
        .map((quoteRow) => {
          const rate = Number(quoteRow.implied_fx_rate ?? 0)
          const markupBps = midMarketRate && midMarketRate > 0 && rate > 0
            ? Math.round(((midMarketRate - rate) / midMarketRate) * 10000)
            : undefined

          return {
            name: quoteRow.provider_name,
            rate,
            markupBps,
            speed: formatSpeed(quoteRow.delivery_time_min_minutes, quoteRow.delivery_time_max_minutes),
            lastUpdated: toIsoString(quoteRow.collected_at),
          }
        })

      return {
        base,
        quote,
        midMarketRate: midMarketRate ?? null,
        data,
        refreshQueued: Boolean(refreshRequestId),
        refreshRequestId,
      }
    } catch (error) {
      logger.error('provider_rates_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  app.get('/rates/history', async (request, _reply) => {
    const parsed = historySchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { details: parsed.error.issues })
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30
    const startDate = parsed.data.startDate
    const endDate = parsed.data.endDate

    try {
      const loadRows = (from: string, to: string) => {
        return startDate && endDate
          ? fxRateHistoryRepository.getHistory(from, to, startDate, endDate)
          : fxRateHistoryRepository.getLatestHistory(from, to, days)
      }

      const [rows, rateRecord] = await Promise.all([
        loadRows(base, quote),
        fxRateRepository.getRateRecord(base, quote),
      ])

      if (rows.length > 0) {
        const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
          base,
          quote,
          rateRecord,
          fxRateRefreshRepository,
        )
        const history = mapHistoryRows(rows)
        const lastUpdated = toIsoString(rows[0].created_at ?? rows[0].rate_date)

        logger.info('rate_history_success', {
          base,
          quote,
          count: history.length,
          source: rows[0]?.source ?? 'unknown',
        })

        return {
          base,
          quote,
          history,
          lastUpdated,
          status: 'ready' as const,
          message: null,
          refreshQueued: Boolean(refreshRequestId),
          refreshRequestId,
          derived: false,
          bridgeCurrency: null,
        }
      }

      if (base !== quote) {
        for (const bridgeCurrency of HISTORY_BRIDGE_CURRENCIES) {
          if (bridgeCurrency === base || bridgeCurrency === quote) continue
          const [baseToBridgeRows, bridgeToQuoteRows] = await Promise.all([
            loadRows(base, bridgeCurrency),
            loadRows(bridgeCurrency, quote),
          ])
          const derivedHistory = deriveHistoryFromBridge(
            baseToBridgeRows,
            bridgeToQuoteRows,
            bridgeCurrency,
          )
          if (derivedHistory.length === 0) continue
          const lastDerivedDate = derivedHistory[derivedHistory.length - 1]?.date ?? null
          return {
            base,
            quote,
            history: derivedHistory,
            lastUpdated: toIsoString(lastDerivedDate),
            status: 'ready' as const,
            message: `Rate history derived via ${bridgeCurrency} bridge while direct pair history is unavailable.`,
            refreshQueued: false,
            refreshRequestId: null,
            derived: true,
            bridgeCurrency,
          }
        }
      }

      logger.warn('rate_history_empty', {
        base,
        quote,
        days,
        startDate,
        endDate,
        message: 'No direct or derived rate history found in database.',
      })

      const refreshEnabled = config.fxRates?.refreshEnabled === true
      if (!refreshEnabled) {
        return {
          base,
          quote,
          history: [],
          lastUpdated: toIsoString(rateRecord?.last_updated ?? rateRecord?.updated_at),
          status: 'unavailable' as const,
          message: 'Rate history is unavailable. FX refresh is currently disabled.',
          refreshQueued: false,
          refreshRequestId: null,
          derived: false,
          bridgeCurrency: null,
        }
      }

      const latestRefreshState = await fxRateRefreshRepository.getLatestRequestByPair(base, quote)
      if (isRecentlyExhaustedFailure(latestRefreshState)) {
        return {
          base,
          quote,
          history: [],
          lastUpdated: toIsoString(rateRecord?.last_updated ?? rateRecord?.updated_at),
          status: 'unavailable' as const,
          message: 'Rate history is unavailable for this corridor right now. Please try again shortly.',
          refreshQueued: false,
          refreshRequestId: null,
          derived: false,
          bridgeCurrency: null,
        }
      }

      const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
        base,
        quote,
        rateRecord,
        fxRateRefreshRepository,
      )
      const refreshQueued = Boolean(refreshRequestId)

      return {
        base,
        quote,
        history: [],
        lastUpdated: toIsoString(rateRecord?.last_updated ?? rateRecord?.updated_at),
        status: 'warming' as const,
        message: refreshQueued
          ? 'Rate history is warming up. Rate sync has been queued.'
          : 'Rate history is warming up. Refresh is pending.',
        refreshQueued,
        refreshRequestId,
        derived: false,
        bridgeCurrency: null,
      }
    } catch (error) {
      logger.error('rate_history_failed', {
        base,
        quote,
        days,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  })

  app.get('/rates/exchange/:base/:quote', async (request, _reply) => {
    const parsed = historySchema.safeParse({
      ...(request.params as Record<string, unknown>),
      ...(request.query as Record<string, unknown>),
    })
    if (!parsed.success) {
      throw new ValidationError('Invalid parameters', { details: parsed.error.issues })
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30

    try {
      const result = await fxRateRepository.getRateWithHistory(base, quote, days)
      const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
        base,
        quote,
        result.current,
        fxRateRefreshRepository,
      )
      const current = result.current
        ? {
            rate: Number(result.current.rate),
            bid: result.current.bid !== null && result.current.bid !== undefined
              ? Number(result.current.bid)
            : null,
            ask: result.current.ask !== null && result.current.ask !== undefined
              ? Number(result.current.ask)
            : null,
            source: result.current.source ?? null,
            lastUpdated: toIsoString(result.current.last_updated ?? result.current.updated_at),
          }
        : null

      const history = result.history.map((row) => ({
        date: row.rate_date instanceof Date
          ? row.rate_date.toISOString().slice(0, 10)
          : String(row.rate_date),
        rate: Number(row.rate),
        bid: row.bid !== null && row.bid !== undefined ? Number(row.bid) : null,
        ask: row.ask !== null && row.ask !== undefined ? Number(row.ask) : null,
        source: row.source ?? null,
      }))

      return {
        base,
        quote,
        current,
        history,
        cached: result.cached,
        refreshQueued: Boolean(refreshRequestId),
        refreshRequestId,
      }
    } catch (error) {
      logger.error('exchange_rate_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })

  app.get('/rates/exchange/:base/:quote/history', async (request, _reply) => {
    const parsed = historySchema.safeParse({
      ...(request.params as Record<string, unknown>),
      ...(request.query as Record<string, unknown>),
    })
    if (!parsed.success) {
      throw new ValidationError('Invalid parameters', { details: parsed.error.issues })
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30
    const startDate = parsed.data.startDate
    const endDate = parsed.data.endDate

    try {
      const rowsPromise = startDate && endDate
        ? fxRateHistoryRepository.getHistory(base, quote, startDate, endDate)
        : fxRateHistoryRepository.getLatestHistory(base, quote, days)
      const [rows, rateRecord] = await Promise.all([
        rowsPromise,
        fxRateRepository.getRateRecord(base, quote),
      ])
      const refreshRequestId = await enqueueFxRateRefreshIfNeeded(
        base,
        quote,
        rateRecord,
        fxRateRefreshRepository,
      )

      const history = rows.map((row) => ({
        date: row.rate_date instanceof Date
          ? row.rate_date.toISOString().slice(0, 10)
          : String(row.rate_date),
        rate: Number(row.rate),
        bid: row.bid !== null && row.bid !== undefined ? Number(row.bid) : null,
        ask: row.ask !== null && row.ask !== undefined ? Number(row.ask) : null,
        source: row.source ?? null,
      }))

      const lastUpdated = rows.length > 0
        ? toIsoString(rows[0].created_at ?? rows[0].rate_date)
        : new Date().toISOString()

      return {
        base,
        quote,
        history,
        lastUpdated,
        refreshQueued: Boolean(refreshRequestId),
        refreshRequestId,
      }
    } catch (error) {
      logger.error('exchange_rate_history_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
}
