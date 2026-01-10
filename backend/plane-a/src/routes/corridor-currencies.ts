import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../shared/logger'
import { getAvailableCurrenciesForCountry, getCountryByCode } from '../../../shared/countries-currencies'

const logger = createLogger('plane-a.corridor-currencies')
const querySchema = z.object({
  from: z.string().min(2).max(2),
  to: z.string().min(2).max(2),
})

type CorridorCurrencyPair = {
  fromCurrency: string
  toCurrency: string
}

type CorridorCurrencyResponse = {
  from: string
  to: string
  fromCurrencies: string[]
  toCurrencies: string[]
  pairs: CorridorCurrencyPair[]
}

const normalizeCountry = (value: string) => value.trim().toUpperCase()

const unique = (values: string[]) => Array.from(new Set(values))

export const corridorCurrenciesRoutes = async (app: FastifyInstance) => {
  app.get('/corridor-currencies', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', message: 'from and to are required.' }
    }

    const from = normalizeCountry(parsed.data.from)
    const to = normalizeCountry(parsed.data.to)

    const fromCountry = getCountryByCode(from)
    const toCountry = getCountryByCode(to)
    if (!fromCountry || !toCountry) {
      reply.code(400)
      return { error: 'bad_request', message: 'Invalid corridor countries.' }
    }

    try {
      const fromCurrencies = getAvailableCurrenciesForCountry(from)
      const toCurrencies = getAvailableCurrenciesForCountry(to)
      const pairs = fromCurrencies.flatMap((fromCurrency) =>
        toCurrencies.map((toCurrency) => ({ fromCurrency, toCurrency })),
      )

      const response: CorridorCurrencyResponse = {
        from,
        to,
        fromCurrencies: unique(fromCurrencies),
        toCurrencies: unique(toCurrencies),
        pairs,
      }

      return response
    } catch (error: unknown) {
      logger.error('corridor_currencies_failed', {
        from,
        to,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to load corridor currencies.' }
    }
  })
}
