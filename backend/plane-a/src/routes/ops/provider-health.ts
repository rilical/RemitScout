import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../../shared/logger'
import { getRedisClient } from '../../../../shared/redis'
import { getHealthCorridors, type ProviderId } from '../../../../shared/health-corridors'
import { getCorridorTier, getTierSloMinutes } from '../../../../shared/corridor-tiers'
import { requireAdmin } from '../../plugins/auth-plugin'
import { getProviderMetadata } from '../../services/provider-metadata'
import { sendAdminWebhook } from '../../services/admin-webhooks'
import { getErrorMessage } from '../../types/errors'
import { NotFoundError } from '../../../../shared/errors'

type ProviderHealthOptions = {
  providerId: ProviderId
  displayName: string
}

type ProviderHealthCorridor = {
  corridor_id: string
  collection_tier: 'tier_1' | 'tier_2'
  slo_minutes: number
  last_attempt_at: Date | string | null
  last_attempt_age_minutes: number | null
  last_attempt_success: boolean | null
  last_attempt_http_status: number | null
  last_attempt_error_type: string | null
  last_attempt_error_message: string | null
  last_attempt_request: string | null
  last_quote_at: Date | string | null
  last_quote_age_minutes: number | null
  stale: boolean
  payin: string | null
  payout: string | null
  send_amount: number | null
  fee_amount: number | null
  promotional_fee_amount: number | null
  total_debit_amount: number | null
  receive_amount: number | null
  implied_fx_rate: number | null
  promotional_rate: number | null
  base_rate: number | null
  promotional_cap_amount: number | null
  delivery_time_min_minutes: number | null
  delivery_time_max_minutes: number | null
  quality_flags: unknown
  updated_at: Date | string | null
}

export type ProviderHealthSnapshot = {
  success: true
  provider_id: ProviderId
  affiliate: boolean
  affiliate_url: string | null
  outbound_url: string | null
  timestamp: string
  corridors: ProviderHealthCorridor[]
  summary: {
    corridor_count: number
    stale_count: number
    fresh_window_minutes: number
  }
}

const minutesSince = (value: string | Date | null) => {
  if (!value) return null
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.round((Date.now() - timestamp) / 60000)
}

export const providerHealthRegistry: ProviderHealthOptions[] = [
  { providerId: 'remitly', displayName: 'Remitly' },
  { providerId: 'westernunion', displayName: 'Western Union' },
  { providerId: 'wellsfargo', displayName: 'Wells Fargo' },
  { providerId: 'xe', displayName: 'Xe' },
  { providerId: 'transfergo', displayName: 'TransferGo' },
  { providerId: 'paysend', displayName: 'Paysend' },
  { providerId: 'pangea', displayName: 'Pangea' },
  { providerId: 'orbitremit', displayName: 'OrbitRemit' },
  { providerId: 'bossmoney', displayName: 'Boss Money' },
  { providerId: 'ria', displayName: 'Ria' },
  { providerId: 'dahabshiil', displayName: 'Dahabshiil' },
  { providerId: 'sendwave', displayName: 'Sendwave' },
  { providerId: 'mukuru', displayName: 'Mukuru' },
  { providerId: 'worldremit', displayName: 'WorldRemit' },
  { providerId: 'wise', displayName: 'Wise' },
  { providerId: 'xoom', displayName: 'Xoom' },
  { providerId: 'instarem', displayName: 'Instarem' },
  { providerId: 'koronapay', displayName: 'KoronaPay' },
  { providerId: 'remitbee', displayName: 'RemitBee' },
  { providerId: 'singx', displayName: 'SingX' },
  { providerId: 'placid', displayName: 'Placid' },
  { providerId: 'wirebarley', displayName: 'WireBarley' },
  { providerId: 'intermex', displayName: 'Intermex' },
  { providerId: 'alansari', displayName: 'Al Ansari' },
]

const includeCorridorsSchema = z.object({
  include_corridors: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y'
  }
  return false
}

const fetchProviderHealth = async (
  app: FastifyInstance,
  options: ProviderHealthOptions,
): Promise<ProviderHealthSnapshot> => {
  const quoteAttemptRepository = app.container.repositories.quoteAttempt
  const latestQuoteRepository = app.container.repositories.latestQuote

  const healthCorridors = getHealthCorridors(options.providerId)
  if (!healthCorridors || healthCorridors.length === 0) {
    throw new NotFoundError('No health corridors configured')
  }

  const attempts = await quoteAttemptRepository.listLatestAttemptsByProvider(
    options.providerId,
    [...healthCorridors],
  )

  const quotes = await latestQuoteRepository.listLatestByProvider(
    options.providerId,
    [...healthCorridors],
  )

  const attemptsByCorridor = new Map(
    attempts.map((row) => [row.corridor_id as string, row]),
  )
  const quotesByCorridor = new Map(
    quotes.map((row) => [row.corridor_id as string, row]),
  )

  const corridors = healthCorridors.map((corridorId) => {
    const attempt = attemptsByCorridor.get(corridorId) || null
    const quote = quotesByCorridor.get(corridorId) || null
    const tier = getCorridorTier(corridorId)
    const sloMinutes = getTierSloMinutes(tier)
    const quoteAge = minutesSince(quote?.collected_at ?? null)
    // Stale = no quote at all, or quote age exceeds 8x the tier SLO
    // (generous multiplier accounts for occasional missed cycles)
    const staleThresholdMinutes = sloMinutes * 8
    const isStale = quoteAge === null || quoteAge > staleThresholdMinutes

    return {
      corridor_id: corridorId,
      collection_tier: tier,
      slo_minutes: sloMinutes,
      last_attempt_at: attempt?.attempted_at ?? null,
      last_attempt_age_minutes: minutesSince(attempt?.attempted_at ?? null),
      last_attempt_success: attempt?.success ?? null,
      last_attempt_http_status: attempt?.http_status ?? null,
      last_attempt_error_type: attempt?.error_type ?? null,
      last_attempt_error_message: attempt?.error_message ?? null,
      last_attempt_request: attempt?.request_fingerprint ?? null,
      last_quote_at: quote?.collected_at ?? null,
      last_quote_age_minutes: quoteAge,
      stale: isStale,
      payin: quote?.payin ?? null,
      payout: quote?.payout ?? null,
      send_amount: quote?.send_amount ?? null,
      fee_amount: quote?.fee_amount ?? null,
      promotional_fee_amount: quote?.promotional_fee_amount ?? null,
      total_debit_amount: quote?.total_debit_amount ?? null,
      receive_amount: quote?.receive_amount ?? null,
      implied_fx_rate: quote?.implied_fx_rate ?? null,
      promotional_rate: quote?.promotional_rate ?? null,
      base_rate: quote?.base_rate ?? null,
      promotional_cap_amount: quote?.promotional_cap_amount ?? null,
      delivery_time_min_minutes: quote?.delivery_time_min_minutes ?? null,
      delivery_time_max_minutes: quote?.delivery_time_max_minutes ?? null,
      quality_flags: quote?.quality_flags ?? null,
      updated_at: quote?.updated_at ?? null,
    }
  })

  const freshWindowMinutes = 24 * 60
  const staleCorridors = corridors.filter((corridor) => corridor.stale)

  const metadata = getProviderMetadata(options.providerId)
  const affiliateUrl = metadata?.affiliateUrl ?? null
  const affiliate = Boolean(affiliateUrl) || metadata?.isAffiliate || false
  const outboundUrl = affiliateUrl ?? metadata?.url ?? null

  return {
    success: true,
    provider_id: options.providerId,
    affiliate,
    affiliate_url: affiliateUrl,
    outbound_url: outboundUrl,
    timestamp: new Date().toISOString(),
    corridors,
    summary: {
      corridor_count: corridors.length,
      stale_count: staleCorridors.length,
      fresh_window_minutes: freshWindowMinutes,
    },
  }
}

export const registerProviderHealthRoutes = (app: FastifyInstance, options: ProviderHealthOptions) => {
  const logger = createLogger(`plane-a.ops.${options.providerId}-health`)

  app.get(`/ops/${options.providerId}/health`, { preHandler: requireAdmin() }, async (_request, reply) => {
    try {
      return await fetchProviderHealth(app, options)
    }
    catch (error: unknown) {
      logger.error(`${options.providerId}_health_failed`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      reply.code(500)
      return {
        error: 'internal_error',
        message: `Failed to fetch ${options.displayName} health data`,
      }
    }
  })
}

export const registerProvidersHealthAggregateRoute = (app: FastifyInstance) => {
  const logger = createLogger('plane-a.ops.providers-health')

  app.get('/ops/providers/health', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = includeCorridorsSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return {
        error: 'bad_request',
        details: parsed.error.issues,
      }
    }

    const includeCorridors = parseBooleanQuery(parsed.data.include_corridors)

    const results = await Promise.allSettled(
      providerHealthRegistry.map((provider) => fetchProviderHealth(app, provider)),
    )

    const providers = results.map((result, index) => {
      const provider = providerHealthRegistry[index]

      if (result.status === 'fulfilled') {
        const value = result.value
        return {
          provider_id: value.provider_id,
          display_name: provider.displayName,
          status: value.summary.stale_count > 0 ? 'degraded' : 'healthy',
          timestamp: value.timestamp,
          affiliate: value.affiliate,
          affiliate_url: value.affiliate_url,
          outbound_url: value.outbound_url,
          summary: value.summary,
          ...(includeCorridors ? { corridors: value.corridors } : {}),
        }
      }

      logger.warn('provider_health_aggregate_fetch_failed', {
        provider_id: provider.providerId,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })

      return {
        provider_id: provider.providerId,
        display_name: provider.displayName,
        status: 'error' as const,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        summary: {
          corridor_count: 0,
          stale_count: 0,
          fresh_window_minutes: 24 * 60,
        },
        ...(includeCorridors ? { corridors: [] } : {}),
      }
    })

    const staleProviders = providers.filter((provider) => {
      if (provider.status === 'error') return false
      const staleCount = Number(provider.summary?.stale_count ?? 0)
      return Number.isFinite(staleCount) && staleCount >= 3
    })

    if (staleProviders.length > 0) {
      for (const provider of staleProviders) {
        try {
          const redis = await getRedisClient()
          const dedupeKey = `plane-a:provider-stale:webhook:${provider.provider_id}`
          let shouldSend = true
          if (redis) {
            const setResult = await redis.set(dedupeKey, '1', { EX: 1800, NX: true })
            shouldSend = setResult === 'OK'
          }

          if (shouldSend) {
            void sendAdminWebhook({
              title: 'Provider stale threshold exceeded',
              event: 'provider_stale_threshold',
              metadata: {
                provider_id: provider.provider_id,
                stale_count: provider.summary?.stale_count ?? 0,
                corridor_count: provider.summary?.corridor_count ?? 0,
              },
            })
          }
        }
        catch (error) {
          logger.warn('provider_health_stale_webhook_dedupe_failed', {
            provider_id: provider.provider_id,
            error: getErrorMessage(error),
          })
        }
      }
    }

    const summary = providers.reduce(
      (acc, provider) => {
        acc.total_providers += 1
        if (provider.status === 'error') {
          acc.providers_with_errors += 1
          return acc
        }
        const staleCount = Number(provider.summary?.stale_count ?? 0)
        const corridorCount = Number(provider.summary?.corridor_count ?? 0)
        acc.total_corridors += Number.isFinite(corridorCount) ? corridorCount : 0
        if (staleCount > 0) {
          acc.degraded_providers += 1
        }
        else {
          acc.healthy_providers += 1
        }
        return acc
      },
      {
        total_providers: 0,
        healthy_providers: 0,
        degraded_providers: 0,
        providers_with_errors: 0,
        total_corridors: 0,
      },
    )

    return {
      summary: {
        ...summary,
        include_corridors: includeCorridors,
        generated_at: new Date().toISOString(),
      },
      providers,
    }
  })
}
