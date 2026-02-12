import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { ValidationError } from '../../../shared/errors'
import { getMaxAmount, getMinAmount } from '../../../shared/currency-limits'
import { getCountryByCode, isCurrencyAllowedForCountry } from '../../../shared/countries-currencies'
import { isWiseDestinationCurrency, isWiseSourceCurrency } from '../../../shared/provider-currencies'

const logger = createLogger('plane-a.corridor-limits')
const planeAPool = getPool(config.db.planeAUrl)

const MAX_AGE_SECONDS = Math.max(0, config.planeA.b2c.maxQuoteAgeSeconds ?? 0)

const querySchema = z.object({
  from: z.string().min(2).max(2),
  to: z.string().min(2).max(2),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
})

const normalizeCountry = (value: string) => value.trim().toUpperCase()
const normalizeCurrency = (value: string) => value.trim().toUpperCase()

const normalizeAmount = (amount: number): number | null => {
  if (!Number.isFinite(amount)) return null
  if (amount >= 1000) return Math.round(amount / 100) * 100
  if (amount >= 100) return Math.round(amount / 10) * 10
  if (amount >= 10) return Math.round(amount)
  return Math.round(amount * 100) / 100
}

const clampToFixedLimits = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return value
  if (value < min) return min
  if (value > max) return max
  return value
}

const isCurrencyAllowedForRequest = (
  countryCode: string,
  currency: string,
  direction: 'source' | 'destination',
) => {
  if (isCurrencyAllowedForCountry(countryCode, currency)) return true
  return direction === 'source'
    ? isWiseSourceCurrency(currency)
    : isWiseDestinationCurrency(currency)
}

export const corridorLimitsRoutes = async (app: FastifyInstance) => {
  app.get('/corridor-limits', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError(
        'from, to, fromCurrency, and toCurrency are required.',
        { details: parsed.error.issues },
      )
    }

    const from = normalizeCountry(parsed.data.from)
    const to = normalizeCountry(parsed.data.to)
    const fromCurrency = normalizeCurrency(parsed.data.fromCurrency)
    const toCurrency = normalizeCurrency(parsed.data.toCurrency)
    const corridorId = `${from}-${to}-${fromCurrency}-${toCurrency}`

    const fromCountry = getCountryByCode(from)
    const toCountry = getCountryByCode(to)
    if (!fromCountry || !toCountry) {
      throw new ValidationError('invalid country codes')
    }
    if (!isCurrencyAllowedForRequest(fromCountry.code, fromCurrency, 'source')) {
      throw new ValidationError('invalid fromCurrency')
    }
    if (!isCurrencyAllowedForRequest(toCountry.code, toCurrency, 'destination')) {
      throw new ValidationError('invalid toCurrency')
    }

    try {
      const params: Array<string | number> = [corridorId]
      const ageClause = MAX_AGE_SECONDS > 0
        ? 'AND collected_at >= NOW() - ($2 * INTERVAL \'1 second\')'
        : ''
      if (MAX_AGE_SECONDS > 0) {
        params.push(MAX_AGE_SECONDS)
      }

      const result = await query<{
        min_amount: number | null
        max_amount: number | null
        distinct_count: string | number | null
      }>(
        `SELECT MIN(send_amount::double precision) AS min_amount,
                MAX(send_amount::double precision) AS max_amount,
                COUNT(DISTINCT send_amount)::int AS distinct_count
         FROM silver.latest_quote_by_provider
         WHERE corridor_id = $1
           AND status = 'ok'
           AND send_amount IS NOT NULL
           AND send_amount > 0
           ${ageClause}`,
        params,
        planeAPool,
      )

      const row = result.rows[0]
      const distinctCount = Number(row?.distinct_count ?? 0)
      const observedMin = Number(row?.min_amount)
      const observedMax = Number(row?.max_amount)

      const fixedMin = getMinAmount(fromCurrency)
      const fixedMax = getMaxAmount(fromCurrency)

      let minAmount: number | null = fixedMin
      let maxAmount: number | null = fixedMax
      let source: 'observed' | 'observed_single' | 'fixed' = 'fixed'
      const strict = true

      if (distinctCount >= 2 && Number.isFinite(observedMin) && Number.isFinite(observedMax)) {
        const normalizedMin = normalizeAmount(observedMin)
        const normalizedMax = normalizeAmount(observedMax)
        minAmount = clampToFixedLimits(normalizedMin ?? fixedMin, fixedMin, fixedMax)
        maxAmount = clampToFixedLimits(normalizedMax ?? fixedMax, fixedMin, fixedMax)
        source = 'observed'
      } else if (distinctCount === 1 && Number.isFinite(observedMin)) {
        const normalizedMin = normalizeAmount(observedMin)
        minAmount = clampToFixedLimits(normalizedMin ?? fixedMin, fixedMin, fixedMax)
        maxAmount = fixedMax
        source = 'observed_single'
      }

      if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
        minAmount = fixedMin
        maxAmount = fixedMax
        source = 'fixed'
      }

      return {
        corridorId,
        from,
        to,
        fromCurrency,
        toCurrency,
        minAmount,
        maxAmount,
        source,
        strict,
      }
    } catch (error: unknown) {
      logger.warn('corridor_limits_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to load corridor limits.' }
    }
  })
}
