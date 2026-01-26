import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { upsertUsageSnapshot } from '../services/plan-usage'
import { recordRequest } from '../../../shared/api-metrics'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { verifyAlertUnsubscribeToken } from '../services/alert-unsubscribe'
import { AlertRepository, WatchlistRepository } from '../repositories'
import { getCountryByCode } from '../../../shared/countries-currencies'
import { isMacroCorridor, getMacroCorridors } from '../../../shared/macro-corridors'
import { parseCorridorId } from '../../../shared/corridor'

const logger = createLogger('plane-a.alerts')
const pool = getPool(config.db.planeAUrl)
const alertRepository = new AlertRepository(pool)
const watchlistRepository = new WatchlistRepository(pool)
const PLUS_ALERTS_SOFT_LIMIT = 16
const ALERT_COOLDOWN_MINUTES: Record<'weekly' | 'daily', number> = {
  weekly: 10080,
  daily: 1440,
}

const updateAlertUsage = async (userId: string) => {
  try {
    const count = await alertRepository.countByUserId(userId)
    await upsertUsageSnapshot(pool, userId, 'alerts_count', count)
  } catch (error) {
    logger.warn('alert_usage_update_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }
}

const alertRuleSchema = z.object({
  metric: z.enum(['rate', 'recipientGets', 'totalCost', 'fee', 'index', 'midMarketRate', 'sendScore']),
  comparator: z.enum(['gt', 'gte', 'lt', 'lte', 'crosses_above', 'crosses_below']),
  value: z.number(),
  currency: z.string().optional(),
})

const createAlertSchema = z.object({
  watchlistItemId: z.string().uuid(),
  rule: alertRuleSchema,
  frequency: z.enum(['weekly', 'daily']).default('weekly'),
  enabled: z.boolean().default(true),
})

const updateAlertSchema = z.object({
  rule: alertRuleSchema.partial().optional(),
  frequency: z.enum(['weekly', 'daily']).optional(),
  enabled: z.boolean().optional(),
})

const isPlusEntitled = (plan: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  return !!plan
    && ['plus', 'enterprise'].includes(plan.plan_code)
    && ['active', 'trialing'].includes(plan.status)
}

const isActivePlusPlan = (plan: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  return !!plan && plan.plan_code === 'plus' && ['active', 'trialing'].includes(plan.status)
}

const resolveAlertLimit = (plan: Awaited<ReturnType<typeof getUserPlan>> | null): number | 'unlimited' => {
  if (!plan) {
    return 3 // Default free plan limit
  }
  const entitlements = getEntitlementsForPlan(plan.plan_code)
  return entitlements.alerts_max === null ? 'unlimited' : entitlements.alerts_max
}

const resolveCooldownMinutes = (frequency: 'weekly' | 'daily') => {
  return ALERT_COOLDOWN_MINUTES[frequency] ?? 360
}

const isValidSendScore = (value: number) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
}

const normalizeFrequency = (frequency: string | null | undefined): 'weekly' | 'daily' => {
  return frequency === 'daily' ? 'daily' : 'weekly'
}

async function getAlertCount(userId: string): Promise<number> {
  return alertRepository.countByUserId(userId)
}

const SMART_ALERT_MIN_CONFIDENCE = 70
const SMART_ALERT_MIN_SAMPLE_DAYS = 21

type CorridorSignalData = {
  confidence: number | null
  sample_days: number | null
  alert_eligible: boolean
  best_window_start: Date | null
  best_window_end: Date | null
  send_score: number | null
}

const resolveCorridorIdFromWatchlist = (
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

async function checkCorridorSignalData(corridorId: string): Promise<CorridorSignalData | null> {
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

export const alertsRoutes = async (app: FastifyInstance) => {
  app.get('/alerts/corridor-eligibility', async (request, reply) => {
    const startTime = Date.now()

    const queryParams = request.query as {
      from?: string
      to?: string
      fromCurrency?: string
      toCurrency?: string
      corridorId?: string
    }

    let corridorId: string | null = null

    if (queryParams.corridorId) {
      corridorId = queryParams.corridorId.toUpperCase()
    } else if (queryParams.from && queryParams.to) {
      const from = queryParams.from.toUpperCase()
      const to = queryParams.to.toUpperCase()
      const fromCurrency = queryParams.fromCurrency?.toUpperCase()
        ?? getCountryByCode(from)?.currency?.toUpperCase()
        ?? null
      const toCurrency = queryParams.toCurrency?.toUpperCase()
        ?? getCountryByCode(to)?.currency?.toUpperCase()
        ?? null

      if (fromCurrency && toCurrency) {
        corridorId = `${from}-${to}-${fromCurrency}-${toCurrency}`
      }
    }

    if (!corridorId) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/corridor-eligibility', 400, durationSeconds)
      reply.code(400)
      return {
        success: false,
        error: 'invalid_params',
        message: 'Provide corridorId or from/to country codes',
      }
    }

    const isMacro = isMacroCorridor(corridorId)
    const signalData = await checkCorridorSignalData(corridorId)

    const hasConfidence = signalData !== null
      && signalData.confidence !== null
      && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
    const hasSamples = signalData !== null
      && signalData.sample_days !== null
      && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

    const dataReady = hasConfidence && hasSamples

    const now = new Date()
    const inActiveWindow = signalData !== null
      && signalData.best_window_start !== null
      && signalData.best_window_end !== null
      && now >= new Date(signalData.best_window_start)
      && now <= new Date(signalData.best_window_end)

    const signalActive = dataReady
      && signalData !== null
      && signalData.alert_eligible === true
      && inActiveWindow

    let reason: string | null = null
    if (!dataReady) {
      if (signalData === null) {
        reason = 'no_data'
      } else if (!hasSamples) {
        reason = 'insufficient_history'
      } else {
        reason = 'low_confidence'
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000
    recordRequest('GET', '/alerts/corridor-eligibility', 200, durationSeconds)

    return {
      success: true,
      corridorId,
      isMacroCorridor: isMacro,
      smartAlerts: {
        eligible: dataReady,
        reason,
        dataReady,
        signalActive,
        confidence: signalData?.confidence ?? null,
        sampleDays: signalData?.sample_days ?? null,
        sendScore: signalData?.send_score ?? null,
        alertEligible: signalData?.alert_eligible ?? false,
        inActiveWindow,
        activeWindow: signalData?.best_window_start && signalData?.best_window_end
          ? {
              start: new Date(signalData.best_window_start).toISOString(),
              end: new Date(signalData.best_window_end).toISOString(),
            }
          : null,
        requirements: {
          minConfidence: SMART_ALERT_MIN_CONFIDENCE,
          minSampleDays: SMART_ALERT_MIN_SAMPLE_DAYS,
        },
      },
      regularAlerts: {
        eligible: true,
        refreshCadence: isMacro ? 'macro_coverage' : 'on_demand',
        note: isMacro
          ? 'This corridor is covered by our regular data collection.'
          : 'Quotes for this corridor are refreshed when users view it or before alert evaluation.',
      },
    }
  })

  app.get('/alerts/macro-corridors', async (request, reply) => {
    const startTime = Date.now()

    const macroCorridors = getMacroCorridors()

    const bySourceCountry = new Map<string, string[]>()
    for (const corridor of macroCorridors) {
      const list = bySourceCountry.get(corridor.sourceCountry) ?? []
      list.push(corridor.corridorId)
      bySourceCountry.set(corridor.sourceCountry, list)
    }

    const signalResult = await query<{
      corridor_id: string
      confidence: number | null
      sample_days: number | null
    }>(
      `SELECT corridor_id, confidence, sample_days
       FROM silver.corridor_signals
       WHERE confidence >= $1 AND sample_days >= $2`,
      [SMART_ALERT_MIN_CONFIDENCE, SMART_ALERT_MIN_SAMPLE_DAYS],
      pool,
    )

    const smartAlertEligible = new Set(signalResult.rows.map(r => r.corridor_id))

    const durationSeconds = (Date.now() - startTime) / 1000
    recordRequest('GET', '/alerts/macro-corridors', 200, durationSeconds)

    return {
      success: true,
      totalMacroCorridors: macroCorridors.length,
      smartAlertEligibleCount: smartAlertEligible.size,
      bySourceCountry: Object.fromEntries(bySourceCountry),
      corridors: macroCorridors.map(c => ({
        corridorId: c.corridorId,
        sourceCountry: c.sourceCountry,
        destCountry: c.destCountry,
        sourceCurrency: c.sourceCurrency,
        destCurrency: c.destCurrency,
        tier: c.tier,
        isHardCurrencyLane: c.isHardCurrencyLane,
        smartAlertEligible: smartAlertEligible.has(c.corridorId),
      })),
    }
  })

  app.get('/alerts/unsubscribe', async (request, reply) => {
    const startTime = Date.now()
    const token = typeof (request.query as { token?: string }).token === 'string'
      ? (request.query as { token?: string }).token
      : ''

    if (!token) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
      reply.code(400)
      return reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Missing unsubscribe token.</p>')
    }

    const payload = verifyAlertUnsubscribeToken(token)
    if (!payload) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
      reply.code(400)
      return reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Invalid or expired token.</p>')
    }

    const { userId } = payload
    try {
      const result = await pool.query(
        `UPDATE silver.notification_pref
         SET unsubscribed = TRUE, updated_at = NOW()
         WHERE owner_type = 'user' AND user_id = $1`,
        [userId],
      )

      if (result.rowCount === 0) {
        await pool.query(
          `INSERT INTO silver.notification_pref (
             owner_type,
             user_id,
             channel,
             timezone,
             daily_send_hour,
             digest_enabled,
             marketing_opt_in,
             unsubscribed,
             created_at,
             updated_at
           ) VALUES (
             'user',
             $1,
             'email',
             'UTC',
             9,
             FALSE,
             FALSE,
             TRUE,
             NOW(),
             NOW()
           )`,
          [userId],
        )
      }

      try {
        await logAuditEvent(pool, {
          actorId: userId,
          actorType: 'user',
          action: 'alert.unsubscribe',
          entityType: 'notification_pref',
          entityId: userId,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: userId,
          error: getErrorMessage(error),
        })
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 200, durationSeconds)
      const baseUrl = config.alerts.unsubscribe.baseUrl.replace(/\/$/, '')
      return reply
        .type('text/html')
        .send(
          `<h2>You're unsubscribed</h2><p>Email alerts are now disabled.</p><p><a href="${baseUrl}/dashboard?tab=account&section=notifications">Manage notification preferences</a></p>`,
        )
    } catch (error) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 500, durationSeconds)
      logger.error('alert_unsubscribe_failed', {
        user_id: userId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Please try again later.</p>')
    }
  })

  app.get('/alerts', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const rows = await alertRepository.listByUserId(user.user_id)

      const alerts = rows.map((row) => ({
        id: row.id,
        watchlistItemId: row.watchlist_item_id,
        rule: {
          metric: row.metric,
          comparator: row.comparator,
          value: parseFloat(String(row.threshold)),
          currency: row.currency || undefined,
        },
        frequency: row.frequency,
        enabled: row.enabled,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        lastTriggeredAt: row.last_triggered_at?.toISOString(),
      }))

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts', 200, durationSeconds)

      return {
        success: true,
        alerts,
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts', 500, durationSeconds)

      logger.error('alerts_get_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to fetch alerts',
      }
    }
  })

  app.post('/alerts', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const body = createAlertSchema.parse(request.body)

      // Verify watchlist item belongs to user
      const watchlistItem = await watchlistRepository.findById(body.watchlistItemId, user.user_id)

      if (!watchlistItem) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/alerts', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Watchlist item not found',
        }
      }

      // Check if alert already exists
      const existing = await alertRepository.findByWatchlistItemAndRule(
        body.watchlistItemId,
        body.rule.metric,
        body.rule.comparator,
        body.rule.value,
        body.rule.currency || null,
      )

      if (existing) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/alerts', 200, durationSeconds)

        await updateAlertUsage(user.user_id)

        return {
          success: true,
          status: 'already_exists',
          alert: {
            id: existing.id,
            watchlistItemId: body.watchlistItemId,
            rule: body.rule,
            frequency: existing.frequency,
            enabled: body.enabled,
            createdAt: existing.created_at.toISOString(),
            updatedAt: existing.updated_at.toISOString(),
          },
        }
      }

      const plan = await getUserPlan(pool, user.user_id)

      if (body.frequency === 'daily' && !isPlusEntitled(plan)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/alerts', 403, durationSeconds)

        reply.code(403)
        return {
          success: false,
          error: 'forbidden',
          message: 'Daily alerts are available for Plus members only.',
        }
      }

      if (body.rule.metric === 'sendScore') {
        if (!isPlusEntitled(plan)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'forbidden',
            message: 'Smart alerts are available for Plus members only.',
          }
        }

        if (!isValidSendScore(body.rule.value)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

          reply.code(400)
          return {
            success: false,
            error: 'validation_error',
            message: 'Smart score alerts must be between 0 and 100.',
          }
        }

        const corridorId = resolveCorridorIdFromWatchlist(
          watchlistItem.target_type,
          watchlistItem.target_payload as Record<string, unknown>,
        )

        if (!corridorId) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

          reply.code(400)
          return {
            success: false,
            error: 'invalid_corridor',
            message: 'Smart alerts require a valid corridor. Please select a different watchlist item.',
          }
        }

        const signalData = await checkCorridorSignalData(corridorId)
        const hasData = signalData
          && signalData.confidence !== null
          && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
          && signalData.sample_days !== null
          && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

        if (!hasData) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

          reply.code(400)
          return {
            success: false,
            error: 'insufficient_data',
            message: 'Smart alerts need at least 3 weeks of historical data. This corridor doesn\'t have enough data yet.',
            suggestion: 'Try a rate alert instead, or choose a popular corridor like US→Mexico or UK→India.',
            corridorId,
            currentData: signalData
              ? {
                  confidence: signalData.confidence,
                  sampleDays: signalData.sample_days,
                  requiredConfidence: SMART_ALERT_MIN_CONFIDENCE,
                  requiredSampleDays: SMART_ALERT_MIN_SAMPLE_DAYS,
                }
              : null,
          }
        }
      }

      // Check quota
      const limit = resolveAlertLimit(plan)
      if (limit !== 'unlimited') {
        const count = await getAlertCount(user.user_id)
        if (count >= limit) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'limit_reached',
            message: `Free plan supports up to ${limit} alert${limit === 1 ? '' : 's'}.`,
            limit,
          }
        }
      } else if (isActivePlusPlan(plan)) {
        const count = await getAlertCount(user.user_id)
        if (count >= PLUS_ALERTS_SOFT_LIMIT) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'limit_reached',
            message: `Plus alerts are capped at ${PLUS_ALERTS_SOFT_LIMIT} for now. Remove one to add another.`,
            limit: PLUS_ALERTS_SOFT_LIMIT,
          }
        }
      }

      // Create alert
      const resolvedFrequency = body.rule.metric === 'sendScore' ? 'weekly' : body.frequency
      const row = await alertRepository.create({
        watchlist_item_id: body.watchlistItemId,
        metric: body.rule.metric,
        comparator: body.rule.comparator,
        threshold: body.rule.value,
        currency: body.rule.currency || null,
        frequency: resolvedFrequency,
        enabled: body.enabled,
        cooldown_minutes: resolveCooldownMinutes(resolvedFrequency),
      })

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/alerts', 200, durationSeconds)

      logger.info('alert_created', {
        user_id: user.user_id,
        alert_id: row.id,
        watchlist_item_id: body.watchlistItemId,
        metric: body.rule.metric,
      })

      try {
        await logAuditEvent(pool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'alert.create',
          entityType: 'alert_rule',
          entityId: row.id,
          afterSnapshot: {
            watchlist_item_id: row.watchlist_item_id,
            metric: row.metric,
            comparator: row.comparator,
            threshold: row.threshold,
            currency: row.currency,
            frequency: row.frequency,
            enabled: row.enabled,
          },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      await updateAlertUsage(user.user_id)

      return {
        success: true,
        status: 'created',
        alert: {
          id: row.id,
          watchlistItemId: row.watchlist_item_id,
          rule: {
            metric: row.metric as typeof body.rule.metric,
            comparator: row.comparator as typeof body.rule.comparator,
            value: row.threshold,
            currency: row.currency || undefined,
          },
          frequency: row.frequency as typeof resolvedFrequency,
          enabled: row.enabled,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        },
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/alerts', error instanceof z.ZodError ? 400 : 500, durationSeconds)

      if (error instanceof z.ZodError) {
        reply.code(400)
        return {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.errors,
        }
      }

      logger.error('alert_create_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to create alert',
      }
    }
  })

  app.patch('/alerts/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const { id } = request.params as { id: string }
      const body = updateAlertSchema.parse(request.body)

      // Verify alert belongs to user and get current alert
      const existing = await alertRepository.findById(id, user.user_id)

      if (!existing) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        }
      }

      // Build update object
      const updates: {
        metric?: string
        comparator?: string
        threshold?: number
        currency?: string | null
        frequency?: string
        cooldown_minutes?: number
        enabled?: boolean
      } = {}

      if (body.rule) {
        if (body.rule.metric !== undefined) {
          updates.metric = body.rule.metric
        }
        if (body.rule.comparator !== undefined) {
          updates.comparator = body.rule.comparator
        }
        if (body.rule.value !== undefined) {
          updates.threshold = body.rule.value
        }
        if (body.rule.currency !== undefined) {
          updates.currency = body.rule.currency || null
        }
      }

      const nextMetric = updates.metric ?? existing.metric
      const nextThreshold = updates.threshold ?? existing.threshold
      const nextFrequency = body.frequency ?? existing.frequency
      const normalizedFrequency = normalizeFrequency(nextFrequency)
      const resolvedFrequency = nextMetric === 'sendScore' ? 'weekly' : normalizedFrequency
      const requiresPlus = nextMetric === 'sendScore' || resolvedFrequency === 'daily'

      const plan = requiresPlus ? await getUserPlan(pool, user.user_id) : null

      if (resolvedFrequency === 'daily' && !isPlusEntitled(plan)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 403, durationSeconds)

        reply.code(403)
        return {
          success: false,
          error: 'forbidden',
          message: 'Daily alerts are available for Plus members only.',
        }
      }

      if (nextMetric === 'sendScore') {
        if (!isPlusEntitled(plan)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'forbidden',
            message: 'Smart alerts are available for Plus members only.',
          }
        }

        if (!isValidSendScore(nextThreshold)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

          reply.code(400)
          return {
            success: false,
            error: 'validation_error',
            message: 'Smart score alerts must be between 0 and 100.',
          }
        }

        const watchlistItem = await watchlistRepository.findById(existing.watchlist_item_id, user.user_id)
        if (watchlistItem) {
          const corridorId = resolveCorridorIdFromWatchlist(
            watchlistItem.target_type,
            watchlistItem.target_payload as Record<string, unknown>,
          )

          if (!corridorId) {
            const durationSeconds = (Date.now() - startTime) / 1000
            recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

            reply.code(400)
            return {
              success: false,
              error: 'invalid_corridor',
              message: 'Smart alerts require a valid corridor.',
            }
          }

          const signalData = await checkCorridorSignalData(corridorId)
          const hasData = signalData
            && signalData.confidence !== null
            && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
            && signalData.sample_days !== null
            && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

          if (!hasData) {
            const durationSeconds = (Date.now() - startTime) / 1000
            recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

            reply.code(400)
            return {
              success: false,
              error: 'insufficient_data',
              message: 'Smart alerts need at least 3 weeks of historical data. This corridor doesn\'t have enough data yet.',
              suggestion: 'Try a rate alert instead, or choose a popular corridor.',
              corridorId,
            }
          }
        }
      }

      if (body.frequency !== undefined || nextMetric === 'sendScore') {
        updates.frequency = resolvedFrequency
        updates.cooldown_minutes = resolveCooldownMinutes(resolvedFrequency)
      }

      if (body.enabled !== undefined) {
        updates.enabled = body.enabled
      }

      if (Object.keys(updates).length === 0) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

        reply.code(400)
        return {
          success: false,
          error: 'bad_request',
          message: 'No fields to update',
        }
      }

      const row = await alertRepository.update(id, user.user_id, updates)

      if (!row) {
        throw new Error('Failed to update alert')
      }
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('PATCH', '/alerts/:id', 200, durationSeconds)

      try {
        await logAuditEvent(pool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'alert.update',
          entityType: 'alert_rule',
          entityId: row.id,
          beforeSnapshot: {
            watchlist_item_id: existing.watchlist_item_id,
            metric: existing.metric,
            comparator: existing.comparator,
            threshold: existing.threshold,
            currency: existing.currency,
            frequency: existing.frequency,
            enabled: existing.enabled,
          },
          afterSnapshot: {
            watchlist_item_id: row.watchlist_item_id,
            metric: row.metric,
            comparator: row.comparator,
            threshold: row.threshold,
            currency: row.currency,
            frequency: row.frequency,
            enabled: row.enabled,
          },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      if (body.enabled !== undefined) {
        await updateAlertUsage(user.user_id)
      }

      const rule = body.rule ?? {
        metric: row.metric,
        comparator: row.comparator,
      }

      return {
        success: true,
        alert: {
          id: row.id,
          watchlistItemId: row.watchlist_item_id,
          rule: {
            metric: row.metric as typeof rule.metric,
            comparator: row.comparator as typeof rule.comparator,
            value: row.threshold,
            currency: row.currency || undefined,
          },
          frequency: row.frequency,
          enabled: row.enabled,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        },
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('PATCH', '/alerts/:id', error instanceof z.ZodError ? 400 : 500, durationSeconds)

      if (error instanceof z.ZodError) {
        reply.code(400)
        return {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.errors,
        }
      }

      logger.error('alert_update_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to update alert',
      }
    }
  })

  app.delete('/alerts/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const { id } = request.params as { id: string }

      const existing = await alertRepository.findById(id, user.user_id)
      if (!existing) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('DELETE', '/alerts/:id', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        }
      }

      const deleted = await alertRepository.delete(id, user.user_id)

      if (!deleted) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('DELETE', '/alerts/:id', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        }
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('DELETE', '/alerts/:id', 200, durationSeconds)

      logger.info('alert_deleted', {
        user_id: user.user_id,
        alert_id: id,
      })

      try {
        await logAuditEvent(pool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'alert.delete',
          entityType: 'alert_rule',
          entityId: id,
          beforeSnapshot: {
            watchlist_item_id: existing.watchlist_item_id,
            metric: existing.metric,
            comparator: existing.comparator,
            threshold: existing.threshold,
            currency: existing.currency,
            frequency: existing.frequency,
            enabled: existing.enabled,
          },
          afterSnapshot: null,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      await updateAlertUsage(user.user_id)

      return {
        success: true,
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('DELETE', '/alerts/:id', 500, durationSeconds)

      logger.error('alert_delete_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to delete alert',
      }
    }
  })

  app.get('/alerts/smart-notifier', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const plan = await getUserPlan(pool, user.user_id)
      if (!plan || plan.plan_code === 'free') {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/alerts/smart-notifier', 403, durationSeconds)

        reply.code(403)
        return {
          success: false,
          error: 'forbidden',
          message: 'Smart Notifier is available for Plus members only.',
        }
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/smart-notifier', 200, durationSeconds)

      return {
        success: true,
        message: 'Smart alerts send weekly best-time notifications when sufficient data is available.',
        cadence: 'weekly',
        availability: 'data-dependent',
        features: [
          'Weekly best-time window recommendations',
          'Confidence-gated notifications',
          'Latest-available data coverage',
        ],
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/smart-notifier', 500, durationSeconds)

      logger.error('smart_notifier_check_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to check Smart Notifier status',
      }
    }
  })
}
