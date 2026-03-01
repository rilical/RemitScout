import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { recordRequest } from '../../../../shared/api-metrics'
import { config } from '../../../../shared/config'
import { isMacroCorridor } from '../../../../shared/macro-corridors'
import { SMART_ALERT_MIN_CONFIDENCE, SMART_ALERT_MIN_SAMPLE_DAYS } from '../../../../shared/constants'
import { ValidationError, NotFoundError } from '../../../../shared/errors'
import { requireAuth } from '../../plugins/auth-plugin'
import { getUserPlan } from '../../services/user-plan'
import { getRequestContext, logAuditEvent } from '../../services/audit-log'
import { getErrorMessage } from '../../types/errors'
import {
  checkCorridorSignalData,
  computeQuoteCoverage,
  createAlertSchema,
  getAlertCount,
  getSupportedAlertMetricsForTargetType,
  isPlanActiveStatus,
  isPlusEntitled,
  isMetricSupportedForTarget,
  isValidSendScore,
  logger,
  normalizeFrequency,
  REGULAR_ALERT_SUPPORTED_METRICS,
  resolveAlertLimit,
  resolveBucketForEligibility,
  resolveCooldownMinutes,
  resolveCorridorIdFromWatchlist,
  resolveMethodForEligibility,
  SMART_ALERT_NOT_OFFERED_MESSAGE,
  toPositiveNumberOrNull,
  updateAlertSchema,
  updateAlertUsage,
} from './shared'

const INDEX_THRESHOLD_METRICS = new Set(['rci_threshold', 'rvi_threshold'])

export const registerAlertsCrudRoutes = async (app: FastifyInstance) => {
  const { pool, repositories } = app.container
  const alertRepository = repositories.alert
  const watchlistRepository = repositories.watchlist
  const rightsMatrixRepository = repositories.rightsMatrix

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

                throw new NotFoundError('Not found', { details: {
          success: false,
          error: 'not_found',
          message: 'Watchlist item not found',
        } })
      }

      const supportedMetricsForTarget = getSupportedAlertMetricsForTargetType(watchlistItem.target_type)
      if (!isMetricSupportedForTarget(watchlistItem.target_type, body.rule.metric)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/alerts', 400, durationSeconds)

                throw new ValidationError('Invalid request', { details: {
          success: false,
          error: 'unsupported_metric',
          message: `${body.rule.metric} alerts are not supported for ${watchlistItem.target_type} targets.`,
          targetType: watchlistItem.target_type,
          supportedMetrics: supportedMetricsForTarget,
        } })
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

        await updateAlertUsage({ pool, alertRepository }, user.user_id)

        return {
          success: true,
          status: 'already_exists',
          alert: {
            id: existing.id,
            watchlistItemId: body.watchlistItemId,
            rule: body.rule,
            frequency: existing.frequency,
            enabled: existing.enabled,
            createdAt: existing.created_at.toISOString(),
            updatedAt: existing.updated_at.toISOString(),
          },
        }
      }

      const plan = await getUserPlan(pool, user.user_id)
      const isEnterpriseActive = !!plan && plan.plan_code === 'enterprise' && isPlanActiveStatus(plan.status)

      if (INDEX_THRESHOLD_METRICS.has(body.rule.metric)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        if (!isEnterpriseActive) {
          recordRequest('POST', '/alerts', 403, durationSeconds)
          reply.code(403)
          return {
            success: false,
            error: 'forbidden',
            message: 'Index threshold alerts are available for Enterprise members only.',
          }
        }
      }

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

                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'validation_error',
            message: 'Smart score alerts must be between 0 and 100.',
          } })
        }

        const corridorId = resolveCorridorIdFromWatchlist(
          watchlistItem.target_type,
          watchlistItem.target_payload as Record<string, unknown>,
        )

        if (!corridorId) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'invalid_corridor',
            message: 'Smart alerts require a valid corridor. Please select a different watchlist item.',
          } })
        }

        if (!isMacroCorridor(corridorId)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'smart_not_offered',
            message: SMART_ALERT_NOT_OFFERED_MESSAGE,
            corridorId,
          } })
        }

        const signalData = await checkCorridorSignalData(corridorId, pool)
        const hasData = signalData
          && signalData.confidence !== null
          && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
          && signalData.sample_days !== null
          && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

        if (!hasData) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)

                    throw new ValidationError('Invalid request', { details: {
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
          } })
        }
      }

      if (watchlistItem.target_type === 'corridor' && REGULAR_ALERT_SUPPORTED_METRICS.includes(body.rule.metric as any)) {
        const corridorId = resolveCorridorIdFromWatchlist(
          watchlistItem.target_type,
          watchlistItem.target_payload as Record<string, unknown>,
        )
        const payload = watchlistItem.target_payload as Record<string, unknown>
        const payinMethod = resolveMethodForEligibility(payload.method)
        const amountBucket =
          toPositiveNumberOrNull(payload.amountBucket) ?? resolveBucketForEligibility(corridorId || '')

        if (!corridorId) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)
                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'invalid_corridor',
            message: 'Quote-based alerts require a valid corridor.',
          } })
        }

        const maxAgeSeconds = Math.max(60, Math.floor(config.planeA.b2c.maxQuoteAgeSeconds ?? 1800))
        const quoteCoverage = await computeQuoteCoverage({
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod: 'bank',
          maxAgeSeconds,
          pool,
          rightsMatrixRepository,
        })

        if (!quoteCoverage.supported) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 400, durationSeconds)
                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'quote_not_supported',
            message: 'Quote-based alerts aren’t available for this corridor yet. Use an FX Rate Alert instead.',
            corridorId,
            quoteCoverage,
          } })
        }
      }

      // Check quota
      const limit = resolveAlertLimit(plan)
      if (limit !== 'unlimited') {
        const count = await getAlertCount(alertRepository, user.user_id)
        if (count >= limit) {
          const effectivePlanCode = plan && isPlanActiveStatus(plan.status) ? plan.plan_code : 'free'
          const planLabel =
            effectivePlanCode === 'plus'
              ? 'Plus'
              : effectivePlanCode === 'enterprise'
                ? 'Enterprise'
                : 'Free'
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/alerts', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'limit_reached',
            message: `${planLabel} plan supports up to ${limit} alert${limit === 1 ? '' : 's'}.`,
            limit,
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

      await updateAlertUsage({ pool, alertRepository }, user.user_id)

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
      if (error instanceof z.ZodError) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/alerts', 400, durationSeconds)
        throw new ValidationError('Invalid request', { details: {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.issues,
        } })
      }
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/alerts', 500, durationSeconds)

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

                throw new NotFoundError('Not found', { details: {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        } })
      }

      const watchlistItem = await watchlistRepository.findById(existing.watchlist_item_id, user.user_id)

      if (!watchlistItem) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 404, durationSeconds)

                throw new NotFoundError('Not found', { details: {
          success: false,
          error: 'not_found',
          message: 'Watchlist item not found',
        } })
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
      const supportedMetricsForTarget = getSupportedAlertMetricsForTargetType(watchlistItem.target_type)

      if (!isMetricSupportedForTarget(watchlistItem.target_type, nextMetric)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

        throw new ValidationError('Invalid request', { details: {
          success: false,
          error: 'unsupported_metric',
          message: `${nextMetric} alerts are not supported for ${watchlistItem.target_type} targets.`,
          targetType: watchlistItem.target_type,
          supportedMetrics: supportedMetricsForTarget,
        } })
      }

      const plan = requiresPlus ? await getUserPlan(pool, user.user_id) : null
      const planForMetric = plan ?? await getUserPlan(pool, user.user_id)
      const isEnterpriseActive = !!planForMetric
        && planForMetric.plan_code === 'enterprise'
        && isPlanActiveStatus(planForMetric.status)

      if (INDEX_THRESHOLD_METRICS.has(nextMetric)) {
        const durationSeconds = (Date.now() - startTime) / 1000
        if (!isEnterpriseActive) {
          recordRequest('PATCH', '/alerts/:id', 403, durationSeconds)
          reply.code(403)
          return {
            success: false,
            error: 'forbidden',
            message: 'Index threshold alerts are available for Enterprise members only.',
          }
        }
      }

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

                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'validation_error',
            message: 'Smart score alerts must be between 0 and 100.',
          } })
        }

        const corridorId = resolveCorridorIdFromWatchlist(
          watchlistItem.target_type,
          watchlistItem.target_payload as Record<string, unknown>,
        )

        if (!corridorId) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

                      throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'invalid_corridor',
            message: 'Smart alerts require a valid corridor.',
          } })
        }

        if (!isMacroCorridor(corridorId)) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

                      throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'smart_not_offered',
            message: SMART_ALERT_NOT_OFFERED_MESSAGE,
            corridorId,
          } })
        }

        const signalData = await checkCorridorSignalData(corridorId, pool)
        const hasData = signalData
          && signalData.confidence !== null
          && signalData.confidence >= SMART_ALERT_MIN_CONFIDENCE
          && signalData.sample_days !== null
          && signalData.sample_days >= SMART_ALERT_MIN_SAMPLE_DAYS

        if (!hasData) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)

                      throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'insufficient_data',
            message: 'Smart alerts need at least 3 weeks of historical data. This corridor does not have enough data yet.',
            suggestion: 'Try a rate alert instead, or choose a popular corridor.',
            corridorId,
            currentData: signalData
              ? {
                  confidence: signalData.confidence,
                  sampleDays: signalData.sample_days,
                  requiredConfidence: SMART_ALERT_MIN_CONFIDENCE,
                  requiredSampleDays: SMART_ALERT_MIN_SAMPLE_DAYS,
                }
              : null,
          } })
        }
      }

      if (nextMetric !== 'sendScore' && REGULAR_ALERT_SUPPORTED_METRICS.includes(nextMetric as any)) {
        if (watchlistItem.target_type !== 'corridor') {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)
                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'invalid_corridor',
            message: 'Quote-based alerts require a corridor watchlist item.',
          } })
        }

        const corridorId = resolveCorridorIdFromWatchlist(
          watchlistItem.target_type,
          watchlistItem.target_payload as Record<string, unknown>,
        )
        if (!corridorId) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)
                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'invalid_corridor',
            message: 'Quote-based alerts require a valid corridor.',
          } })
        }

        const payload = watchlistItem.target_payload as Record<string, unknown>
        const payinMethod = resolveMethodForEligibility(payload.method)
        const amountBucket =
          toPositiveNumberOrNull(payload.amountBucket) ?? resolveBucketForEligibility(corridorId)
        const maxAgeSeconds = Math.max(60, Math.floor(config.planeA.b2c.maxQuoteAgeSeconds ?? 1800))
        const quoteCoverage = await computeQuoteCoverage({
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod: 'bank',
          maxAgeSeconds,
          pool,
          rightsMatrixRepository,
        })

        if (!quoteCoverage.supported) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)
                    throw new ValidationError('Invalid request', { details: {
            success: false,
            error: 'quote_not_supported',
            message: 'Quote-based alerts aren’t available for this corridor yet. Use an FX Rate Alert instead.',
            corridorId,
            quoteCoverage,
          } })
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

                throw new ValidationError('Invalid request', { details: {
          success: false,
          error: 'bad_request',
          message: 'No fields to update',
        } })
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
        await updateAlertUsage({ pool, alertRepository }, user.user_id)
      }

      return {
        success: true,
        alert: {
          id: row.id,
          watchlistItemId: row.watchlist_item_id,
          rule: {
            metric: row.metric as z.infer<typeof createAlertSchema>['rule']['metric'],
            comparator: row.comparator as z.infer<typeof createAlertSchema>['rule']['comparator'],
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
      if (error instanceof z.ZodError) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/alerts/:id', 400, durationSeconds)
        throw new ValidationError('Invalid request', { details: {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.issues,
        } })
      }
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('PATCH', '/alerts/:id', 500, durationSeconds)

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

                throw new NotFoundError('Not found', { details: {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        } })
      }

      const deleted = await alertRepository.delete(id, user.user_id)

      if (!deleted) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('DELETE', '/alerts/:id', 404, durationSeconds)

                throw new NotFoundError('Not found', { details: {
          success: false,
          error: 'not_found',
          message: 'Alert not found',
        } })
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

      await updateAlertUsage({ pool, alertRepository }, user.user_id)

      return { success: true }
    } catch (error: unknown) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }

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
}
