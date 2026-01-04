import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import {
  FxRateHistoryRepository,
  FxRateRepository,
  LatestQuoteRepository,
} from '../repositories'

const logger = createLogger('plane-a.rates')

const planeAPool = getPool(config.db.planeAUrl)
const fxRateRepository = new FxRateRepository(planeAPool)
const fxRateHistoryRepository = new FxRateHistoryRepository(planeAPool)
const latestQuoteRepository = new LatestQuoteRepository(planeAPool)

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

export const ratesRoutes = async (app: FastifyInstance) => {
  app.get('/rates/spot', async (request, reply) => {
    const parsed = pairSchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()

    try {
      const record = await fxRateRepository.getRateRecord(base, quote)
      if (!record || record.rate === null || record.rate === undefined) {
        reply.code(404)
        return { error: 'rate_unavailable', base, quote }
      }

      const updatedAt = toIsoString(record.last_updated ?? record.updated_at)

      return {
        rate: Number(record.rate),
        updatedAt,
        base,
        quote,
      }
    } catch (error) {
      logger.error('spot_rate_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/rates/providers', async (request, reply) => {
    const parsed = providersSchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const maxAgeHours = parsed.data.maxAgeHours ?? 24

    try {
      const [midMarketRate, latestQuotes] = await Promise.all([
        fxRateRepository.getRate(base, quote),
        latestQuoteRepository.listLatestByCurrencyPair(base, quote, maxAgeHours),
      ])

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
      }
    } catch (error) {
      logger.error('provider_rates_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/rates/history', async (request, reply) => {
    const parsed = historySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30
    const startDate = parsed.data.startDate
    const endDate = parsed.data.endDate

    try {
      const rows = startDate && endDate
        ? await fxRateHistoryRepository.getHistory(base, quote, startDate, endDate)
        : await fxRateHistoryRepository.getLatestHistory(base, quote, days)

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
      }
    } catch (error) {
      logger.error('rate_history_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/rates/exchange/:base/:quote', async (request, reply) => {
    const parsed = historySchema.safeParse({
      ...request.params,
      ...request.query,
    })
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30

    try {
      const result = await fxRateRepository.getRateWithHistory(base, quote, days)
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
      }
    } catch (error) {
      logger.error('exchange_rate_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/rates/exchange/:base/:quote/history', async (request, reply) => {
    const parsed = historySchema.safeParse({
      ...request.params,
      ...request.query,
    })
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const base = parsed.data.base.toUpperCase()
    const quote = parsed.data.quote.toUpperCase()
    const days = parsed.data.days ?? config.fxRates?.historyDays ?? 30
    const startDate = parsed.data.startDate
    const endDate = parsed.data.endDate

    try {
      const rows = startDate && endDate
        ? await fxRateHistoryRepository.getHistory(base, quote, startDate, endDate)
        : await fxRateHistoryRepository.getLatestHistory(base, quote, days)

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
      }
    } catch (error) {
      logger.error('exchange_rate_history_failed', {
        base,
        quote,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
