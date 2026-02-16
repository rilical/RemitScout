import type { FastifyInstance } from 'fastify'
import type Stripe from 'stripe'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { upsertUserAccount } from '../services/user-account'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { getUsageForUser } from '../services/plan-usage'
import { countActiveApiKeys, createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '../services/api-keys'
import { getStripeClient, isStripeConfigured } from '../services/stripe-client'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage, getErrorStack } from '../types/errors'
import { config } from '../../../shared/config'
import { ValidationError, NotFoundError } from '../../../shared/errors'

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

type BillingInfo = {
  next_billing_date: string | null
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
      amount: null,
      currency: null,
      status: null,
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
        next_billing_date: null,
        amount: null,
        currency: null,
        status: null,
        payment_method: null,
      }
    }

    const price = subscription.items.data[0]?.price
    const unitAmount = typeof price?.unit_amount === 'number' ? price.unit_amount / 100 : null
    const currency = price?.currency ? price.currency.toUpperCase() : null
    const subscriptionWithPeriodEnd =
      subscription as Stripe.Subscription & { current_period_end?: number | null }
    const nextBillingDate = toIsoFromSeconds(subscriptionWithPeriodEnd.current_period_end ?? null)

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
      next_billing_date: nextBillingDate,
      amount: unitAmount,
      currency,
      status: subscription.status ?? null,
      payment_method: paymentMethodDetails,
    }
  } catch (error: unknown) {
    logger.warn('billing_info_fetch_failed', {
      user_id: plan?.user_id ?? 'unknown',
      error: getErrorMessage(error),
    })
    return {
      next_billing_date: null,
      amount: null,
      currency: null,
      status: null,
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

const isEnterprisePlan = (plan?: Awaited<ReturnType<typeof getUserPlan>> | null) => {
  if (!plan) return false
  return plan.plan_code === 'enterprise' && (plan.status === 'active' || plan.status === 'trialing')
}

const hasTierOneScope = (scopes?: string[]) => {
  if (!scopes || scopes.length === 0) return false
  return scopes.some((scope) => scope.trim().toLowerCase() === 'tier:1')
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
  throw new Error(payload || `Supabase auth failed with status ${response.status}`)
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
    throw new Error(payload || `Supabase password update failed with status ${response.status}`)
  }
}

export const meRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const userAccountRepository = repositories.userAccount

  app.get('/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      await upsertUserAccount(planeAPool, user)
      await ensureUserPlan(planeAPool, user.user_id)

      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!plan) {
        logger.error('plan_not_found', {
          user_id: user.user_id,
        })
        reply.code(500)
        return { error: 'plan_not_found' }
      }

      const isPlanActive = plan.status === 'active' || plan.status === 'trialing'
      const normalizedPlanCode =
        plan.plan_code === 'free' || plan.plan_code === 'plus' || plan.plan_code === 'enterprise'
          ? plan.plan_code
          : 'free'
      const effectivePlanCode = isPlanActive ? normalizedPlanCode : 'free'
      const entitlements = getEntitlementsForPlan(effectivePlanCode)
      const usage = await getUsageForUser(planeAPool, user.user_id)
      const billing = await buildBillingInfo(plan)
      const profile = await userAccountRepository.getProfile(user.user_id)
      const appRoleResult = await query<{ app_role: string | null }>(
        `SELECT app_role FROM silver.user_account WHERE user_id = $1`,
        [user.user_id],
        planeAPool,
      )
      const appRole = appRoleResult.rows[0]?.app_role ?? null

      const email = user.email?.toLowerCase() ?? null
      const adminAllowlist = config.planeA.adminEmails
      const adminDomainAllowlist = config.planeA.adminEmailDomains
      const isAdminByDomain = (() => {
        if (!email) return false
        const [, domain] = email.split('@')
        if (!domain) return false
        return adminDomainAllowlist.includes(domain)
      })()
      const isAdminByEmail = adminAllowlist.length > 0 && email ? adminAllowlist.includes(email) : false
      const supabaseRole = user.role ?? null
      const isAdmin =
        isAdminByEmail
        || isAdminByDomain
        || supabaseRole === 'admin'
        || supabaseRole === 'super_admin'
        || appRole === 'admin'
        || appRole === 'super_admin'

      // Internal admin accounts can be treated as enterprise (feature access) even when Stripe isn't wired yet.
      const internalEnterpriseOverride = Boolean(isAdmin && config.planeA.internalUsersGetEnterprise)
      const effectivePlanCodeForEntitlements = internalEnterpriseOverride ? 'enterprise' : effectivePlanCode
      logger.debug('me_request_success', {
        user_id: user.user_id,
        plan_code: plan.plan_code,
        status: plan.status,
        internal_enterprise_override: internalEnterpriseOverride,
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
          is_admin: Boolean(isAdmin),
        },
        plan: {
          plan_code: plan.plan_code,
          status: plan.status,
        },
        plan_effective: {
          plan_code: effectivePlanCodeForEntitlements,
          is_active: internalEnterpriseOverride ? true : isPlanActive,
          source: internalEnterpriseOverride ? 'internal_admin_override' : 'stripe_or_default',
        },
        billing,
        entitlements: getEntitlementsForPlan(effectivePlanCodeForEntitlements),
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
      await upsertUserAccount(planeAPool, user)
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!isEnterprisePlan(plan)) {
        reply.code(403)
        return { error: 'enterprise_required' }
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
      await upsertUserAccount(planeAPool, user)
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!isEnterprisePlan(plan)) {
        reply.code(403)
        return { error: 'enterprise_required' }
      }

      if (hasTierOneScope(parsed.data.scopes)) {
                throw new ValidationError('Invalid request', { details: { error: 'tier_disabled', message: 'Tier 1 API access is disabled.' } })
      }

      const activeCount = await countActiveApiKeys(planeAPool, user.user_id)
      const maxKeys = config.planeA.enterpriseApiKeyMax
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
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!isEnterprisePlan(plan)) {
        reply.code(403)
        return { error: 'enterprise_required' }
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
      await ensureUserPlan(planeAPool, user.user_id)
      const plan = await getUserPlan(planeAPool, user.user_id)
      if (!isEnterprisePlan(plan)) {
        reply.code(403)
        return { error: 'enterprise_required' }
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
      logger.error('api_key_revoke_failed', {
        user_id: user.user_id,
        key_id: keyId,
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
