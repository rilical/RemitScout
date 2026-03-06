import type { FastifyInstance } from 'fastify'
import type Stripe from 'stripe'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import type { AuthUser } from '../auth/types'
import { requireAuth } from '../plugins/auth-plugin'
import { upsertUserAccount } from '../services/user-account'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { resolveEffectiveEntitlements } from '../services/effective-entitlements'
import { getUsageForUser } from '../services/plan-usage'
import { countActiveApiKeys, createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '../services/api-keys'
import { getStripeClient, isStripeConfigured } from '../services/stripe-client'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage, getErrorStack } from '../types/errors'
import { config } from '../../../shared/config'
import { AuthenticationError, ValidationError, NotFoundError } from '../../../shared/errors'
import { RETAIL_API_KEY_SCOPES, isRetailApiKeyScope } from './api-key-access'
import { createCapabilityAccessDeniedResponse } from '../services/plan-state'
import {
  enqueueExportJob,
  getExportPipelineStatus,
  getSignedExportDownload,
} from './exports.service'
import { buildPublishedEmbedListItem } from '../services/published-embeds'

const logger = createLogger('plane-a.me')

const profileUpdateSchema = z.object({
  name: z.string().max(200).optional(),
})

const passwordUpdateSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8),
})

const apiKeyCreateSchema = z.object({
  name: z.string().max(80).optional(),
  scopes: z.array(z.string().max(64)).max(20).optional(),
})

const exportJobCreateSchema = z.object({
  jobType: z.enum(['history', 'watchlist', 'alerts', 'all', 'indices']),
  format: z.enum(['csv', 'pdf']).default('csv'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  corridorIds: z.array(z.string().min(1)).max(50).optional(),
})

type BillingInfo = {
  next_billing_date: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  amount: number | null
  currency: string | null
  status: string | null
  payment_method: {
    type: string | null
    last4: string | null
    brand: string | null
    exp_month: number | null
    exp_year: number | null
  } | null
}

const toIsoFromSeconds = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value)) return null
  return new Date(value * 1000).toISOString()
}

const buildBillingInfo = async (plan: Awaited<ReturnType<typeof getUserPlan>>): Promise<BillingInfo> => {
  if (!plan || !isStripeConfigured() || !plan.stripe_customer_id) {
    return {
      next_billing_date: null,
      current_period_end: plan?.current_period_end ?? null,
      cancel_at_period_end: false,
      amount: null,
      currency: null,
      status: plan?.status ?? null,
      payment_method: null,
    }
  }

  try {
    const stripe = getStripeClient()
    const subscriptionId = plan.stripe_subscription_id
    let subscription: Stripe.Subscription | null = null

    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'items.data.price'],
      }) as Stripe.Subscription
    } else {
      const list = await stripe.subscriptions.list({
        customer: plan.stripe_customer_id,
        status: 'all',
        limit: 1,
        expand: ['data.default_payment_method', 'data.items.data.price'],
      })
      subscription = list.data[0] ?? null
    }

    if (!subscription) {
      return {
        next_billing_date: plan.current_period_end ?? null,
        current_period_end: plan.current_period_end ?? null,
        cancel_at_period_end: false,
        amount: null,
        currency: null,
        status: plan.status ?? null,
        payment_method: null,
      }
    }

    const price = subscription.items.data[0]?.price
    const unitAmount = typeof price?.unit_amount === 'number' ? price.unit_amount / 100 : null
    const currency = price?.currency ? price.currency.toUpperCase() : null
    const subscriptionWithPeriodEnd =
      subscription as Stripe.Subscription & { current_period_end?: number | null }
    const currentPeriodEnd = toIsoFromSeconds(subscriptionWithPeriodEnd.current_period_end ?? null)

    const paymentMethod = subscription.default_payment_method
    const paymentMethodDetails =
      paymentMethod && typeof paymentMethod === 'object' && 'type' in paymentMethod
        ? {
            type: paymentMethod.type ?? null,
            last4: paymentMethod.card?.last4 ?? null,
            brand: paymentMethod.card?.brand ?? null,
            exp_month: paymentMethod.card?.exp_month ?? null,
            exp_year: paymentMethod.card?.exp_year ?? null,
          }
        : null

    return {
      next_billing_date: currentPeriodEnd,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      amount: unitAmount,
      currency,
      status: subscription.status ?? plan.status ?? null,
      payment_method: paymentMethodDetails,
    }
  } catch (error: unknown) {
    logger.warn('billing_info_fetch_failed', {
      user_id: plan?.user_id ?? 'unknown',
      error: getErrorMessage(error),
    })
    return {
      next_billing_date: plan?.current_period_end ?? null,
      current_period_end: plan?.current_period_end ?? null,
      cancel_at_period_end: false,
      amount: null,
      currency: null,
      status: plan?.status ?? null,
      payment_method: null,
    }
  }
}

const parseBearerToken = (header?: string) => {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null
  }
  return token
}

const hasTierOneScope = (scopes?: string[]) => {
  if (!scopes || scopes.length === 0) return false
  return scopes.some((scope) => scope.trim().toLowerCase() === 'tier:1')
}

const findUnsupportedApiKeyScopes = (scopes?: string[]) => {
  if (!scopes || scopes.length === 0) return []
  return Array.from(
    new Set(
      scopes
        .map((scope) => scope.trim().toLowerCase())
        .filter((scope) => scope && scope !== 'tier:1' && !isRetailApiKeyScope(scope)),
    ),
  )
}

const verifySupabasePassword = async (email: string, password: string): Promise<boolean> => {
  const baseUrl = config.auth.supabase.url.replace(/\/$/, '')
  const key = config.auth.supabase.publishableKey
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (response.ok) {
    return true
  }

  if (response.status === 400 || response.status === 401) {
    return false
  }

  const payload = await response.text()
  throw new AuthenticationError(payload || `Supabase auth failed with status ${response.status}`)
}

const updateSupabasePassword = async (accessToken: string, newPassword: string): Promise<void> => {
  const baseUrl = config.auth.supabase.url.replace(/\/$/, '')
  const key = config.auth.supabase.publishableKey
  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: newPassword,
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new AuthenticationError(payload || `Supabase password update failed with status ${response.status}`)
  }
}

export const meRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const userAccountRepository = repositories.userAccount
  const exportJobRepository = repositories.exportJob

  const loadUserPlan = async (user: AuthUser) => {
    await upsertUserAccount(planeAPool, user)
    await ensureUserPlan(planeAPool, user.user_id)

    const plan = await getUserPlan(planeAPool, user.user_id)
    if (!plan) {
      logger.error('plan_not_found', {
        user_id: user.user_id,
      })
      throw new Error('plan_not_found')
    }

    return plan
  }

  const resolveEffectiveUserAccess = async (
    user: AuthUser,
    options?: { cancelAtPeriodEnd?: boolean | null; currentPeriodEnd?: string | null },
  ) => {
    const plan = await loadUserPlan(user)

    const effective = await resolveEffectiveEntitlements({
      pool: planeAPool,
      userId: user.user_id,
      email: user.email ?? null,
      supabaseRole: user.role ?? null,
      plan,
      cancelAtPeriodEnd: options?.cancelAtPeriodEnd,
      currentPeriodEnd: options?.currentPeriodEnd,
    })

    return {
      plan,
      effective,
    }
  }

  const denyCapability = (
    reply: { code: (statusCode: number) => unknown },
    effective: Awaited<ReturnType<typeof resolveEffectiveEntitlements>>,
    input: {
      capability: string
      requiredPlan?: 'plus' | 'enterprise'
      insufficientLegacyError: string
      insufficientMessage: string
      inactiveMessage: string
      insufficientPlanFailure?: string
      extraDetails?: Record<string, unknown>
    },
  ) => {
    reply.code(403)
    return createCapabilityAccessDeniedResponse({
      context: effective,
      capability: input.capability,
      requiredPlan: input.requiredPlan,
      insufficientLegacyError: input.insufficientLegacyError,
      insufficientMessage: input.insufficientMessage,
      inactiveMessage: input.inactiveMessage,
      insufficientPlanFailure: input.insufficientPlanFailure,
      extraDetails: input.extraDetails,
    })
  }

  app.get('/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      const plan = await loadUserPlan(user)
      const billing = await buildBillingInfo(plan)
      const effective = await resolveEffectiveEntitlements({
        pool: planeAPool,
        userId: user.user_id,
        email: user.email ?? null,
        supabaseRole: user.role ?? null,
        plan,
        cancelAtPeriodEnd: billing.cancel_at_period_end,
        currentPeriodEnd: billing.current_period_end ?? plan.current_period_end,
      })
      const usage = await getUsageForUser(planeAPool, user.user_id)
      const profile = await userAccountRepository.getProfile(user.user_id)
      const appRole = effective.adminAccess.appRole
      const claims = user.claims as Record<string, unknown> | undefined
      const amr = Array.isArray(claims?.amr)
        ? claims.amr as Array<{ method?: string; mfa?: boolean }>
        : []
      const hasTotpMfa = amr.some((entry) => {
        if (!entry) return false
        if (entry.mfa === true) return true
        return entry.method === 'totp'
      })
      const mfaVerified = claims?.mfa_verified === true || hasTotpMfa

      const supabaseRole = user.role ?? null
      logger.debug('me_request_success', {
        user_id: user.user_id,
        plan_code: plan.plan_code,
        status: plan.status,
        internal_enterprise_override: effective.internalEnterpriseOverride,
      })

      return {
        success: true,
        timestamp: new Date().toISOString(),
        user: {
          user_id: user.user_id,
          email: user.email,
          name: profile?.name ?? null,
          role: supabaseRole,
          app_role: appRole,
          is_admin: Boolean(effective.adminAccess.allowed),
          mfa_verified: Boolean(mfaVerified),
        },
        plan: {
          plan_code: plan.plan_code,
          status: plan.status,
        },
        plan_effective: {
          plan_code: effective.effectivePlanCode,
          is_active: effective.internalEnterpriseOverride ? true : effective.isPlanActive,
          lifecycle_state: effective.lifecycleState,
          source: effective.source,
          recovery_available: effective.recoveryAvailable,
          recovery_action: effective.recoveryAction,
        },
        billing,
        entitlements: effective.entitlements,
        usage,
      }
    } catch (error: unknown) {
      logger.error('me_request_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { 
        error: 'internal_error', 
        message: 'An unexpected error occurred' 
      }
    }
  })

  app.get('/me/api-keys', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.api_access) {
        return denyCapability(reply, effective, {
          capability: 'api_access',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise API access is required for API keys.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage API keys.',
        })
      }

      const keys = await listApiKeys(planeAPool, user.user_id)
      return {
        success: true,
        keys: keys.map((key) => ({
          key_id: key.key_id,
          key_prefix: key.key_prefix,
          name: key.name,
          scopes: key.scopes,
          created_at: key.created_at.toISOString(),
          last_used_at: key.last_used_at ? key.last_used_at.toISOString() : null,
          revoked_at: key.revoked_at ? key.revoked_at.toISOString() : null,
        })),
      }
    } catch (error: unknown) {
      logger.error('api_key_list_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/me/api-keys', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const parsed = apiKeyCreateSchema.safeParse(request.body)
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.api_access) {
        return denyCapability(reply, effective, {
          capability: 'api_access',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise API access is required for API keys.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage API keys.',
        })
      }

      const unsupportedScopes = findUnsupportedApiKeyScopes(parsed.data.scopes)
      if (unsupportedScopes.length > 0) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'unsupported_scope',
            scopes: unsupportedScopes,
            supportedScopes: [...RETAIL_API_KEY_SCOPES],
          },
        })
      }

      if (hasTierOneScope(parsed.data.scopes)) {
                throw new ValidationError('Invalid request', { details: { error: 'tier_disabled', message: 'Tier 1 API access is disabled.' } })
      }

      const activeCount = await countActiveApiKeys(planeAPool, user.user_id)
      const maxKeys = effective.entitlements.api_key_max > 0
        ? effective.entitlements.api_key_max
        : config.planeA.enterpriseApiKeyMax
      if (activeCount >= maxKeys) {
        reply.code(429)
        return { error: 'api_key_limit_reached', maxKeys }
      }

      const record = await createApiKey(planeAPool, user.user_id, {
        name: parsed.data.name?.trim() || null,
        scopes: parsed.data.scopes,
      })

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'api_key.create',
          entityType: 'api_key',
          entityId: record.key_id,
          afterSnapshot: {
            key_prefix: record.key_prefix,
            name: record.name,
            scopes: record.scopes,
          },
          category: 'security',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      return {
        success: true,
        api_key: {
          key_id: record.key_id,
          key_prefix: record.key_prefix,
          name: record.name,
          scopes: record.scopes,
          created_at: record.created_at.toISOString(),
        },
        token: record.token,
      }
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error
      }
      logger.error('api_key_create_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/me/api-keys/:keyId/rotate', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const keyId = String((request.params as { keyId: string }).keyId)

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.api_access) {
        return denyCapability(reply, effective, {
          capability: 'api_access',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise API access is required for API keys.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage API keys.',
        })
      }

      const rotated = await rotateApiKey(planeAPool, user.user_id, keyId)
      if (!rotated) {
                throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'api_key.rotate',
          entityType: 'api_key',
          entityId: keyId,
          afterSnapshot: {
            key_prefix: rotated.key_prefix,
            scopes: rotated.scopes,
          },
          category: 'security',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      return {
        success: true,
        api_key: {
          key_id: rotated.key_id,
          key_prefix: rotated.key_prefix,
          name: rotated.name,
          scopes: rotated.scopes,
          created_at: rotated.created_at.toISOString(),
        },
        token: rotated.token,
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('api_key_rotate_failed', {
        user_id: user.user_id,
        key_id: keyId,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.delete('/me/api-keys/:keyId', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const keyId = String((request.params as { keyId: string }).keyId)

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.api_access) {
        return denyCapability(reply, effective, {
          capability: 'api_access',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise API access is required for API keys.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage API keys.',
        })
      }

      const revoked = await revokeApiKey(planeAPool, user.user_id, keyId)
      if (!revoked) {
                throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'api_key.revoke',
          entityType: 'api_key',
          entityId: keyId,
          category: 'security',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: user.user_id,
          error: getErrorMessage(error),
        })
      }

      return { success: true }
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('api_key_revoke_failed', {
        user_id: user.user_id,
        key_id: keyId,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/me/published-embeds', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      const limit = Math.min(Number((request.query as { limit?: unknown } | undefined)?.limit) || 100, 200)
      const publishedEmbeds = await app.container.repositories.publishedEmbed.listByOwnerUserId(user.user_id, limit)
      return {
        success: true,
        embeds: publishedEmbeds.map((row) => buildPublishedEmbedListItem(row)),
      }
    } catch (error: unknown) {
      logger.error('published_embed_list_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/me/published-embeds/:id/revoke', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const id = String((request.params as { id?: string }).id || '').trim()
    const parsedId = z.string().uuid().safeParse(id)
    if (!parsedId.success) {
      throw new ValidationError('Invalid request', {
        details: {
          error: 'invalid_published_id',
        },
      })
    }

    try {
      const revoked = await app.container.repositories.publishedEmbed.revoke(parsedId.data, user.user_id)
      if (!revoked) {
        throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'published_embed.revoke',
          entityType: 'published_embed',
          entityId: revoked.id,
          afterSnapshot: {
            revoked_at: revoked.revoked_at ? revoked.revoked_at.toISOString() : null,
            surface_kind: revoked.surface_kind,
            title: revoked.title,
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

      return {
        success: true,
        embed: buildPublishedEmbedListItem(revoked),
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error
      }
      logger.error('published_embed_revoke_failed', {
        user_id: user.user_id,
        embed_id: parsedId.data,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/me/export-jobs', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.bulk_export) {
        return denyCapability(reply, effective, {
          capability: 'bulk_export',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise bulk export access is required.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage export jobs.',
        })
      }

      const limit = Math.min(Number((request.query as any)?.limit) || 20, 100)
      const jobs = await exportJobRepository.listByUserId(user.user_id, limit)

      return {
        success: true,
        jobs: jobs.map((job) => ({
          id: job.id,
          jobType: job.job_type,
          status: job.status,
          params: job.params,
          createdAt: job.created_at.toISOString(),
          startedAt: job.started_at ? job.started_at.toISOString() : null,
          finishedAt: job.finished_at ? job.finished_at.toISOString() : null,
          expiresAt: job.expires_at ? job.expires_at.toISOString() : null,
          error: job.error,
        })),
      }
    } catch (error: unknown) {
      logger.error('export_job_list_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/me/export-jobs', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const parsed = exportJobCreateSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.bulk_export) {
        return denyCapability(reply, effective, {
          capability: 'bulk_export',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise bulk export access is required.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to manage export jobs.',
        })
      }
      if (parsed.data.jobType === 'indices' && !effective.entitlements.indices_exports_enabled) {
        return denyCapability(reply, effective, {
          capability: 'indices_exports_enabled',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'indices_export_enterprise_only',
          insufficientPlanFailure: 'indices_export_enterprise_only',
          insufficientMessage: 'TEER, RCI, and RVI exports require an Enterprise plan.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to create TEER, RCI, and RVI exports.',
        })
      }
      if (parsed.data.jobType === 'indices' && (!parsed.data.corridorIds || parsed.data.corridorIds.length === 0)) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'indices_corridor_required',
            message: 'Corridor IDs are required for TEER/RCI/RVI exports.',
          },
        })
      }

      const pipeline = getExportPipelineStatus()
      if (!pipeline.ok) {
        reply.code(503)
        return { error: pipeline.error, message: pipeline.message }
      }

      const recent = await query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM silver.export_job
         WHERE user_id = $1
           AND created_at >= NOW() - INTERVAL '24 hours'
          AND job_type != 'gdpr_export'`,
        [user.user_id],
        planeAPool,
      )
      const count = parseInt(recent.rows[0]?.count || '0', 10)
      if (count >= 10) {
        reply.code(429)
        return { error: 'rate_limited', message: 'Maximum 10 export jobs per 24 hours.' }
      }

      const jobType = `${parsed.data.jobType}_${parsed.data.format}` as any
      const job = await exportJobRepository.create({
        user_id: user.user_id,
        job_type: jobType,
        params: {
          format: parsed.data.format,
          dateFrom: parsed.data.dateFrom || null,
          dateTo: parsed.data.dateTo || null,
          corridorIds: parsed.data.corridorIds ?? null,
        },
      })

      await enqueueExportJob(job.id, job.job_type, user.user_id)

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'export_job.create',
          entityType: 'export_job',
          entityId: job.id,
          afterSnapshot: { job_type: job.job_type, status: job.status },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', { user_id: user.user_id, error: getErrorMessage(error) })
      }

      return {
        success: true,
        job: {
          id: job.id,
          jobType: job.job_type,
          status: job.status,
          createdAt: job.created_at.toISOString(),
        },
      }
    } catch (error: unknown) {
      if (error instanceof ValidationError) throw error
      logger.error('export_job_create_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/me/export-jobs/:jobId/download', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const jobId = String((request.params as { jobId: string }).jobId)

    try {
      const { effective } = await resolveEffectiveUserAccess(user)
      if (!effective.entitlements.bulk_export) {
        return denyCapability(reply, effective, {
          capability: 'bulk_export',
          requiredPlan: 'enterprise',
          insufficientLegacyError: 'enterprise_required',
          insufficientMessage: 'Enterprise bulk export access is required.',
          inactiveMessage: 'Your paid plan is inactive. Reactivate billing to download export jobs.',
        })
      }

      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== user.user_id) {
        throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }
      if (job.status !== 'done' || !job.s3_key) {
        reply.code(409)
        return { error: 'export_not_ready' }
      }
      if (job.expires_at && job.expires_at.getTime() < Date.now()) {
        reply.code(410)
        return { error: 'export_expired' }
      }

      const signed = await getSignedExportDownload(job.s3_key)
      if (!signed) {
        reply.code(500)
        return { error: 'exports_bucket_not_configured' }
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'export_job.download',
          entityType: 'export_job',
          entityId: job.id,
          metadata: { job_type: job.job_type, s3_key: job.s3_key },
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', { user_id: user.user_id, error: getErrorMessage(error) })
      }

      return { success: true, url: signed.url, expiresIn: signed.expiresIn }
    } catch (error: unknown) {
      if (error instanceof NotFoundError) throw error
      logger.error('export_job_download_failed', {
        user_id: user.user_id,
        job_id: jobId,
        error: getErrorMessage(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.patch('/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      await upsertUserAccount(planeAPool, user)
      const beforeProfile = await userAccountRepository.getProfile(user.user_id)
      const body = profileUpdateSchema.parse(request.body ?? {})
      const updates: {
        user_id: string
        name?: string | null
      } = { user_id: user.user_id }

      if (body.name !== undefined) {
        const trimmed = body.name.trim()
        updates.name = trimmed.length > 0 ? trimmed : null
      }

      const profile = await userAccountRepository.updateProfile(updates)

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'profile.update',
          entityType: 'user_account',
          entityId: user.user_id,
          beforeSnapshot: {
            name: beforeProfile?.name ?? null,
          },
          afterSnapshot: {
            name: profile?.name ?? null,
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

      return {
        success: true,
        user: {
          user_id: user.user_id,
          email: user.email,
          name: profile?.name ?? null,
        },
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
                throw new ValidationError('Invalid request', { details: { error: 'invalid_request', details: error.flatten() } })
      }

      logger.error('me_profile_update_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to update profile' }
    }
  })


  app.post('/me/password', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const parsed = passwordUpdateSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'invalid_request', details: parsed.error.flatten() } })
    }

    if (!config.auth.supabase.url || !config.auth.supabase.publishableKey) {
      reply.code(500)
      return { error: 'supabase_not_configured' }
    }

    if (!user.email) {
            throw new ValidationError('Invalid request', { details: { error: 'missing_email' } })
    }

    const accessToken = parseBearerToken(request.headers.authorization)
    if (!accessToken) {
      reply.code(401)
      return { error: 'unauthorized' }
    }

    try {
      const verified = await verifySupabasePassword(user.email, parsed.data.current_password)
      if (!verified) {
        reply.code(401)
        return { error: 'invalid_credentials' }
      }

      await updateSupabasePassword(accessToken, parsed.data.new_password)

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'password.change',
          entityType: 'user_account',
          entityId: user.user_id,
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

      return { success: true }
    } catch (error: unknown) {
      logger.error('me_password_update_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to update password' }
    }
  })
}
