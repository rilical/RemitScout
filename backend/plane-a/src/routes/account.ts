import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../shared/logger'
import { NotFoundError, ValidationError } from '../../../shared/errors'
import { requireAuth } from '../plugins/auth-plugin'
import {
  cancelAccountDeletion,
  cancelAccountDeletionByToken,
  requestAccountDeletion,
} from '../services/account-deletion-requests'
import { getRequestContext } from '../services/audit-log'
import { getErrorMessage, getErrorStack } from '../types/errors'

const logger = createLogger('plane-a.account')

const deleteAccountSchema = z.object({
  confirm: z.literal(true),
})

const privacySchema = z.object({
  analytics: z.boolean(),
  // Optional for backwards compatibility with older clients.
  marketing: z.boolean().optional(),
  personalization: z.boolean(),
})

export const accountRoutes = async (app: FastifyInstance) => {
  const userAccountRepository = app.container.repositories.userAccount

  app.get('/account/privacy', { preHandler: requireAuth() }, async (request, _reply) => {
    const user = request.user!
    try {
      await userAccountRepository.upsertUserAccount({
        user_id: user.user_id,
        email: user.email || null,
      })
      const settings = await userAccountRepository.getPrivacySettings(user.user_id)

      // Fail closed: until the user makes an explicit choice (updated_at set),
      // treat all non-essential categories as disabled.
      const hasDecision = Boolean(settings?.updated_at)
      if (!hasDecision) {
        return {
          settings: {
            analytics: false,
            marketing: false,
            personalization: false,
            updated_at: null,
          },
        }
      }

      return {
        settings: {
          analytics: settings?.analytics_enabled ?? false,
          marketing: settings?.marketing_enabled ?? false,
          personalization: settings?.personalization_enabled ?? false,
          updated_at: settings?.updated_at ?? null,
        },
      }
    } catch (error) {
      logger.error('privacy_settings_fetch_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      throw error
    }
  })

  app.put('/account/privacy', { preHandler: requireAuth() }, async (request, _reply) => {
    const parsed = privacySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { details: parsed.error.issues })
    }

    const user = request.user!
    try {
      await userAccountRepository.upsertUserAccount({
        user_id: user.user_id,
        email: user.email || null,
      })
      const settings = await userAccountRepository.updatePrivacySettings({
        user_id: user.user_id,
        analytics_enabled: parsed.data.analytics,
        marketing_enabled: parsed.data.marketing,
        personalization_enabled: parsed.data.personalization,
      })
      return {
        settings: {
          analytics: settings?.analytics_enabled ?? parsed.data.analytics,
          marketing: settings?.marketing_enabled ?? (parsed.data.marketing ?? false),
          personalization: settings?.personalization_enabled ?? parsed.data.personalization,
          // Use DB value when available; fall back to now so hasConsent is true after save.
          updated_at: settings?.updated_at ?? new Date().toISOString(),
        },
      }
    } catch (error) {
      logger.error('privacy_settings_update_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      throw error
    }
  })

  app.delete('/account', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = deleteAccountSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Account deletion requires confirmation.')
    }

    const user = request.user!

    try {
      const result = await requestAccountDeletion({
        userId: user.user_id,
        requestedBy: user.user_id,
        requestContext: getRequestContext(request),
        metadata: {
          reason: 'User requested account deletion',
          actorRole: user.role ?? null,
        },
      })
      return reply.code(202).send({
        success: true,
        status: 'pending',
        scheduled_for: result.scheduledFor,
        token_expires_at: result.tokenExpiresAt,
      })
    } catch (error) {
      logger.error('account_deletion_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      throw error
    }
  })

  app.post('/account/deletion/cancel', { preHandler: requireAuth() }, async (request, _reply) => {
    const user = request.user!
    const cancelled = await cancelAccountDeletion({
      userId: user.user_id,
      requestContext: getRequestContext(request),
    })

    if (!cancelled) {
      throw new NotFoundError('Account deletion request not found.')
    }

    return {
      success: true,
      cancelled,
    }
  })

  app.get('/account/deletion/cancel', async (request, reply) => {
    const token = typeof (request.query as { token?: string })?.token === 'string'
      ? (request.query as { token?: string }).token
      : ''

    if (!token) {
      throw new ValidationError('Missing cancel token.')
    }

    const result = await cancelAccountDeletionByToken({
      token,
      requestContext: getRequestContext(request),
    })

    if (!result.cancelled) {
      return reply.status(404).type('text/html').send(
        '<html><body><h1>Account deletion link invalid or expired.</h1></body></html>',
      )
    }

    return reply.status(200).type('text/html').send(
      '<html><body><h1>Account deletion cancelled.</h1><p>You can safely close this page.</p></body></html>',
    )
  })
}
