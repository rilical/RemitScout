import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { parseCorridorId } from '../../../shared/corridor'
import { createTtlCache } from '../../../shared/cache'
import { getMaxAmount, getMinAmount } from '../../../shared/currency-limits'
import { getProviderMetadata } from '../services/provider-metadata'
import { FxRateRepository } from '../repositories'
import { getErrorMessage, getErrorStack } from '../types/errors'

const logger = createLogger('plane-a.bank-vs-specialist')
const planeAPool = getPool(config.db.planeAUrl)
const fxRateRepository = new FxRateRepository(planeAPool)

const CORRIDOR_ID = 'US-MX-USD-MXN'
const DEFAULT_AMOUNT = 500
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const WELLS_FARGO_PROVIDER_KEY = 'wellsfargo'

const bankVsSpecialistCache = createTtlCache<BankVsSpecialistResponse>({
  namespace: 'plane_a:bank_vs_specialist',
})

const querySchema = z.object({
  amount: z.coerce.number().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

type QuoteRow = {
  provider_id: string
  display_name: string
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  payin: string
  payout: string
  collected_at: string | Date | null
}

type ProviderQuote = {
  id: string
  name: string
  logoUrl?: string
  fee: number
  marginPct: number
  fxRate: number
  recipientGets: number
  delivery: string
  reliability: number
  methods: Array<'bank' | 'cash' | 'wallet' | 'airtime'>
  bestFor: string
}

type BankVsSpecialistPayload = {
  corridor: {
    from: string
    to: string
    sendCurrency: string
    recvCurrency: string
  }
  midRate: number
  bank: Omit<ProviderQuote, 'id'>
  top: ProviderQuote
  updatedAt: string
  savings?: {
    amount: number
    recipientGetsDifference: number
    percentage: number
  }
}

type BankVsSpecialistResponse = {
  data: BankVsSpecialistPayload
  updatedAt: string
}

const formatTransferTime = (minMinutes: number | null, maxMinutes: number | null) => {
  if (minMinutes === null && maxMinutes === null) {
    return 'Unknown'
  }
  if (minMinutes === null) minMinutes = maxMinutes || 0
  if (maxMinutes === null) maxMinutes = minMinutes

  const minHrs = Math.round(minMinutes / 60)
  const maxHrs = Math.round(maxMinutes / 60)

  if (minHrs === 0 && maxHrs === 0) {
    return 'Instant'
  }
  if (minHrs === maxHrs) {
    return `${minHrs} ${minHrs === 1 ? 'hour' : 'hours'}`
  }
  return `${minHrs}-${maxHrs} ${maxHrs === 1 ? 'hour' : 'hours'}`
}

const mapPayoutMethod = (payout: string): 'bank' | 'cash' | 'wallet' | 'airtime' => {
  const normalized = payout.toLowerCase()
  if (normalized.includes('cash')) return 'cash'
  if (normalized.includes('airtime')) return 'airtime'
  if (normalized.includes('wallet')) return 'wallet'
  return 'bank'
}

const getBestFor = (method: 'bank' | 'cash' | 'wallet' | 'airtime') => {
  if (method === 'cash') return 'Fast cash pickup'
  if (method === 'wallet') return 'Mobile wallet delivery'
  if (method === 'airtime') return 'Airtime top up'
  return 'Bank deposit'
}

const parseNumeric = (value: number | string | null | undefined, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeProviderKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const computeRecipientGets = (row: QuoteRow, amount: number) => {
  const sendAmount = amount
  const feeAmount = parseNumeric(row.promotional_fee_amount, parseNumeric(row.fee_amount, 0))
  
  // Prioritize promotional_rate over implied_fx_rate for accurate calculations
  let fxRate = parseNumeric(row.promotional_rate, parseNumeric(row.implied_fx_rate, 0))
  
  // If rate is missing or invalid, try to calculate it from receive_amount and send_amount
  if (!Number.isFinite(fxRate) || fxRate <= 0) {
    const storedSendAmount = parseNumeric(row.send_amount, 0)
    const storedReceiveAmount = parseNumeric(row.receive_amount, 0)
    const storedFeeAmount = parseNumeric(row.promotional_fee_amount, parseNumeric(row.fee_amount, 0))
    
    // If we have both send_amount and receive_amount, calculate the rate
    if (storedSendAmount > 0 && storedReceiveAmount > 0 && storedSendAmount > storedFeeAmount) {
      fxRate = storedReceiveAmount / (storedSendAmount - storedFeeAmount)
    }
    
    // If amounts match exactly, use the stored receive_amount directly
    if (Math.abs(storedSendAmount - amount) < 0.01 && storedReceiveAmount > 0) {
      return storedReceiveAmount
    }
    
    // If we still don't have a valid rate, return 0
    if (!Number.isFinite(fxRate) || fxRate <= 0) {
      return 0
    }
  }
  
  // Calculate using rate: (sendAmount - fee) * rate
  // This matches how Remitly calculates: send amount minus fee, then apply rate
  return Math.max(0, (sendAmount - feeAmount) * fxRate)
}

const isWellsFargo = (row: QuoteRow) => {
  const id = normalizeProviderKey(row.provider_id)
  return id.startsWith(WELLS_FARGO_PROVIDER_KEY)
}

const isBankProvider = (row: QuoteRow) => {
  if (isWellsFargo(row)) return true
  const metadata = getProviderMetadata(row.provider_id)
  return metadata?.type === 'BANK'
}

const buildProviderQuote = (
  row: QuoteRow,
  amount: number,
  midRate: number | null,
): ProviderQuote => {
  const metadata = getProviderMetadata(row.provider_id)
  const name = metadata?.displayName ?? row.display_name ?? row.provider_id
  const id = metadata?.id ?? row.provider_id
  const sendAmount = parseNumeric(row.send_amount, amount)
  // Use promotional_fee_amount when available (discounted fee), otherwise use regular fee
  const fee = parseNumeric(row.promotional_fee_amount, parseNumeric(row.fee_amount, 0))
  
  // Calculate recipient gets first (this handles fallback to receive_amount)
  const recipientGets = computeRecipientGets(row, amount)
  
  // Calculate fxRate: prioritize promotional_rate, then implied_fx_rate, then calculate from receive_amount
  let fxRate = parseNumeric(row.promotional_rate, parseNumeric(row.implied_fx_rate, 0))
  
  // If rate is still missing, try to calculate it from stored receive_amount and send_amount
  if ((!fxRate || fxRate <= 0) && recipientGets > 0 && sendAmount > fee) {
    fxRate = recipientGets / (sendAmount - fee)
  }
  
  // If still missing, try calculating from stored values in the database row
  if ((!fxRate || fxRate <= 0)) {
    const storedSendAmount = parseNumeric(row.send_amount, 0)
    const storedReceiveAmount = parseNumeric(row.receive_amount, 0)
    const storedFeeAmount = parseNumeric(row.promotional_fee_amount, parseNumeric(row.fee_amount, 0))
    
    if (storedSendAmount > 0 && storedReceiveAmount > 0 && storedSendAmount > storedFeeAmount) {
      fxRate = storedReceiveAmount / (storedSendAmount - storedFeeAmount)
    }
  }
  
  // Final fallback to 0 if still no valid rate
  if (!fxRate || fxRate <= 0 || !Number.isFinite(fxRate)) {
    fxRate = 0
  }
  
  const marginPct = midRate && midRate > 0 && fxRate > 0
    ? Math.max(0, ((midRate - fxRate) / midRate) * 100)
    : 0
  const method = mapPayoutMethod(row.payout)
  const reliability = metadata?.scoreBreakdown?.reliability
    ?? (metadata?.remitScore ? metadata.remitScore / 10 : 0.8)

  return {
    id,
    name,
    logoUrl: metadata?.logo?.sm,
    fee,
    marginPct: Math.abs(marginPct),
    fxRate,
    recipientGets,
    delivery: formatTransferTime(row.delivery_time_min_minutes, row.delivery_time_max_minutes),
    reliability: Math.min(1, Math.max(0, reliability)),
    methods: [method],
    bestFor: getBestFor(method),
  }
}

export const bankVsSpecialistRoutes = async (app: FastifyInstance) => {
  app.get('/bank-vs-specialist', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const amount = parsed.data.amount ?? DEFAULT_AMOUNT
    if (!Number.isFinite(amount) || amount <= 0) {
      reply.code(400)
      return { error: 'bad_request', message: 'amount must be positive' }
    }

    const minAmount = getMinAmount('USD')
    const maxAmount = getMaxAmount('USD')
    if (amount < minAmount) {
      reply.code(400)
      return { error: 'bad_request', message: `amount must be >= ${minAmount} USD` }
    }
    if (amount > maxAmount) {
      reply.code(400)
      return { error: 'bad_request', message: `amount must be <= ${maxAmount} USD` }
    }

    const amountBucket = computeBucketSelection(amount).bucket_used
    const cacheKey = `bank-vs-specialist:v2:${amountBucket}`
    const cached = await bankVsSpecialistCache.get(cacheKey)
    if (cached) {
      logger.debug('bank_vs_specialist_cache_hit', { cache_key: cacheKey })
      return cached
    }

    try {
      const rows = await query<QuoteRow>(
        `SELECT lqp.provider_id,
                COALESCE(p.display_name, lqp.provider_id) AS display_name,
                lqp.send_amount,
                lqp.fee_amount,
                lqp.promotional_fee_amount,
                lqp.receive_amount,
                lqp.implied_fx_rate,
                lqp.promotional_rate,
                lqp.delivery_time_min_minutes,
                lqp.delivery_time_max_minutes,
                lqp.payin,
                lqp.payout,
                lqp.collected_at
           FROM silver.latest_quote_by_provider lqp
           JOIN silver.provider p ON p.provider_id = lqp.provider_id
          WHERE lqp.corridor_id = $1
            AND lqp.amount_bucket = $2
            AND lqp.status = 'ok'`,
        [CORRIDOR_ID, amountBucket],
        planeAPool,
      )

      if (!rows.rows.length) {
        reply.code(503)
        return { error: 'quotes_unavailable', message: 'No quotes available for corridor' }
      }

      const bestByProvider = new Map<string, QuoteRow>()
      for (const row of rows.rows) {
        const current = bestByProvider.get(row.provider_id)
        if (!current) {
          bestByProvider.set(row.provider_id, row)
          continue
        }
        if (computeRecipientGets(row, amount) > computeRecipientGets(current, amount)) {
          bestByProvider.set(row.provider_id, row)
        }
      }

      const candidates = Array.from(bestByProvider.values())
      const bankRow = candidates.find(isWellsFargo)
      if (!bankRow) {
        reply.code(503)
        return { error: 'bank_quote_unavailable', message: 'Wells Fargo quote unavailable' }
      }

      const specialistRows = candidates.filter(row => !isBankProvider(row))
      if (specialistRows.length === 0) {
        reply.code(503)
        return { error: 'specialist_quote_unavailable', message: 'No specialist providers available' }
      }

      let topRow = specialistRows[0]
      for (const row of specialistRows.slice(1)) {
        if (computeRecipientGets(row, amount) > computeRecipientGets(topRow, amount)) {
          topRow = row
        }
      }

      const corridorParts = parseCorridorId(CORRIDOR_ID)
      if (!corridorParts) {
        reply.code(500)
        return { error: 'internal_error', message: 'Invalid corridor configuration' }
      }

      let midRate: number | null = null
      try {
        midRate = await fxRateRepository.getRate(
          corridorParts.sourceCurrency,
          corridorParts.destCurrency,
        )
      } catch (error) {
        logger.warn('bank_vs_specialist_mid_rate_failed', {
          error: getErrorMessage(error),
        })
      }

      if (!midRate || midRate <= 0) {
        midRate = parseNumeric(bankRow.implied_fx_rate, parseNumeric(topRow.implied_fx_rate, 0))
      }

      const bankQuote = buildProviderQuote(bankRow, amount, midRate)
      const topQuote = buildProviderQuote(topRow, amount, midRate)
      const bankName = isWellsFargo(bankRow)
        ? 'Wells Fargo'
        : getProviderMetadata(bankRow.provider_id)?.displayName
          ?? bankRow.display_name
          ?? 'Your bank'

      const { id: _ignoredId, name: _ignoredName, ...bankPayload } = bankQuote
      const updatedAtValue = [bankRow.collected_at, topRow.collected_at]
        .map((value) => (value ? new Date(value).getTime() : 0))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0]
      const updatedAt = updatedAtValue ? new Date(updatedAtValue).toISOString() : new Date().toISOString()

      const bankTotalCost = midRate && midRate > 0
        ? bankQuote.fee + Math.max(0, (midRate - bankQuote.fxRate) * amount)
        : null
      const topTotalCost = midRate && midRate > 0
        ? topQuote.fee + Math.max(0, (midRate - topQuote.fxRate) * amount)
        : null
      const savingsAmount = bankTotalCost !== null && topTotalCost !== null
        ? bankTotalCost - topTotalCost
        : 0
      const savingsPct = bankTotalCost && bankTotalCost > 0
        ? (savingsAmount / bankTotalCost) * 100
        : 0

      const payload: BankVsSpecialistPayload = {
        corridor: {
          from: corridorParts.sourceCountry,
          to: corridorParts.destCountry,
          sendCurrency: corridorParts.sourceCurrency,
          recvCurrency: corridorParts.destCurrency,
        },
        midRate: midRate ?? 0,
        bank: {
          ...bankPayload,
          name: bankName,
        },
        top: topQuote,
        updatedAt,
        savings: {
          amount: Number.isFinite(savingsAmount) ? savingsAmount : 0,
          recipientGetsDifference: topQuote.recipientGets - bankQuote.recipientGets,
          percentage: Number.isFinite(savingsPct) ? savingsPct : 0,
        },
      }

      const response: BankVsSpecialistResponse = {
        data: payload,
        updatedAt,
      }

      await bankVsSpecialistCache.set(cacheKey, response, CACHE_TTL_MS)

      logger.info('bank_vs_specialist_success', {
        corridor_id: CORRIDOR_ID,
        amount_bucket: amountBucket,
        bank_provider: bankRow.provider_id,
        top_provider: topRow.provider_id,
      })

      return response
    } catch (error: unknown) {
      logger.error('bank_vs_specialist_failed', {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to compute comparison' }
    }
  })
}
