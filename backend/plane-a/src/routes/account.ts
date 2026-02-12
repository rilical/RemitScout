import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createLogger } from '../../../shared/logger'
import { AppError, NotFoundError, ValidationError } from '../../../shared/errors'
import { requireAuth } from '../plugins/auth-plugin'
import { deleteUserAccount } from '../services/account-deletion'
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
  const planeAPool = app.container.pool
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
          // Never fabricate timestamps; use DB value when available.
          updated_at: settings?.updated_at ?? null,
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

  app.delete('/account', { preHandler: requireAuth() }, async (request, _reply) => {
    const parsed = deleteAccountSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Account deletion requires confirmation.')
    }

    const user = request.user!

    try {
      const result = await deleteUserAccount(planeAPool, user.user_id, {
        request,
        actorRole: user.role ?? undefined,
        reason: 'User requested account deletion',
      })
      if (!result.deleted) {
        if (result.errors.includes('user_not_found')) {
          throw new NotFoundError('User not found.')
        }
        throw new AppError('Account deletion failed', {
          statusCode: 500,
          code: 'account_deletion_failed',
          details: { errors: result.errors, warnings: result.warnings },
        })
      }

      return {
        success: true,
        deleted: result.deleted,
        anonymized: result.anonymized,
        errors: result.errors,
        warnings: result.warnings,
      }
    } catch (error) {
      logger.error('account_deletion_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      throw error
    }
  })
}
