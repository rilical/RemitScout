import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { computeBucketSelection } from '../../../../shared/amount-bucket'
import { parseCorridorId } from '../../../../shared/corridor'
import { requireAdmin } from '../../plugins/auth-plugin'
import { getProviderMetadata } from '../../services/provider-metadata'

const logger = createLogger('plane-a.ops.providers-explain')
const planeAPool = getPool(config.db.planeAUrl)

type CapabilityRow = {
  provider_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean | null
  source: string | null
  last_verified_at: string | null
}

type LatestQuoteRow = {
  provider_id: string
  payin: string
  payout: string
  collected_at: string | null
}

const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const toAvailableMethod = (value?: string | null): 'bank' | 'cash' | 'wallet' | 'airtime' | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) return 'airtime'
  if (
    token === 'mobile_wallet'
    || token === 'mobile_money'
    || token === 'wallet'
    || token.includes('wallet')
    || token.includes('mobile_money')
  ) return 'wallet'
  if (token === 'cash_pickup' || token === 'cash' || token.includes('cash')) return 'cash'
  if (
    token === 'bank_deposit'
    || token === 'bank_transfer'
    || token === 'bank_account'
    || token === 'bank'
    || token === 'account'
    || token === 'card'
    || token === 'card_deposit'
    || token === 'debit_card'
    || token === 'credit_card'
    || token.includes('bank')
    || token.includes('account')
    || token.includes('card')
  ) return 'bank'
  return null
}

const orderMethods = (methods: Iterable<'bank' | 'cash' | 'wallet' | 'airtime'>) => {
  const order: Array<'bank' | 'cash' | 'wallet' | 'airtime'> = ['bank', 'cash', 'wallet', 'airtime']
  const set = new Set(methods)
  return order.filter(m => set.has(m))
}

const querySchema = z.object({
  corridor_id: z.string().min(1),
  amount: z.coerce.number().optional().default(100),
  method: z.enum(['bank', 'cash', 'wallet', 'airtime']).optional().default('bank'),
})

export const providersExplainRoutes = async (app: FastifyInstance) => {
  const rightsMatrixRepository = app.container.repositories.rightsMatrix

  app.get('/ops/providers/explain', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = querySchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const corridorId = parsed.data.corridor_id.trim().toUpperCase()
    const corridorParts = parseCorridorId(corridorId)
    if (!corridorParts) {
      reply.code(400)
      return { error: 'bad_request', message: 'invalid corridor_id' }
    }

    const sourceCountry = corridorParts.sourceCountry.toUpperCase()
    const destCountry = corridorParts.destCountry.toUpperCase()
    const requestedMethod = parsed.data.method
    const amount = parsed.data.amount

    if (!Number.isFinite(amount) || amount <= 0) {
      reply.code(400)
      return { error: 'bad_request', message: 'amount must be positive' }
    }

    const bucketSelection = computeBucketSelection(amount)
    const amountBucket = bucketSelection.bucket_used

    try {
      const eligibleProviders = await rightsMatrixRepository.listActiveB2cProvidersByCountry(
        sourceCountry,
        destCountry,
      )
      const eligibleSet = new Set(eligibleProviders.map(r => r.provider_id).filter(Boolean))

      const [capResult, quoteResult] = await Promise.all([
        query<CapabilityRow>(
          `SELECT provider_id,
                  payin_methods,
                  payout_methods,
                  is_supported,
                  source,
                  last_verified_at
             FROM silver.provider_corridor_capability
            WHERE corridor_id = $1`,
          [corridorId],
          planeAPool,
        ),
        query<LatestQuoteRow>(
          `SELECT provider_id,
                  payin,
                  payout,
                  collected_at
             FROM silver.latest_quote_by_provider
            WHERE corridor_id = $1
              AND amount_bucket = $2`,
          [corridorId, amountBucket],
          planeAPool,
        ),
      ])

      const capByProvider = new Map<string, CapabilityRow>()
      for (const row of capResult.rows) {
        if (!row.provider_id) continue
        capByProvider.set(row.provider_id, row)
      }

      const quotesByProvider = new Map<string, LatestQuoteRow[]>()
      for (const row of quoteResult.rows) {
        if (!row.provider_id) continue
        const list = quotesByProvider.get(row.provider_id) ?? []
        list.push(row)
        quotesByProvider.set(row.provider_id, list)
      }

      const providerUniverse = new Set<string>([
        ...eligibleSet.values(),
        ...capByProvider.keys(),
        ...quotesByProvider.keys(),
      ])

      const providers = Array.from(providerUniverse.values())
        .map((providerId) => {
          const metadata = getProviderMetadata(providerId)
          const cap = capByProvider.get(providerId) ?? null
          const quotes = quotesByProvider.get(providerId) ?? []

          const methods = new Set<'bank' | 'cash' | 'wallet' | 'airtime'>()
          let hasRequested = false
          let latestCollectedAt: string | null = null
          for (const q of quotes) {
            const method = toAvailableMethod(q.payout)
            if (method) methods.add(method)
            if (method === requestedMethod) hasRequested = true
            if (q.collected_at) {
              const ts = new Date(q.collected_at).getTime()
              if (Number.isFinite(ts)) {
                if (!latestCollectedAt || ts > new Date(latestCollectedAt).getTime()) {
                  latestCollectedAt = new Date(ts).toISOString()
                }
              }
            }
          }

          const eligibleByRights = eligibleSet.has(providerId)

          let verdict: string = 'ok'
          if (!eligibleByRights) {
            verdict = 'excluded_rights'
          } else if (cap && cap.is_supported === false) {
            verdict = 'excluded_capability'
          } else if (quotes.length === 0) {
            verdict = 'collecting'
          } else if (!hasRequested) {
            verdict = 'excluded_method'
          }

          return {
            provider_id: providerId,
            provider_slug: metadata?.slug ?? providerId,
            provider_name: metadata?.name ?? providerId,
            eligible_by_rights: eligibleByRights,
            capability: cap ? {
              is_supported: cap.is_supported === true,
              payin_methods: cap.payin_methods ?? null,
              payout_methods: cap.payout_methods ?? null,
              source: cap.source ?? null,
              last_verified_at: cap.last_verified_at ?? null,
            } : null,
            quotes: {
              amount_bucket: amountBucket,
              count: quotes.length,
              latest_collected_at: latestCollectedAt,
              available_methods: orderMethods(methods),
              has_requested_method: hasRequested,
            },
            verdict,
          }
        })
        .sort((a, b) => a.provider_slug.localeCompare(b.provider_slug))

      return {
        success: true,
        corridor_id: corridorId,
        amount,
        amount_bucket: amountBucket,
        requested_method: requestedMethod,
        providers,
      }
    } catch (error) {
      logger.error('providers_explain_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to explain providers for corridor.' }
    }
  })
}

