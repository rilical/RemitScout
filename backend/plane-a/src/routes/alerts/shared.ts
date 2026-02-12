import { z } from 'zod'
import { query } from '../../../../shared/db'
import { createLogger } from '../../../../shared/logger'
import { getUserPlan } from '../../services/user-plan'
import { getEntitlementsForPlan } from '../../services/entitlements'
import { upsertUsageSnapshot } from '../../services/plan-usage'
import { getErrorMessage } from '../../types/errors'
import { getCountryByCode } from '../../../../shared/countries-currencies'
import { parseCorridorId } from '../../../../shared/corridor'
import { FIXED_EXCHANGE_RATES } from '../../../../shared/currency-limits'
import { computeBucketSelection } from '../../../../shared/amount-bucket'
import {
  ALERT_COOLDOWN_MINUTES,
  DEFAULT_AMOUNT_BUCKET,
  SMART_ALERT_MIN_CONFIDENCE,
  SMART_ALERT_MIN_SAMPLE_DAYS,
} from '../../../../shared/constants'
import type {
  IAlertRepository,
  IRightsMatrixRepository,
  IWatchlistRepository,
} from '../../repositories'
import type { Pool } from 'pg'

export const logger = createLogger('plane-a.alerts')

export type AlertsRouteDependencies = {
  pool: Pool
  alertRepository: IAlertRepository
  watchlistRepository: IWatchlistRepository
  rightsMatrixRepository: IRightsMatrixRepository
}

const ALERT_COOLDOWN_BY_FREQUENCY: Record<'weekly' | 'daily', number> = {
  weekly: 10080,
  daily: 1440,
}

export const updateAlertUsage = async (
  deps: Pick<AlertsRouteDependencies, 'pool' | 'alertRepository'>,
  userId: string,
) => {
  try {
    const count = await deps.alertRepository.countByUserId(userId)
    await upsertUsageSnapshot(deps.pool, userId, 'alerts_count', count)
  } catch (error) {
    logger.warn('alert_usage_update_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }
}

export const alertRuleSchema = z.object({
  metric: z.enum(['rate', 'recipientGets', 'totalCost', 'fee', 'index', 'midMarketRate', 'sendScore']),
  comparator: z.enum(['gt', 'gte', 'lt', 'lte', 'crosses_above', 'crosses_below']),
  value: z.number(),
  currency: z.string().optional(),
})

export const createAlertSchema = z.object({
  watchlistItemId: z.string().uuid(),
  rule: alertRuleSchema,
  frequency: z.enum(['weekly', 'daily']).default('weekly'),
  enabled: z.boolean().default(true),
})

export const updateAlertSchema = z.object({
  rule: alertRuleSchema.partial().optional(),
  frequency: z.enum(['weekly', 'daily']).optional(),
  enabled: z.boolean().optional(),
})

export const isPlusEntitled = (plan: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  return !!plan
    && ['plus', 'enterprise'].includes(plan.plan_code)
    && ['active', 'trialing'].includes(plan.status)
}

export const isPlanActiveStatus = (status?: string | null) => status === 'active' || status === 'trialing'

export const resolveAlertLimit = (plan: Awaited<ReturnType<typeof getUserPlan>> | null): number | 'unlimited' => {
  if (!plan) {
    return 1 // Default free plan limit
  }
  const effectivePlanCode = isPlanActiveStatus(plan.status) ? plan.plan_code : 'free'
  const entitlements = getEntitlementsForPlan(effectivePlanCode)
  return entitlements.alerts_max === null ? 'unlimited' : entitlements.alerts_max
}

export const resolveCooldownMinutes = (frequency: 'weekly' | 'daily') => {
  return ALERT_COOLDOWN_BY_FREQUENCY[frequency] ?? ALERT_COOLDOWN_MINUTES
}

export const isValidSendScore = (value: number) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
}

export const normalizeFrequency = (frequency: string | null | undefined): 'weekly' | 'daily' => {
  return frequency === 'daily' ? 'daily' : 'weekly'
}

export async function getAlertCount(
  alertRepository: IAlertRepository,
  userId: string,
): Promise<number> {
  return alertRepository.countByUserId(userId)
}

export const SMART_ALERT_NOT_OFFERED_MESSAGE =
  'Smart Alerts are available for select major corridors we track continuously.'

export const REGULAR_ALERT_SUPPORTED_METRICS = ['recipientGets', 'fee', 'totalCost'] as const
export type RegularAlertMetric = (typeof REGULAR_ALERT_SUPPORTED_METRICS)[number]

export type QuoteCoverage = {
  supported: boolean
  eligibleProviderCount: number
  observedProviderCount: number
  latestQuoteCollectedAt: string | null
  fresh: boolean
  supportedMetrics: RegularAlertMetric[]
}

export type FxCoverage = {
  supported: boolean
}

export const toPositiveNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const n = typeof value === 'string' ? Number(value) : Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const resolveUsdEquivalentBucket = (currency: string): number => {
  const normalized = currency.toUpperCase()
  const rate = FIXED_EXCHANGE_RATES[normalized] ?? 1
  const amount = DEFAULT_AMOUNT_BUCKET * rate
  return computeBucketSelection(amount).bucket_used
}

export const resolveBucketForEligibility = (corridorId: string): number => {
  const parts = parseCorridorId(corridorId)
  const sourceCurrency = parts?.sourceCurrency?.toUpperCase() ?? null
  if (!sourceCurrency) return DEFAULT_AMOUNT_BUCKET
  return resolveUsdEquivalentBucket(sourceCurrency)
}

export const resolveMethodForEligibility = (raw: unknown): string => {
  if (typeof raw !== 'string') return 'bank'
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : 'bank'
}

export const computeQuoteCoverage = async (input: {
  corridorId: string
  payinMethod: string
  payoutMethod: string
  amountBucket: number
  maxAgeSeconds: number
  pool: Pool
  rightsMatrixRepository: IRightsMatrixRepository
}): Promise<QuoteCoverage> => {
  const corridorParts = parseCorridorId(input.corridorId)
  const sourceCountry = corridorParts?.sourceCountry?.toUpperCase() ?? null
  const destCountry = corridorParts?.destCountry?.toUpperCase() ?? null

  let eligibleProviderCount = 0
  if (sourceCountry && destCountry) {
    try {
      const eligible = await input.rightsMatrixRepository.listActiveB2cProvidersByCountry(
        sourceCountry,
        destCountry,
      )
      eligibleProviderCount = eligible.length
    } catch (error) {
      logger.warn('quote_coverage_rights_matrix_failed', {
        corridor_id: input.corridorId,
        error: getErrorMessage(error),
      })
    }
  }

  const quoteResult = await query<{
    latest: Date | null
    provider_count: number
  }>(
    `SELECT MAX(collected_at) AS latest,
            COUNT(DISTINCT provider_id)::int AS provider_count
       FROM silver.latest_quote_by_provider
      WHERE corridor_id = $1
        AND amount_bucket = $2
        AND status = 'ok'`,
    [input.corridorId, input.amountBucket],
    input.pool,
  )

  const latest = quoteResult.rows[0]?.latest ?? null
  const observedProviderCount = quoteResult.rows[0]?.provider_count ?? 0
  const latestIso = latest ? new Date(latest).toISOString() : null
  const fresh = latest
    ? (Date.now() - new Date(latest).getTime()) <= input.maxAgeSeconds * 1000
    : false

  const supported = observedProviderCount > 0 && latestIso !== null

  return {
    supported,
    eligibleProviderCount,
    observedProviderCount,
    latestQuoteCollectedAt: latestIso,
    fresh,
    supportedMetrics: supported ? [...REGULAR_ALERT_SUPPORTED_METRICS] : [],
  }
}

export const computeFxCoverage = async (
  base: string,
  quote: string,
  pool: Pool,
): Promise<FxCoverage> => {
  const result = await query<{ ok: number }>(
    `SELECT 1 AS ok
       FROM gold.fx_rates
      WHERE base_currency = $1 AND quote_currency = $2
      LIMIT 1`,
    [base.toUpperCase(), quote.toUpperCase()],
    pool,
  )
  return { supported: result.rows.length > 0 }
}

export type CorridorSignalData = {
  confidence: number | null
  sample_days: number | null
  alert_eligible: boolean
  best_window_start: Date | null
  best_window_end: Date | null
  send_score: number | null
}

export const resolveCorridorIdFromWatchlist = (
  targetType: string,
  payload: Record<string, unknown>,
): string | null => {
  if (targetType !== 'corridor') return null

  if (typeof payload.corridorId === 'string' && payload.corridorId.length > 0) {
    return payload.corridorId.toUpperCase()
  }

  const from = typeof payload.from === 'string' ? payload.from.toUpperCase() : null
  const to = typeof payload.to === 'string' ? payload.to.toUpperCase() : null
  if (!from || !to) return null

  const fromCurrency = typeof payload.fromCurrency === 'string'
    ? payload.fromCurrency.toUpperCase()
    : getCountryByCode(from)?.currency ?? null
  const toCurrency = typeof payload.toCurrency === 'string'
    ? payload.toCurrency.toUpperCase()
    : getCountryByCode(to)?.currency ?? null

  if (!fromCurrency || !toCurrency) return null

  return `${from}-${to}-${fromCurrency}-${toCurrency}`
}

export async function checkCorridorSignalData(
  corridorId: string,
  pool: Pool,
): Promise<CorridorSignalData | null> {
  const result = await query<{
    confidence: number | null
    sample_days: number | null
    alert_eligible: boolean
    best_window_start: Date | null
    best_window_end: Date | null
    send_score: number | null
  }>(
    `SELECT confidence, sample_days, alert_eligible, best_window_start, best_window_end, send_score::double precision AS send_score
     FROM silver.corridor_signals
     WHERE corridor_id = $1`,
    [corridorId],
    pool,
  )

  return result.rows[0] ?? null
}

export const smartAlertRequirements = {
  minConfidence: SMART_ALERT_MIN_CONFIDENCE,
  minSampleDays: SMART_ALERT_MIN_SAMPLE_DAYS,
} as const
