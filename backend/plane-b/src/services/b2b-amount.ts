import type { Pool } from 'pg'

import { normalizeAmountBucket } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { FIXED_EXCHANGE_RATES } from '../../../shared/currency-limits'
import { createLogger } from '../../../shared/logger'
import { B2B_FIXED_AMOUNT_USD } from '../../../shared/macro-corridors'
import { FxRateRepository } from '../repositories/implementations/fx-rate-repository'

const logger = createLogger('plane-b.b2b-amount')

export const buildB2bAmountResolver = (pool: Pool) => {
  const fxRepo = new FxRateRepository(pool)
  const rateCache = new Map<string, number | null>()
  const missingRates = new Set<string>()

  const getUsdToCurrencyRate = async (currency: string): Promise<number | null> => {
    const code = currency.toUpperCase()
    if (code === 'USD') return 1
    if (rateCache.has(code)) return rateCache.get(code) ?? null

    let rate = await fxRepo.getRate('USD', code)
    if (!Number.isFinite(rate ?? Number.NaN)) {
      const inverse = await fxRepo.getRate(code, 'USD')
      if (Number.isFinite(inverse ?? Number.NaN) && (inverse ?? 0) > 0) {
        rate = 1 / Number(inverse)
      } else {
        rate = null
      }
    }

    if (!Number.isFinite(rate ?? Number.NaN) || (rate ?? 0) <= 0) {
      const fixed = FIXED_EXCHANGE_RATES[code]
      rate = Number.isFinite(fixed ?? Number.NaN) && fixed > 0 ? fixed : null
    }

    if (rate === null && !missingRates.has(code)) {
      missingRates.add(code)
      logger.warn('b2b_usd_rate_missing', { currency: code })
    }

    rateCache.set(code, rate)
    return rate
  }

  const resolveAmountForCorridor = async (
    corridorId: string,
    fallbackAmount = B2B_FIXED_AMOUNT_USD,
  ): Promise<number> => {
    const parsed = parseCorridorId(corridorId)
    if (!parsed) {
      return normalizeAmountBucket(fallbackAmount, B2B_FIXED_AMOUNT_USD)
    }
    const rate = await getUsdToCurrencyRate(parsed.sourceCurrency)
    if (!Number.isFinite(rate ?? Number.NaN) || (rate ?? 0) <= 0) {
      return normalizeAmountBucket(fallbackAmount, B2B_FIXED_AMOUNT_USD)
    }
    return normalizeAmountBucket(B2B_FIXED_AMOUNT_USD * Number(rate), fallbackAmount)
  }

  const resolveAmountMap = async (
    corridors: string[],
    fallbackAmount = B2B_FIXED_AMOUNT_USD,
  ): Promise<Map<string, number>> => {
    const result = new Map<string, number>()
    for (const corridorId of corridors) {
      if (!corridorId) continue
      const amount = await resolveAmountForCorridor(corridorId, fallbackAmount)
      result.set(corridorId, amount)
    }
    return result
  }

  return {
    getUsdToCurrencyRate,
    resolveAmountForCorridor,
    resolveAmountMap,
  }
}
