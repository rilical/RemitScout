/**
 * Alert & Watchlist Corridor Refresh Job
 *
 * Refreshes corridors with active alerts OR watchlist items before alert evaluation runs.
 * This ensures alert evaluation has fresh quote data for non-macro corridors,
 * and watchlist items have reasonably fresh data when users view their dashboard.
 *
 * Key features:
 * - Covers corridors with alerts (priority) AND watchlist-only items
 * - Only refreshes corridors NOT covered by B2B sweeps (non-macro)
 * - Per-user corridor budget limits (prevents abuse)
 * - Global corridor budget per run (prevents runaway costs)
 * - Skips corridors with fresh data (< freshness threshold)
 *
 * Runs before alert evaluation (e.g., 30 min before) via EventBridge.
 */

import type { Pool } from 'pg'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getRedisClient } from '../shared/redis'
import { sendJsonMessage } from '../shared/sqs'
import { isMacroCorridor } from '../shared/macro-corridors'
import { parseCorridorId } from '../shared/corridor'
import { FIXED_EXCHANGE_RATES } from '../shared/currency-limits'
import { computeBucketSelection } from '../shared/amount-bucket'
import { initTracing } from '../shared/tracing'

const logger = createLogger('script.alert-corridor-refresh')
initTracing('alert-corridor-refresh-job')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const GLOBAL_CORRIDOR_BUDGET = toNumber(process.env.ALERT_REFRESH_GLOBAL_BUDGET, 500)
const FREE_USER_BUDGET = toNumber(process.env.ALERT_REFRESH_FREE_USER_BUDGET, 20)
const PLUS_USER_BUDGET = toNumber(process.env.ALERT_REFRESH_PLUS_USER_BUDGET, 50)
const FRESHNESS_THRESHOLD_SECONDS = toNumber(process.env.ALERT_REFRESH_FRESHNESS_SECONDS, 10800) // 3 hours
const BUDGET_TTL_SECONDS = 86400 // 24 hours
const USD_EQUIVALENT_AMOUNT = 500

type CorridorSource = 'alert' | 'watchlist'

type UserCorridorInfo = {
  corridorId: string
  userId: string
  planCode: string | null
  source: CorridorSource
  sourceId: string
  priority: number // 1 = alert, 2 = watchlist-only
}

type _ProviderInfo = {
  providerId: string
  corridorId: string
}

const resolveUsdEquivalentBucket = (corridorId: string): number => {
  const parsed = parseCorridorId(corridorId)
  if (!parsed) return USD_EQUIVALENT_AMOUNT

  const currency = parsed.sourceCurrency.toUpperCase()
  const rate = FIXED_EXCHANGE_RATES[currency] ?? 1
  const amount = USD_EQUIVALENT_AMOUNT * rate
  return computeBucketSelection(amount).bucket_used
}

const getUserBudgetKey = (userId: string): string => {
  return `alert_refresh_budget:${userId}`
}

const getUserBudget = async (userId: string, planCode: string | null): Promise<number> => {
  const isPlusOrHigher = planCode && ['plus', 'enterprise'].includes(planCode)
  return isPlusOrHigher ? PLUS_USER_BUDGET : FREE_USER_BUDGET
}

const getRemainingUserBudget = async (userId: string, maxBudget: number): Promise<number> => {
  const redis = await getRedisClient()
  if (!redis) return maxBudget

  const key = getUserBudgetKey(userId)
  const used = await redis.get(key)
  const usedCount = used ? parseInt(used, 10) : 0

  return Math.max(0, maxBudget - usedCount)
}

const incrementUserBudget = async (userId: string, count: number): Promise<void> => {
  const redis = await getRedisClient()
  if (!redis) return

  const key = getUserBudgetKey(userId)
  await redis.incrBy(key, count)
  await redis.expire(key, BUDGET_TTL_SECONDS)
}

const getActiveAlertCorridors = async (pool: Pool): Promise<UserCorridorInfo[]> => {
  const result = await query<{
    corridor_id: string
    user_id: string
    plan_code: string | null
    alert_id: string
  }>(
    `WITH resolved AS (
       SELECT
         wi.id AS watchlist_id,
         wi.user_id,
         ar.id AS alert_id,
         ar.updated_at,
         up.plan_code,
         COALESCE(
           wi.target_payload->>'corridorId',
           UPPER(wi.target_payload->>'from') || '-' ||
           UPPER(wi.target_payload->>'to') || '-' ||
           UPPER(COALESCE(wi.target_payload->>'fromCurrency', 
             (SELECT currency FROM silver.countries WHERE code = UPPER(wi.target_payload->>'from') LIMIT 1))) || '-' ||
           UPPER(COALESCE(wi.target_payload->>'toCurrency',
             (SELECT currency FROM silver.countries WHERE code = UPPER(wi.target_payload->>'to') LIMIT 1)))
         ) AS corridor_id
       FROM silver.alert_rule ar
       JOIN silver.watchlist_item wi ON ar.watchlist_item_id = wi.id
       LEFT JOIN silver.user_plan up ON up.user_id = wi.user_id
         AND up.status IN ('active', 'trialing')
       WHERE ar.enabled = TRUE
         AND wi.deleted_at IS NULL
         AND wi.target_type = 'corridor'
         AND ar.metric != 'sendScore'
     )
     SELECT DISTINCT ON (user_id, corridor_id)
       corridor_id,
       user_id,
       plan_code,
       alert_id
     FROM resolved
     WHERE corridor_id IS NOT NULL AND corridor_id LIKE '%-%-%-%'
     ORDER BY user_id, corridor_id, updated_at DESC`,
    [],
    pool,
  )

  return result.rows.map(row => ({
    corridorId: row.corridor_id.toUpperCase(),
    userId: row.user_id,
    planCode: row.plan_code,
    source: 'alert' as CorridorSource,
    sourceId: row.alert_id,
    priority: 1,
  }))
}

const getWatchlistOnlyCorridors = async (pool: Pool): Promise<UserCorridorInfo[]> => {
  const result = await query<{
    corridor_id: string
    user_id: string
    plan_code: string | null
    watchlist_id: string
  }>(
    `WITH resolved AS (
       SELECT
         wi.id AS watchlist_id,
         wi.user_id,
         wi.updated_at,
         up.plan_code,
         COALESCE(
           wi.target_payload->>'corridorId',
           UPPER(wi.target_payload->>'from') || '-' ||
           UPPER(wi.target_payload->>'to') || '-' ||
           UPPER(COALESCE(wi.target_payload->>'fromCurrency', 
             (SELECT currency FROM silver.countries WHERE code = UPPER(wi.target_payload->>'from') LIMIT 1))) || '-' ||
           UPPER(COALESCE(wi.target_payload->>'toCurrency',
             (SELECT currency FROM silver.countries WHERE code = UPPER(wi.target_payload->>'to') LIMIT 1)))
         ) AS corridor_id
       FROM silver.watchlist_item wi
       LEFT JOIN silver.user_plan up ON up.user_id = wi.user_id
         AND up.status IN ('active', 'trialing')
       WHERE wi.deleted_at IS NULL
         AND wi.target_type = 'corridor'
         AND NOT EXISTS (
           SELECT 1 FROM silver.alert_rule ar
           WHERE ar.watchlist_item_id = wi.id
             AND ar.enabled = TRUE
             AND ar.metric != 'sendScore'
         )
     )
     SELECT DISTINCT ON (user_id, corridor_id)
       corridor_id,
       user_id,
       plan_code,
       watchlist_id
     FROM resolved
     WHERE corridor_id IS NOT NULL AND corridor_id LIKE '%-%-%-%'
     ORDER BY user_id, corridor_id, updated_at DESC`,
    [],
    pool,
  )

  return result.rows
    .filter(row => row.corridor_id && row.corridor_id.includes('-'))
    .map(row => ({
      corridorId: row.corridor_id.toUpperCase(),
      userId: row.user_id,
      planCode: row.plan_code,
      source: 'watchlist' as CorridorSource,
      sourceId: row.watchlist_id,
      priority: 2,
    }))
}

const getCorridorFreshness = async (
  pool: Pool,
  corridorIds: string[],
): Promise<Map<string, number>> => {
  if (corridorIds.length === 0) return new Map()

  const result = await query<{
    corridor_id: string
    age_seconds: number
  }>(
    `SELECT
       corridor_id,
       EXTRACT(EPOCH FROM (NOW() - MAX(collected_at)))::int AS age_seconds
     FROM silver.latest_quote_by_provider
     WHERE corridor_id = ANY($1::text[])
       AND status = 'ok'
     GROUP BY corridor_id`,
    [corridorIds],
    pool,
  )

  const freshness = new Map<string, number>()
  for (const row of result.rows) {
    freshness.set(row.corridor_id, row.age_seconds)
  }

  return freshness
}

type ProviderMethodPair = {
  corridorId: string
  providerId: string
  payinMethod: string
  payoutMethod: string
}

const getActiveProvidersForCorridors = async (
  pool: Pool,
  corridorIds: string[],
): Promise<Map<string, ProviderMethodPair[]>> => {
  if (corridorIds.length === 0) return new Map()

  const result = await query<{
    corridor_id: string
    provider_id: string
    payin_method: string
    payout_method: string
  }>(
    `WITH corridor_data AS (
       SELECT
         UNNEST($1::text[]) AS corridor_id
     ),
     parsed AS (
       SELECT
         cd.corridor_id,
         SPLIT_PART(cd.corridor_id, '-', 1) AS source_country,
         SPLIT_PART(cd.corridor_id, '-', 2) AS dest_country
       FROM corridor_data cd
     )
     SELECT DISTINCT
       p.corridor_id,
       rm.provider_id,
       COALESCE(pcc.payin_method, 'bank') AS payin_method,
       COALESCE(pcc.payout_method, 'bank') AS payout_method
     FROM parsed p
     JOIN silver.rights_matrix rm ON
       rm.stoplist_status = 'active'
       AND rm.status IN ('production', 'beta')
       AND rm.allowed_b2c = TRUE
       AND rm.allowed_collect = TRUE
       AND rm.source_countries IS NOT NULL
       AND rm.source_countries != '{}'
       AND rm.destination_countries IS NOT NULL
       AND rm.destination_countries != '{}'
       AND p.source_country = ANY(rm.source_countries)
       AND p.dest_country = ANY(rm.destination_countries)
     LEFT JOIN silver.provider_corridor_capability pcc ON
       pcc.provider_id = rm.provider_id
       AND pcc.corridor_id = p.corridor_id
       AND pcc.enabled = TRUE`,
    [corridorIds],
    pool,
  )

  const providers = new Map<string, ProviderMethodPair[]>()
  for (const row of result.rows) {
    const list = providers.get(row.corridor_id) ?? []
    list.push({
      corridorId: row.corridor_id,
      providerId: row.provider_id,
      payinMethod: row.payin_method,
      payoutMethod: row.payout_method,
    })
    providers.set(row.corridor_id, list)
  }

  return providers
}

const enqueueRefreshRequests = async (
  pool: Pool,
  corridorId: string,
  providerPairs: ProviderMethodPair[],
): Promise<number> => {
  const queueUrl = config.queues.quoteRefreshUrl
  const queueMode = config.queues.quoteRefreshMode
  const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)

  if (!queueEnabled) {
    logger.debug('queue_disabled', { corridor_id: corridorId })
    return 0
  }

  const amountBucket = resolveUsdEquivalentBucket(corridorId)
  let enqueued = 0

  for (const pair of providerPairs) {
    const { providerId, payinMethod, payoutMethod } = pair
    try {
      const result = await query<{ request_id: string }>(
        `INSERT INTO silver.quote_refresh_request
         (provider_id, corridor_id, amount_bucket, payin_method, payout_method, status, requested_at, last_requested_at, request_count, retry_count)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW(), 1, 0)
         ON CONFLICT (provider_id, corridor_id, amount_bucket, payin_method, payout_method)
         DO UPDATE SET
           status = CASE
             WHEN silver.quote_refresh_request.status IN ('pending', 'processing') THEN silver.quote_refresh_request.status
             ELSE 'pending'
           END,
           last_requested_at = NOW(),
           request_count = silver.quote_refresh_request.request_count + 1,
           retry_count = CASE
             WHEN silver.quote_refresh_request.status IN ('pending', 'processing') THEN silver.quote_refresh_request.retry_count
             ELSE 0
           END
         RETURNING request_id`,
        [providerId, corridorId, amountBucket, payinMethod, payoutMethod],
        pool,
      )

      const requestId = result.rows[0]?.request_id
      if (requestId && queueUrl) {
        await sendJsonMessage(queueUrl, {
          requestId,
          providerId,
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod,
        })
        enqueued++
      }
    } catch (error) {
      logger.warn('enqueue_failed', {
        corridor_id: corridorId,
        provider_id: providerId,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return enqueued
}

export type AlertCorridorRefreshResult = {
  totalAlertCorridors: number
  totalWatchlistCorridors: number
  macroCorridorsSkipped: number
  freshCorridorsSkipped: number
  budgetLimitedCorridors: number
  corridorsRefreshed: number
  alertCorridorsRefreshed: number
  watchlistCorridorsRefreshed: number
  requestsEnqueued: number
  userBudgetsUpdated: number
}

export const runAlertCorridorRefreshJob = async (): Promise<AlertCorridorRefreshResult> => {
  const pool = createPool(config.db.planeAUrl)

  const result: AlertCorridorRefreshResult = {
    totalAlertCorridors: 0,
    totalWatchlistCorridors: 0,
    macroCorridorsSkipped: 0,
    freshCorridorsSkipped: 0,
    budgetLimitedCorridors: 0,
    corridorsRefreshed: 0,
    alertCorridorsRefreshed: 0,
    watchlistCorridorsRefreshed: 0,
    requestsEnqueued: 0,
    userBudgetsUpdated: 0,
  }

  try {
    logger.info('job_start', {
      global_budget: GLOBAL_CORRIDOR_BUDGET,
      free_user_budget: FREE_USER_BUDGET,
      plus_user_budget: PLUS_USER_BUDGET,
      freshness_threshold_seconds: FRESHNESS_THRESHOLD_SECONDS,
    })

    const [alertCorridors, watchlistCorridors] = await Promise.all([
      getActiveAlertCorridors(pool),
      getWatchlistOnlyCorridors(pool),
    ])

    result.totalAlertCorridors = alertCorridors.length
    result.totalWatchlistCorridors = watchlistCorridors.length

    const allCorridors = [...alertCorridors, ...watchlistCorridors]

    if (allCorridors.length === 0) {
      logger.info('no_corridors_to_refresh')
      return result
    }

    const uniqueCorridorIds = [...new Set(allCorridors.map(a => a.corridorId))]
    const nonMacroCorridors = uniqueCorridorIds.filter(c => !isMacroCorridor(c))
    result.macroCorridorsSkipped = uniqueCorridorIds.length - nonMacroCorridors.length

    if (nonMacroCorridors.length === 0) {
      logger.info('all_corridors_are_macro')
      return result
    }

    const freshness = await getCorridorFreshness(pool, nonMacroCorridors)
    const staleCorridors = nonMacroCorridors.filter(c => {
      const age = freshness.get(c)
      return age === undefined || age > FRESHNESS_THRESHOLD_SECONDS
    })
    result.freshCorridorsSkipped = nonMacroCorridors.length - staleCorridors.length

    if (staleCorridors.length === 0) {
      logger.info('all_corridors_are_fresh')
      return result
    }

    const corridorToUsers = new Map<string, UserCorridorInfo[]>()
    for (const item of allCorridors) {
      if (!staleCorridors.includes(item.corridorId)) continue
      const list = corridorToUsers.get(item.corridorId) ?? []
      list.push(item)
      corridorToUsers.set(item.corridorId, list)
    }

    const userBudgets = new Map<string, { max: number; remaining: number }>()
    for (const [, items] of corridorToUsers) {
      for (const item of items) {
        if (!userBudgets.has(item.userId)) {
          const maxBudget = await getUserBudget(item.userId, item.planCode)
          const remaining = await getRemainingUserBudget(item.userId, maxBudget)
          userBudgets.set(item.userId, { max: maxBudget, remaining })
        }
      }
    }

    const corridorsToRefresh: Array<{ corridorId: string; source: CorridorSource }> = []
    const userCorridorCounts = new Map<string, number>()
    let globalBudgetUsed = 0

    const sortedCorridors = [...corridorToUsers.entries()].sort((a, b) => {
      const aMinPriority = Math.min(...a[1].map(i => i.priority))
      const bMinPriority = Math.min(...b[1].map(i => i.priority))
      return aMinPriority - bMinPriority
    })

    for (const [corridorId, items] of sortedCorridors) {
      if (globalBudgetUsed >= GLOBAL_CORRIDOR_BUDGET) {
        result.budgetLimitedCorridors++
        continue
      }

      const sortedItems = items.sort((a, b) => a.priority - b.priority)
      let canRefresh = false
      let refreshSource: CorridorSource = 'watchlist'

      for (const item of sortedItems) {
        const budget = userBudgets.get(item.userId)
        if (!budget || budget.remaining <= 0) continue

        const userCount = userCorridorCounts.get(item.userId) ?? 0
        if (userCount >= budget.max) continue

        canRefresh = true
        refreshSource = item.source
        userCorridorCounts.set(item.userId, userCount + 1)
        budget.remaining--
        break
      }

      if (canRefresh) {
        corridorsToRefresh.push({ corridorId, source: refreshSource })
        globalBudgetUsed++
      } else {
        result.budgetLimitedCorridors++
      }
    }

    if (corridorsToRefresh.length === 0) {
      logger.info('no_corridors_within_budget')
      return result
    }

    const corridorIdsList = corridorsToRefresh.map(c => c.corridorId)
    const providers = await getActiveProvidersForCorridors(pool, corridorIdsList)

    const successfulUserCorridors = new Map<string, number>()

    for (const { corridorId, source } of corridorsToRefresh) {
      const providerPairs = providers.get(corridorId) ?? []
      if (providerPairs.length === 0) {
        logger.debug('no_providers_for_corridor', { corridor_id: corridorId })
        continue
      }

      const enqueued = await enqueueRefreshRequests(pool, corridorId, providerPairs)
      if (enqueued > 0) {
        result.corridorsRefreshed++
        result.requestsEnqueued += enqueued
        if (source === 'alert') {
          result.alertCorridorsRefreshed++
        } else {
          result.watchlistCorridorsRefreshed++
        }

        const usersForCorridor = corridorToUsers.get(corridorId) ?? []
        for (const item of usersForCorridor) {
          const current = successfulUserCorridors.get(item.userId) ?? 0
          successfulUserCorridors.set(item.userId, current + 1)
          break
        }
      }
    }

    for (const [userId, count] of successfulUserCorridors) {
      if (count > 0) {
        await incrementUserBudget(userId, count)
        result.userBudgetsUpdated++
      }
    }

    logger.info('job_complete', result)
    return result
  } catch (error) {
    logger.error('job_failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runAlertCorridorRefreshJob()
    .then(result => {
      console.log('Alert corridor refresh complete:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('Alert corridor refresh failed:', error)
      process.exit(1)
    })
}
