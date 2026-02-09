import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { deleteUserAccount } from '../services/account-deletion'
import { getErrorMessage, getErrorStack } from '../types/errors'
import { UserAccountRepository } from '../repositories'

const logger = createLogger('plane-a.account')
const planeAPool = getPool(config.db.planeAUrl)
const userAccountRepository = new UserAccountRepository(planeAPool)

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
  app.get('/account/privacy', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    try {
      await userAccountRepository.upsertUserAccount({
        user_id: user.user_id,
        email: user.email || null,
      })
      const settings = await userAccountRepository.getPrivacySettings(user.user_id)
      return {
        settings: {
          // Default to opt-in when unset to preserve existing behavior.
          analytics: settings?.analytics_enabled ?? true,
          marketing: settings?.marketing_enabled ?? false,
          personalization: settings?.personalization_enabled ?? true,
          updated_at: settings?.updated_at ?? null,
        },
      }
    } catch (error) {
      logger.error('privacy_settings_fetch_failed', {
        user_id: user.user_id,
        error: getErrorMessage(error),
        stack: getErrorStack(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.put('/account/privacy', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = privacySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
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
        marketing_enabled: parsed.data.marketing ?? false,
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
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.delete('/account', { preHandler: requireAuth() }, async (request, reply) => {
    const parsed = deleteAccountSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'confirmation_required', message: 'Account deletion requires confirmation.' }
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
          reply.code(404)
          return { error: 'not_found', message: 'User not found.' }
        }
        reply.code(500)
        return {
          error: 'account_deletion_failed',
          errors: result.errors,
          warnings: result.warnings,
        }
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
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
