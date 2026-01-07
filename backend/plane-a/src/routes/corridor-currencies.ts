import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getCountryByCode } from '../../../shared/countries-currencies'

const logger = createLogger('plane-a.corridor-currencies')
const planeAPool = getPool(config.db.planeAUrl)

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

    try {
      const result = await query<{
        source_currency: string
        dest_currency: string
      }>(
        `SELECT DISTINCT c.source_currency, c.dest_currency
           FROM silver.provider_corridor_capability pcc
           JOIN silver.corridor c ON c.corridor_id = pcc.corridor_id
          WHERE c.source_country = $1
            AND c.dest_country = $2
            AND pcc.is_supported = true`,
        [from, to],
        planeAPool,
      )

      const pairs: CorridorCurrencyPair[] = result.rows
        .filter(row => row.source_currency && row.dest_currency)
        .map(row => ({
          fromCurrency: row.source_currency.toUpperCase(),
          toCurrency: row.dest_currency.toUpperCase(),
        }))

      const fromCurrencies = unique(pairs.map(pair => pair.fromCurrency))
      const toCurrencies = unique(pairs.map(pair => pair.toCurrency))

      const fromFallback = getCountryByCode(from)?.currency
      const toFallback = getCountryByCode(to)?.currency

      const response: CorridorCurrencyResponse = {
        from,
        to,
        fromCurrencies: fromCurrencies.length
          ? fromCurrencies
          : fromFallback
            ? [fromFallback]
            : [],
        toCurrencies: toCurrencies.length
          ? toCurrencies
          : toFallback
            ? [toFallback]
            : [],
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
