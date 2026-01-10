import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { UserAccountRepository } from '../repositories'
import { getRequestContext, logAuditEvent } from '../services/audit-log'

const logger = createLogger('plane-a.admin')
const planeAPool = getPool(config.db.planeAUrl)
const userAccountRepository = new UserAccountRepository(planeAPool)

const listSchema = z.object({
  query: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

const roleSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'super_admin']),
}).refine((data) => Boolean(data.user_id || data.email), {
  message: 'user_id_or_email_required',
})

export const adminRoutes = async (app: FastifyInstance) => {
  app.get('/admin/users', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    try {
      const users = await userAccountRepository.listAdminUsers(
        parsed.data.query,
        parsed.data.limit ?? 50,
      )
      return { users }
    } catch (error) {
      logger.error('admin_users_fetch_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.patch('/admin/users/role', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = roleSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { user_id: userId, email, role } = parsed.data

    try {
      const updated = userId
        ? await userAccountRepository.updateUserRole({ user_id: userId, app_role: role })
        : await userAccountRepository.updateUserRoleByEmail(email!, role)

      if (!updated) {
        reply.code(404)
        return { error: 'not_found' }
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: request.user?.user_id ?? 'unknown',
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.role.updated',
          entityType: 'user',
          entityId: updated.user_id,
          category: 'admin',
          severity: 'info',
          metadata: {
            role: updated.app_role,
            email: updated.email,
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_role_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      return { user: updated }
    } catch (error) {
      logger.error('admin_role_update_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
