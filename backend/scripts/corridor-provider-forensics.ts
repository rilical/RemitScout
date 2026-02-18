/**
 * Corridor/provider forensics
 *
 * Goal:
 * - Explain “provider missing” for a corridor in deterministic, reason-coded terms:
 *   rights eligibility, capability support, method compatibility, and latest-quote presence.
 *
 * Inputs:
 * - CORRIDOR_ID (required): e.g. US-JO-USD-JOD
 * - AMOUNT (optional, default 100): used to compute amount bucket selection
 * - METHOD (optional, default bank): bank|cash|wallet|airtime
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { computeBucketSelection } from '../shared/amount-bucket'
import { parseCorridorId } from '../shared/corridor'

initTracing('corridor-provider-forensics')
initErrorTracking('corridor-provider-forensics')

const logger = createLogger('script.corridor-provider-forensics')

type RightsRow = {
  provider_id: string
  allowed_collect: boolean | null
  allowed_b2b: boolean | null
  allowed_b2c: boolean | null
  stoplist_status: string | null
  status: string | null
  source_countries: string[] | null
  destination_countries: string[] | null
}

type CapabilityRow = {
  provider_id: string
  corridor_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean | null
  source: string | null
  last_verified_at: string | null
}

type LatestQuoteRow = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin: string
  payout: string
  collected_at: string | null
  fee_amount: string | number | null
  implied_fx_rate: string | number | null
}

type QuoteRefreshRequestRow = {
  request_id: string
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin_method: string
  payout_method: string
  status: string
  requested_at: string | null
  last_requested_at: string | null
  request_count: number | null
  retry_count: number | null
  locked_at: string | null
  processed_at: string | null
  error_message: string | null
  created_at: string | null
}

type RequestedMethod = 'bank' | 'cash' | 'wallet' | 'airtime'

const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const toAvailableMethod = (value?: string | null): RequestedMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) {
    return 'airtime'
  }
  if (
    token === 'mobile_wallet'
    || token === 'mobile_money'
    || token === 'wallet'
    || token.includes('wallet')
    || token.includes('mobile_money')
  ) {
    return 'wallet'
  }
  if (token === 'cash_pickup' || token === 'cash' || token.includes('cash')) {
    return 'cash'
  }
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
  ) {
    return 'bank'
  }
  return null
}

const parseMethod = (value: string | undefined): RequestedMethod => {
  const token = (value || '').trim().toLowerCase()
  if (token === 'cash') return 'cash'
  if (token === 'wallet') return 'wallet'
  if (token === 'airtime') return 'airtime'
  return 'bank'
}

const includesCountry = (list: string[] | null, code: string): boolean => {
  if (!list || list.length === 0) return false
  const upper = code.trim().toUpperCase()
  return list.some((c) => c && c.trim().toUpperCase() === upper)
}

export const runCorridorProviderForensics = async () => {
  const corridorId = (process.env.CORRIDOR_ID || '').trim().toUpperCase()
  if (!corridorId || !parseCorridorId(corridorId)) {
    throw new Error(`Invalid CORRIDOR_ID: ${corridorId || '(missing)'}`)
  }

  const amount = Number(process.env.AMOUNT ?? '100')
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid AMOUNT: ${process.env.AMOUNT ?? '(missing)'}`)
  }

  const requestedMethod = parseMethod(process.env.METHOD)
  const bucketSelection = computeBucketSelection(amount)
  const amountBucket = bucketSelection.bucket_used

  const parts = parseCorridorId(corridorId)!
  const sourceCountry = parts.sourceCountry.toUpperCase()
  const destCountry = parts.destCountry.toUpperCase()

  const pool = createPool(config.db.planeBUrl)
  try {
    const [rightsResult, capResult, quoteResult, refreshResult] = await Promise.all([
      query<RightsRow>(
        `SELECT provider_id,
                allowed_collect,
                allowed_b2b,
                allowed_b2c,
                stoplist_status,
                status,
                source_countries,
                destination_countries
           FROM silver.rights_matrix`,
        [],
        pool,
      ),
      query<CapabilityRow>(
        `SELECT provider_id,
                corridor_id,
                payin_methods,
                payout_methods,
                is_supported,
                source,
                last_verified_at
           FROM silver.provider_corridor_capability
          WHERE corridor_id = $1`,
        [corridorId],
        pool,
      ),
      query<LatestQuoteRow>(
        `SELECT provider_id,
                corridor_id,
                amount_bucket,
                payin,
                payout,
                collected_at,
                fee_amount,
                implied_fx_rate
           FROM silver.latest_quote_by_provider
          WHERE corridor_id = $1
            AND amount_bucket = $2`,
        [corridorId, amountBucket],
        pool,
      ),
      query<QuoteRefreshRequestRow>(
        `SELECT request_id,
                provider_id,
                corridor_id,
                amount_bucket,
                payin_method,
                payout_method,
                status,
                requested_at,
                last_requested_at,
                request_count,
                retry_count,
                locked_at,
                processed_at,
                error_message,
                created_at
           FROM silver.quote_refresh_request
          WHERE corridor_id = $1
            AND amount_bucket = $2
          ORDER BY last_requested_at DESC NULLS LAST`,
        [corridorId, amountBucket],
        pool,
      ),
    ])

    const rightsByProvider = new Map<string, RightsRow>()
    for (const row of rightsResult.rows) {
      if (row.provider_id) rightsByProvider.set(row.provider_id, row)
    }

    const capByProvider = new Map<string, CapabilityRow>()
    for (const row of capResult.rows) {
      if (row.provider_id) capByProvider.set(row.provider_id, row)
    }

    const quotesByProvider = new Map<string, LatestQuoteRow[]>()
    for (const row of quoteResult.rows) {
      if (!row.provider_id) continue
      const list = quotesByProvider.get(row.provider_id) ?? []
      list.push(row)
      quotesByProvider.set(row.provider_id, list)
    }

    const refreshByProvider = new Map<string, QuoteRefreshRequestRow[]>()
    for (const row of refreshResult.rows) {
      if (!row.provider_id) continue
      const list = refreshByProvider.get(row.provider_id) ?? []
      list.push(row)
      refreshByProvider.set(row.provider_id, list)
    }

    const providerUniverse = new Set<string>([
      ...rightsByProvider.keys(),
      ...capByProvider.keys(),
      ...quotesByProvider.keys(),
      ...refreshByProvider.keys(),
    ])

    const providers: Array<Record<string, unknown>> = []
    for (const providerId of Array.from(providerUniverse.values()).sort()) {
      const rights = rightsByProvider.get(providerId) ?? null
      const cap = capByProvider.get(providerId) ?? null
      const quotes = quotesByProvider.get(providerId) ?? []
      const refreshRequests = refreshByProvider.get(providerId) ?? []

      const stoplistStatus = (rights?.stoplist_status || '').toLowerCase()
      const active = stoplistStatus === 'active'

      const rightsB2c =
        Boolean(rights?.allowed_collect)
        && Boolean(rights?.allowed_b2c)
        && active
        && (
          (
            includesCountry(rights?.source_countries ?? null, sourceCountry)
            && includesCountry(rights?.destination_countries ?? null, destCountry)
          )
          || providerId === 'wise'
        )

      const rightsB2b =
        Boolean(rights?.allowed_collect)
        && Boolean(rights?.allowed_b2b)
        && active
        && includesCountry(rights?.source_countries ?? null, sourceCountry)
        && includesCountry(rights?.destination_countries ?? null, destCountry)

      const anyQuoteMethods = new Set<RequestedMethod>()
      let hasRequested = false
      let latestCollectedAt: string | null = null
      for (const q of quotes) {
        const method = toAvailableMethod(q.payout)
        if (method) anyQuoteMethods.add(method)
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

      const refreshPending = refreshRequests.some((r) => {
        const status = (r.status || '').toLowerCase()
        return status === 'pending' || status === 'processing'
      })
      const refreshFailed = refreshRequests.find((r) => (r.status || '').toLowerCase() === 'failed')

      const capability = cap ? {
        is_supported: cap.is_supported === true,
        payin_methods: cap.payin_methods ?? null,
        payout_methods: cap.payout_methods ?? null,
        source: cap.source ?? null,
        last_verified_at: cap.last_verified_at ?? null,
      } : null

      let verdict: string = 'ok'
      let reason: string | null = null
      if (!rightsB2c) {
        verdict = 'excluded_rights'
        reason = 'not_allowed_b2c_or_country_mismatch_or_stoplisted'
      } else if (cap && cap.is_supported === false) {
        verdict = 'excluded_capability'
        reason = cap.source || 'capability_unsupported'
      } else if (quotes.length === 0) {
        verdict = 'collecting'
        if (refreshPending) {
          reason = 'refresh_pending'
        } else if (refreshFailed?.error_message) {
          reason = `refresh_failed:${refreshFailed.error_message.slice(0, 200)}`
        } else {
          reason = 'no_latest_quotes_for_bucket'
        }
      } else if (!hasRequested) {
        verdict = 'excluded_method'
        reason = `requested_${requestedMethod}_not_available`
      }

      providers.push({
        provider: providerId,
        rights: {
          allowed_collect: rights?.allowed_collect ?? null,
          allowed_b2b: rights?.allowed_b2b ?? null,
          allowed_b2c: rights?.allowed_b2c ?? null,
          stoplist_status: rights?.stoplist_status ?? null,
          status: rights?.status ?? null,
          eligible_b2b_for_corridor: rightsB2b,
          eligible_b2c_for_corridor: rightsB2c,
        },
        capability,
        refresh: {
          count: refreshRequests.length,
          recent: refreshRequests.slice(0, 5).map((r) => ({
            request_id: r.request_id,
            status: r.status,
            payin_method: r.payin_method,
            payout_method: r.payout_method,
            last_requested_at: r.last_requested_at,
            processed_at: r.processed_at,
            error_message: r.error_message,
            request_count: r.request_count,
            retry_count: r.retry_count,
          })),
        },
        quotes: {
          amount_bucket: amountBucket,
          has_any: quotes.length > 0,
          latest_collected_at: latestCollectedAt,
          available_methods: Array.from(anyQuoteMethods.values()).sort(),
          has_requested_method: hasRequested,
        },
        verdict,
        reason,
      })
    }

    const payload = {
      success: true,
      findings: (() => {
        const verdictCounts: Record<string, number> = {}
        const refreshFailedProviders: string[] = []
        const refreshPendingProviders: string[] = []

        for (const p of providers as any[]) {
          const verdict = String(p?.verdict ?? 'unknown')
          verdictCounts[verdict] = (verdictCounts[verdict] ?? 0) + 1

          if (verdict === 'collecting' && typeof p?.reason === 'string') {
            if (p.reason.startsWith('refresh_failed:')) refreshFailedProviders.push(String(p?.provider ?? 'unknown'))
            if (p.reason === 'refresh_pending') refreshPendingProviders.push(String(p?.provider ?? 'unknown'))
          }
        }

        const findings: Array<{ reason_code: string; message: string; details?: unknown }> = [
          {
            reason_code: 'forensics.verdict_breakdown',
            message: 'Provider verdict breakdown for corridor forensics.',
            details: { verdict_counts: verdictCounts },
          },
        ]

        if (refreshFailedProviders.length) {
          findings.push({
            reason_code: 'quote_refresh.failed',
            message: 'One or more providers have a failed refresh request for this corridor/bucket.',
            details: { providers: refreshFailedProviders.sort() },
          })
        }

        if (refreshPendingProviders.length) {
          findings.push({
            reason_code: 'quote_refresh.pending',
            message: 'One or more providers have a pending/processing refresh request for this corridor/bucket.',
            details: { providers: refreshPendingProviders.sort() },
          })
        }

        return findings
      })(),
      recommended_next_skill_ids: (() => {
        const verdicts = new Set<string>((providers as any[]).map((p) => String(p?.verdict ?? 'unknown')))
        const ids: string[] = []

        // Safe next steps: gather evidence and summarize state.
        if (verdicts.has('collecting') || verdicts.has('excluded_capability') || verdicts.has('excluded_method')) {
          ids.push('probe.provider.github_actions')
        }
        ids.push('observe.dev.local')

        return Array.from(new Set(ids))
      })(),
      environment: config.envName || config.env,
      corridor_id: corridorId,
      source_country: sourceCountry,
      dest_country: destCountry,
      amount,
      amount_bucket: amountBucket,
      requested_method: requestedMethod,
      providers,
    }

    // Print to stdout for quick copy/paste into incident reports.
    // (Artifacts can be added later if needed.)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload, null, 2))
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runCorridorProviderForensics().catch((error) => {
    logger.error('corridor_forensics_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
