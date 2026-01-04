import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { deleteUserAccount } from '../services/account-deletion'
import { getErrorMessage, getErrorStack } from '../types/errors'

const logger = createLogger('plane-a.account')
const planeAPool = getPool(config.db.planeAUrl)

const deleteAccountSchema = z.object({
  confirm: z.literal(true),
})

export const accountRoutes = async (app: FastifyInstance) => {
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
