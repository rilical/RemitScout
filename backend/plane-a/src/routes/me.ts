import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { upsertUserAccount } from '../services/user-account'
import { ensureUserPlan, getUserPlan } from '../services/user-plan'
import { getEntitlementsForPlan } from '../services/entitlements'
import { getUsageForUser } from '../services/plan-usage'
import { getStripeClient } from '../services/stripe-client'
import { deleteAvatar, resolveAvatarUrl, uploadAvatar } from '../services/avatar-upload'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage, getErrorStack } from '../types/errors'
import { config } from '../../../shared/config'
import { UserAccountRepository } from '../repositories'

const planeAPool = getPool(config.db.planeAUrl)
const logger = createLogger('plane-a.me')
const userAccountRepository = new UserAccountRepository(planeAPool)

const profileUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  avatar_url: z.string().max(2048).nullable().optional(),
})

const passwordUpdateSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8),
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
  if (!plan || !config.billing.stripe.secretKey || !plan.stripe_customer_id) {
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
    let subscription = null as null | Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>

    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'items.data.price'],
      })
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
    const nextBillingDate = toIsoFromSeconds(subscription.current_period_end)

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

      const entitlements = getEntitlementsForPlan(plan.plan_code)
      const usage = await getUsageForUser(planeAPool, user.user_id)
      const billing = await buildBillingInfo(plan)
      const profile = await userAccountRepository.getProfile(user.user_id)
      const avatarUrl = await resolveAvatarUrl(profile?.avatar_url ?? null)

      logger.debug('me_request_success', {
        user_id: user.user_id,
        plan_code: plan.plan_code,
        status: plan.status,
      })

      return {
        success: true,
        timestamp: new Date().toISOString(),
        user: {
          user_id: user.user_id,
          email: user.email,
          name: profile?.name ?? null,
          avatar_url: avatarUrl,
        },
        plan: {
          plan_code: plan.plan_code,
          status: plan.status,
        },
        billing,
        entitlements,
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

  app.patch('/me', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      await upsertUserAccount(planeAPool, user)
      const beforeProfile = await userAccountRepository.getProfile(user.user_id)
      const body = profileUpdateSchema.parse(request.body ?? {})
      const updates: {
        user_id: string
        name?: string | null
        avatar_url?: string | null
      } = { user_id: user.user_id }

      if (body.name !== undefined) {
        const trimmed = body.name.trim()
        updates.name = trimmed.length > 0 ? trimmed : null
      }

      if (body.avatar_url !== undefined) {
        const trimmed = body.avatar_url?.trim()
        updates.avatar_url = trimmed ? trimmed : null
      }

      const profile = await userAccountRepository.updateProfile(updates)
      const avatarUrl = await resolveAvatarUrl(profile?.avatar_url ?? null)

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
            avatar_url: beforeProfile?.avatar_url ?? null,
          },
          afterSnapshot: {
            name: profile?.name ?? null,
            avatar_url: profile?.avatar_url ?? null,
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
          avatar_url: avatarUrl,
        },
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        reply.code(400)
        return { error: 'invalid_request', details: error.flatten() }
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

  app.post('/me/avatar', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    if (!config.storage.userAssets.bucket) {
      reply.code(500)
      return { error: 'avatar_upload_unavailable' }
    }

    const file = await request.file()
    if (!file) {
      reply.code(400)
      return { error: 'missing_file' }
    }

    await upsertUserAccount(planeAPool, user)
    const existing = await userAccountRepository.getProfile(user.user_id)
    let uploadedKey: string | null = null

    try {
      const buffer = await file.toBuffer()
      const { key, url } = await uploadAvatar(user.user_id, buffer, file.mimetype)
      uploadedKey = key

      const beforeProfile = await userAccountRepository.getProfile(user.user_id)
      await userAccountRepository.updateAvatar(user.user_id, key)

      if (existing?.avatar_url && existing.avatar_url !== key) {
        await deleteAvatar(existing.avatar_url)
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'avatar.upload',
          entityType: 'user_account',
          entityId: user.user_id,
          beforeSnapshot: {
            avatar_url: beforeProfile?.avatar_url ?? null,
          },
          afterSnapshot: {
            avatar_url: key,
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
        avatar_url: url,
      }
    } catch (error: unknown) {
      if (uploadedKey) {
        await deleteAvatar(uploadedKey)
      }

      const message = getErrorMessage(error)
      const isClientError =
        message === 'unsupported_image_type' ||
        message === 'image_too_large' ||
        message === 'image_dimensions_exceeded'

      reply.code(isClientError ? 400 : 500)
      return {
        error: isClientError ? message : 'internal_error',
        message: isClientError ? message.replace(/_/g, ' ') : 'Failed to upload avatar',
      }
    }
  })

  app.delete('/me/avatar', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      await upsertUserAccount(planeAPool, user)
      const profile = await userAccountRepository.getProfile(user.user_id)
      if (profile?.avatar_url) {
        await deleteAvatar(profile.avatar_url)
      }
      await userAccountRepository.updateAvatar(user.user_id, null)

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'avatar.delete',
          entityType: 'user_account',
          entityId: user.user_id,
          beforeSnapshot: {
            avatar_url: profile?.avatar_url ?? null,
          },
          afterSnapshot: {
            avatar_url: null,
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

      return { success: true }
    } catch (error: unknown) {
      logger.error('me_avatar_delete_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error', message: 'Failed to delete avatar' }
    }
  })

  app.post('/me/password', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const parsed = passwordUpdateSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'invalid_request', details: parsed.error.flatten() }
    }

    if (!config.auth.supabase.url || !config.auth.supabase.publishableKey) {
      reply.code(500)
      return { error: 'supabase_not_configured' }
    }

    if (!user.email) {
      reply.code(400)
      return { error: 'missing_email' }
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
