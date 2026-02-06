import type { FastifyInstance } from 'fastify'
import type Stripe from 'stripe'
import { createLogger } from '../../../../shared/logger'
import { config } from '../../../../shared/config'
import { getStripeClient, isStripeConfigured } from '../../services/stripe-client'
import { getErrorMessage } from '../../types/errors'

const logger = createLogger('plane-a.billing.pricing')

type PricingPayload = {
  success: true
  configured: boolean
  trialDays: number
  plus: {
    month: { amount: number | null; currency: string | null; priceId: string | null }
    year: { amount: number | null; currency: string | null; priceId: string | null }
  }
}

const CACHE_TTL_MS = 60 * 60 * 1000
let cached: { expiresAt: number; payload: PricingPayload } | null = null

const toAmount = (unitAmount: Stripe.Price['unit_amount']) => {
  if (typeof unitAmount !== 'number' || !Number.isFinite(unitAmount)) return null
  return unitAmount / 100
}

const toCurrency = (currency: Stripe.Price['currency']) => {
  if (!currency) return null
  return currency.toUpperCase()
}

const fetchPrice = async (stripe: Stripe, priceId: string) => {
  try {
    const price = await stripe.prices.retrieve(priceId)
    return {
      amount: toAmount(price.unit_amount),
      currency: toCurrency(price.currency),
      priceId,
    }
  } catch (error: unknown) {
    logger.warn('stripe_price_fetch_failed', {
      price_id: priceId,
      error: getErrorMessage(error),
    })
    return { amount: null, currency: null, priceId }
  }
}

export const billingPricingRoutes = async (app: FastifyInstance) => {
  app.get('/billing/pricing', async (_request, _reply): Promise<PricingPayload> => {
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload
    }

    const trialDays = config.billing.stripe.trialDays
    const priceIdMonth = config.billing.stripe.priceIdPlus || null
    const priceIdYear = config.billing.stripe.priceIdPlusAnnual || null

    if (!isStripeConfigured() || !priceIdMonth) {
      const payload: PricingPayload = {
        success: true,
        configured: false,
        trialDays,
        plus: {
          month: { amount: null, currency: null, priceId: priceIdMonth },
          year: { amount: null, currency: null, priceId: priceIdYear },
        },
      }
      cached = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
      return payload
    }

    const stripe = getStripeClient()
    const [month, year] = await Promise.all([
      fetchPrice(stripe, priceIdMonth),
      priceIdYear ? fetchPrice(stripe, priceIdYear) : Promise.resolve({ amount: null, currency: null, priceId: null }),
    ])

    const payload: PricingPayload = {
      success: true,
      configured: true,
      trialDays,
      plus: {
        month,
        year,
      },
    }
    cached = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
    return payload
  })
}

