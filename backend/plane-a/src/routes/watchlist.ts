import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { getCountryByCode } from '../../../shared/countries-currencies'
import { FIXED_EXCHANGE_RATES } from '../../../shared/currency-limits'
import { computeBucketSelection } from '../../../shared/amount-bucket'
import { requireAuth } from '../plugins/auth-plugin'
import { getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { upsertUsageSnapshot } from '../services/plan-usage'
import { recordRequest } from '../../../shared/api-metrics'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { WatchlistRepository } from '../repositories'

const logger = createLogger('plane-a.watchlist')
const pool = getPool(config.db.planeAUrl)
const watchlistRepository = new WatchlistRepository(pool)
const USD_EQUIVALENT_AMOUNT = 500

const updateWatchlistUsage = async (userId: string) => {
  try {
    const count = await watchlistRepository.countByUserId(userId)
    await upsertUsageSnapshot(pool, userId, 'watchlist_count', count)
  } catch (error) {
    logger.warn('watchlist_usage_update_failed', {
      user_id: userId,
      error: getErrorMessage(error),
    })
  }
}

const resolveUsdEquivalentBucket = (fromCountry: string): number => {
  const currency = getCountryByCode(fromCountry.toUpperCase())?.currency?.toUpperCase() || 'USD'
  const rate = FIXED_EXCHANGE_RATES[currency] ?? 1
  const amount = USD_EQUIVALENT_AMOUNT * rate
  return computeBucketSelection(amount).bucket_used
}

const watchTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('corridor'),
    from: z.string(),
    to: z.string(),
    method: z.string().optional(),
  }),
  z.object({
    type: z.literal('fxPair'),
    base: z.string(),
    quote: z.string(),
  }),
  z.object({
    type: z.literal('pulseChart'),
    chartId: z.string(),
  }),
  z.object({
    type: z.literal('guide'),
    slug: z.string(),
  }),
])

const createWatchlistItemSchema = z.object({
  target: watchTargetSchema,
  label: z.string().optional(),
})

const updateWatchlistItemSchema = z.object({
  label: z.string().optional(),
})

function targetToPayload(target: z.infer<typeof watchTargetSchema>): Record<string, unknown> {
  switch (target.type) {
    case 'corridor':
      return {
        from: target.from.toUpperCase(),
        to: target.to.toUpperCase(),
        method: target.method ?? 'bank',
        amountBucket: resolveUsdEquivalentBucket(target.from),
      }
    case 'fxPair':
      return {
        base: target.base.toUpperCase(),
        quote: target.quote.toUpperCase(),
      }
    case 'pulseChart':
      return { chartId: target.chartId }
    case 'guide':
      return { slug: target.slug }
  }
}

function payloadToTarget(
  targetType: string,
  payload: Record<string, unknown>,
): z.infer<typeof watchTargetSchema> | null {
  switch (targetType) {
    case 'corridor':
      if (typeof payload.from === 'string' && typeof payload.to === 'string') {
        return {
          type: 'corridor',
          from: payload.from,
          to: payload.to,
          method: typeof payload.method === 'string' ? payload.method : undefined,
        }
      }
      return null
    case 'fxPair':
      if (typeof payload.base === 'string' && typeof payload.quote === 'string') {
        return {
          type: 'fxPair',
          base: payload.base,
          quote: payload.quote,
        }
      }
      return null
    case 'pulseChart':
      if (typeof payload.chartId === 'string') {
        return {
          type: 'pulseChart',
          chartId: payload.chartId,
        }
      }
      return null
    case 'guide':
      if (typeof payload.slug === 'string') {
        return {
          type: 'guide',
          slug: payload.slug,
        }
      }
      return null
    default:
      return null
  }
}

function defaultLabel(target: z.infer<typeof watchTargetSchema>): string {
  switch (target.type) {
    case 'corridor':
      return `${target.from}→${target.to}${target.method ? ` • ${target.method}` : ''}`
    case 'fxPair':
      return `${target.base}/${target.quote}`
    case 'pulseChart':
      return `Pulse chart ${target.chartId}`
    case 'guide':
      return `Guide: ${target.slug}`
  }
}

async function getWatchlistLimit(
  userId: string,
): Promise<{ limit: number | 'unlimited'; plan: Awaited<ReturnType<typeof getUserPlan>> | null }> {
  const plan = await getUserPlan(pool, userId)
  if (!plan) {
    return { limit: 3, plan: null } // Default free plan limit
  }
  const isPlanActive = plan.status === 'active' || plan.status === 'trialing'
  const effectivePlanCode = isPlanActive ? plan.plan_code : 'free'
  const entitlements = getEntitlementsForPlan(effectivePlanCode)
  const limit = entitlements.watchlist_items === null ? 'unlimited' : entitlements.watchlist_items
  return { limit, plan }
}

async function getWatchlistCount(userId: string): Promise<number> {
  return watchlistRepository.countByUserId(userId)
}

export const watchlistRoutes = async (app: FastifyInstance) => {
  app.get('/watchlist', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const rows = await watchlistRepository.listByUserId(user.user_id)

      const items = rows.map((row) => {
        const target = payloadToTarget(row.target_type, row.target_payload as Record<string, unknown>)
        if (!target) {
          logger.warn('invalid_watchlist_item_target', {
            id: row.id,
            target_type: row.target_type,
          })
          return null
        }

        return {
          id: row.id,
          target,
          label: row.label || defaultLabel(target),
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        }
      }).filter((item): item is NonNullable<typeof item> => item !== null)

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/watchlist', 200, durationSeconds)

      return {
        success: true,
        items,
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/watchlist', 500, durationSeconds)

      logger.error('watchlist_get_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to fetch watchlist',
      }
    }
  })

  app.post('/watchlist', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const body = createWatchlistItemSchema.parse(request.body)
      const target = body.target

      // Check if item already exists
      const targetPayload = targetToPayload(target)
      const matchPayload = target.type === 'corridor'
        ? {
            from: (targetPayload.from as string),
            to: (targetPayload.to as string),
            method: (targetPayload.method as string | undefined) ?? 'bank',
          }
        : targetPayload
      const existing = await watchlistRepository.findByTarget(user.user_id, target.type, matchPayload)

      if (existing) {
        if (target.type === 'corridor') {
          const existingPayload = existing.target_payload as Record<string, unknown>
          if (existingPayload.amountBucket === undefined) {
            await pool.query(
              `UPDATE silver.watchlist_item
               SET target_payload = target_payload || $1::jsonb, updated_at = NOW()
               WHERE id = $2`,
              [JSON.stringify({ amountBucket: (targetPayload as Record<string, unknown>).amountBucket }), existing.id],
            )
          }
        }
        // Update existing item
        const beforeLabel = existing.label
        const updated = await watchlistRepository.update(existing.id, user.user_id, { label: body.label })
        if (!updated) {
          throw new Error('Failed to update watchlist item')
        }

        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('POST', '/watchlist', 200, durationSeconds)

        try {
          await logAuditEvent(pool, {
            actorId: user.user_id,
            actorType: 'user',
            actorRole: user.role ?? undefined,
            action: 'watchlist.update',
            entityType: 'watchlist_item',
            entityId: updated.id,
            beforeSnapshot: {
              target_type: existing.target_type,
              target_payload: existing.target_payload,
              label: beforeLabel,
            },
            afterSnapshot: {
              target_type: updated.target_type,
              target_payload: updated.target_payload,
              label: updated.label,
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

        await updateWatchlistUsage(user.user_id)

        return {
          success: true,
          status: 'already_saved',
          item: {
            id: updated.id,
            target,
            label: body.label || updated.label || defaultLabel(target),
            createdAt: updated.created_at.toISOString(),
            updatedAt: updated.updated_at.toISOString(),
          },
        }
      }

      // Check quota
      const { limit, plan } = await getWatchlistLimit(user.user_id)
      if (limit !== 'unlimited') {
        const count = await getWatchlistCount(user.user_id)
        if (count >= limit) {
          const isPlanActive = plan?.status === 'active' || plan?.status === 'trialing'
          const effectivePlanCode = plan && isPlanActive ? plan.plan_code : 'free'
          const planLabel =
            effectivePlanCode === 'plus'
              ? 'Plus'
              : effectivePlanCode === 'enterprise'
                ? 'Enterprise'
                : 'Free'
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('POST', '/watchlist', 403, durationSeconds)

          reply.code(403)
          return {
            success: false,
            error: 'limit_reached',
            message: `${planLabel} plan supports up to ${limit} saved item${limit === 1 ? '' : 's'}.`,
            limit,
          }
        }
      }

      // Create new item
      const label = body.label || defaultLabel(target)
      const row = await watchlistRepository.create({
        owner_type: 'user',
        user_id: user.user_id,
        target_type: target.type,
        target_payload: targetPayload,
        label,
      })
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/watchlist', 200, durationSeconds)

      logger.info('watchlist_item_created', {
        user_id: user.user_id,
        item_id: row.id,
        target_type: target.type,
      })

      try {
        await logAuditEvent(pool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'watchlist.create',
          entityType: 'watchlist_item',
          entityId: row.id,
          afterSnapshot: {
            target_type: row.target_type,
            target_payload: row.target_payload,
            label: row.label,
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

      await updateWatchlistUsage(user.user_id)

      return {
        success: true,
        status: 'saved',
        item: {
          id: row.id,
          target,
          label,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        },
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/watchlist', error instanceof z.ZodError ? 400 : 500, durationSeconds)

      if (error instanceof z.ZodError) {
        reply.code(400)
        return {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.errors,
        }
      }

      logger.error('watchlist_create_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to create watchlist item',
      }
    }
  })

  app.patch('/watchlist/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const { id } = request.params as { id: string }
      const body = updateWatchlistItemSchema.parse(request.body)

      const before = await watchlistRepository.findById(id, user.user_id)
      const row = await watchlistRepository.update(id, user.user_id, { label: body.label })

      if (!row) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('PATCH', '/watchlist/:id', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Watchlist item not found',
        }
      }

      const target = payloadToTarget(row.target_type, row.target_payload as Record<string, unknown>)
      if (!target) {
        reply.code(500)
        return {
          success: false,
          error: 'invalid_item',
          message: 'Invalid watchlist item data',
        }
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('PATCH', '/watchlist/:id', 200, durationSeconds)

      if (before) {
        try {
          await logAuditEvent(pool, {
            actorId: user.user_id,
            actorType: 'user',
            actorRole: user.role ?? undefined,
            action: 'watchlist.update',
            entityType: 'watchlist_item',
            entityId: row.id,
            beforeSnapshot: {
              target_type: before.target_type,
              target_payload: before.target_payload,
              label: before.label,
            },
            afterSnapshot: {
              target_type: row.target_type,
              target_payload: row.target_payload,
              label: row.label,
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
      }

      return {
        success: true,
        item: {
          id: row.id,
          target,
          label: row.label || defaultLabel(target),
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        },
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('PATCH', '/watchlist/:id', error instanceof z.ZodError ? 400 : 500, durationSeconds)

      if (error instanceof z.ZodError) {
        reply.code(400)
        return {
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: error.errors,
        }
      }

      logger.error('watchlist_update_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to update watchlist item',
      }
    }
  })

  app.delete('/watchlist/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const startTime = Date.now()
    const user = request.user!

    try {
      const { id } = request.params as { id: string }

      const existing = await watchlistRepository.findById(id, user.user_id)
      const deleted = await watchlistRepository.softDelete(id, user.user_id)

      if (!deleted) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('DELETE', '/watchlist/:id', 404, durationSeconds)

        reply.code(404)
        return {
          success: false,
          error: 'not_found',
          message: 'Watchlist item not found',
        }
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('DELETE', '/watchlist/:id', 200, durationSeconds)

      logger.info('watchlist_item_deleted', {
        user_id: user.user_id,
        item_id: id,
      })

      if (existing) {
        try {
          await logAuditEvent(pool, {
            actorId: user.user_id,
            actorType: 'user',
            actorRole: user.role ?? undefined,
            action: 'watchlist.delete',
            entityType: 'watchlist_item',
            entityId: id,
            beforeSnapshot: {
              target_type: existing.target_type,
              target_payload: existing.target_payload,
              label: existing.label,
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
      }

      await updateWatchlistUsage(user.user_id)

      return {
        success: true,
      }
    } catch (error: unknown) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('DELETE', '/watchlist/:id', 500, durationSeconds)

      logger.error('watchlist_delete_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'Failed to delete watchlist item',
      }
    }
  })
}
