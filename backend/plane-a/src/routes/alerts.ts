import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
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
import { AlertRepository, FxRateRepository, WatchlistRepository } from '../repositories'

const logger = createLogger('plane-a.alerts')
const pool = getPool(config.db.planeAUrl)
const alertRepository = new AlertRepository(pool)
const fxRateRepository = new FxRateRepository(pool)
const watchlistRepository = new WatchlistRepository(pool)

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
  frequency: z.enum(['realtime', 'hourly', 'daily']).default('daily'),
  enabled: z.boolean().default(true),
})

const updateAlertSchema = z.object({
  rule: alertRuleSchema.partial().optional(),
  frequency: z.enum(['realtime', 'hourly', 'daily']).optional(),
  enabled: z.boolean().optional(),
})

async function getAlertLimit(userId: string): Promise<number | 'unlimited'> {
  const plan = await getUserPlan(pool, userId)
  if (!plan) {
    return 1 // Default free plan limit
  }
  const entitlements = getEntitlementsForPlan(plan.plan_code)
  return entitlements.alerts_max === null ? 'unlimited' : entitlements.alerts_max
}

const isPlusEntitled = (plan: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  return !!plan
    && ['plus', 'enterprise'].includes(plan.plan_code)
    && ['active', 'trialing'].includes(plan.status)
}

const isValidSendScore = (value: number) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
}

async function getAlertCount(userId: string): Promise<number> {
  return alertRepository.countByUserId(userId)
}

async function getCurrentRateForAlert(alertId: string): Promise<number | null> {
  const alertData = await alertRepository.getAlertWithWatchlist(alertId)

  if (!alertData) {
    return null
  }

  const { alert, watchlist_item } = alertData
  const targetPayload = watchlist_item.target_payload

  if (alert.metric === 'midMarketRate' || alert.metric === 'rate') {
    if (watchlist_item.target_type === 'corridor' && targetPayload.from && targetPayload.to) {
      const from = targetPayload.from as string
      const to = targetPayload.to as string
      const rate = await fxRateRepository.getRate(from, to)
      return rate
    } else if (watchlist_item.target_type === 'fxPair' && targetPayload.base && targetPayload.quote) {
      const base = targetPayload.base as string
      const quote = targetPayload.quote as string
      const rate = await fxRateRepository.getRate(base, quote)
      return rate
    }
  }

  return null
}

export const alertsRoutes = async (app: FastifyInstance) => {
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

      // Check quota
      const limit = await getAlertLimit(user.user_id)
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
      }

      if (body.rule.metric === 'sendScore') {
        const plan = await getUserPlan(pool, user.user_id)
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
            frequency: body.frequency,
            enabled: body.enabled,
            createdAt: existing.created_at.toISOString(),
            updatedAt: existing.updated_at.toISOString(),
          },
        }
      }

      // Create alert
      const row = await alertRepository.create({
        watchlist_item_id: body.watchlistItemId,
        metric: body.rule.metric,
        comparator: body.rule.comparator,
        threshold: body.rule.value,
        currency: body.rule.currency || null,
        frequency: body.frequency,
        enabled: body.enabled,
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
          frequency: row.frequency as typeof body.frequency,
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
      if (nextMetric === 'sendScore') {
        const plan = await getUserPlan(pool, user.user_id)
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
      }

      if (body.frequency !== undefined) {
        updates.frequency = body.frequency
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

      return {
        success: true,
        alert: {
          id: row.id,
          watchlistItemId: row.watchlist_item_id,
          rule: {
            metric: row.metric as typeof body.rule.metric,
            comparator: row.comparator as typeof body.rule.comparator,
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
        message: 'Smart Notifier is available for Plus members.',
        features: [
          'AI-powered rate predictions',
          'Optimal send time recommendations',
          'Market trend analysis',
          'Personalized alerts based on your transfer patterns',
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
