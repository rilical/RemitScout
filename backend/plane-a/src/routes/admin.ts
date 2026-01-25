import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { UserAccountRepository, UserPlanRepository } from '../repositories'
import { getRequestContext, logAuditEvent } from '../services/audit-log'

const logger = createLogger('plane-a.admin')
const planeAPool = getPool(config.db.planeAUrl)
const userAccountRepository = new UserAccountRepository(planeAPool)
const userPlanRepository = new UserPlanRepository(planeAPool)

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

const planGrantSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  plan_code: z.enum(['free', 'plus', 'enterprise']),
  notes: z.string().max(500).optional(),
}).refine((data) => Boolean(data.user_id || data.email), {
  message: 'user_id_or_email_required',
})

const planListSchema = z.object({
  plan_code: z.enum(['free', 'plus', 'enterprise']).optional(),
  status: z.enum(['active', 'inactive', 'trialing', 'canceled']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

type UserWithPlan = {
  user_id: string
  email: string | null
  app_role: string
  plan_code: string
  plan_status: string
  created_at: string
  last_seen_at: string | null
  enterprise_granted_at: string | null
  enterprise_granted_by: string | null
  enterprise_notes: string | null
}

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

  app.get('/admin/plans', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = planListSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    try {
      const filters: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (parsed.data.plan_code) {
        filters.push(`p.plan_code = $${paramIndex}`)
        params.push(parsed.data.plan_code)
        paramIndex++
      }
      if (parsed.data.status) {
        filters.push(`p.status = $${paramIndex}`)
        params.push(parsed.data.status)
        paramIndex++
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
      const limit = parsed.data.limit ?? 100

      const result = await query<UserWithPlan>(
        `
        SELECT
          u.user_id,
          u.email,
          u.app_role,
          p.plan_code,
          p.status AS plan_status,
          u.created_at::text,
          u.last_seen_at::text,
          p.enterprise_granted_at::text,
          p.enterprise_granted_by,
          p.enterprise_notes
        FROM silver.user_account u
        JOIN silver.user_plan p ON u.user_id = p.user_id
        ${whereClause}
        ORDER BY p.updated_at DESC NULLS LAST, u.created_at DESC
        LIMIT ${limit}
        `,
        params,
        planeAPool,
      )

      const summary = await query<{ plan_code: string; count: number }>(
        `
        SELECT plan_code, COUNT(*)::int AS count
        FROM silver.user_plan
        WHERE status = 'active'
        GROUP BY plan_code
        `,
        [],
        planeAPool,
      )

      const counts: Record<string, number> = {}
      for (const row of summary.rows) {
        counts[row.plan_code] = row.count
      }

      return {
        summary: {
          free: counts.free ?? 0,
          plus: counts.plus ?? 0,
          enterprise: counts.enterprise ?? 0,
        },
        users: result.rows,
      }
    } catch (error) {
      logger.error('admin_plans_fetch_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/admin/plans/grant', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = planGrantSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { user_id: userId, email, plan_code: planCode, notes } = parsed.data
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      let targetUserId = userId
      let targetEmail = email

      if (!targetUserId && targetEmail) {
        const userResult = await query<{ user_id: string }>(
          `SELECT user_id FROM silver.user_account WHERE LOWER(email) = LOWER($1)`,
          [targetEmail],
          planeAPool,
        )
        if (!userResult.rows[0]) {
          reply.code(404)
          return { error: 'user_not_found', message: `No user found with email: ${targetEmail}` }
        }
        targetUserId = userResult.rows[0].user_id
      }

      if (!targetUserId) {
        reply.code(400)
        return { error: 'user_id_required' }
      }

      await userPlanRepository.ensureUserPlan(targetUserId)

      const isEnterprise = planCode === 'enterprise'
      await query(
        `
        UPDATE silver.user_plan
        SET plan_code = $2,
            status = 'active',
            enterprise_granted_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
            enterprise_granted_by = CASE WHEN $3 THEN $4 ELSE NULL END,
            enterprise_notes = CASE WHEN $3 THEN $5 ELSE NULL END,
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [targetUserId, planCode, isEnterprise, adminId, notes ?? null],
        planeAPool,
      )

      const updatedPlan = await userPlanRepository.getUserPlan(targetUserId)
      if (!targetEmail) {
        const userResult = await query<{ email: string }>(
          `SELECT email FROM silver.user_account WHERE user_id = $1`,
          [targetUserId],
          planeAPool,
        )
        targetEmail = userResult.rows[0]?.email ?? null
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.plan.granted',
          entityType: 'user_plan',
          entityId: targetUserId,
          category: 'admin',
          severity: 'info',
          metadata: {
            plan_code: planCode,
            email: targetEmail,
            notes: notes ?? null,
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_plan_grant_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      logger.info('admin_plan_granted', {
        admin_id: adminId,
        target_user_id: targetUserId,
        target_email: targetEmail,
        plan_code: planCode,
      })

      return {
        success: true,
        user: {
          user_id: targetUserId,
          email: targetEmail,
          plan_code: updatedPlan?.plan_code,
          status: updatedPlan?.status,
        },
      }
    } catch (error) {
      logger.error('admin_plan_grant_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/admin/plans/revoke', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = z.object({
      user_id: z.string().uuid().optional(),
      email: z.string().email().optional(),
      reason: z.string().max(500).optional(),
    }).refine((data) => Boolean(data.user_id || data.email), {
      message: 'user_id_or_email_required',
    }).safeParse(request.body ?? {})

    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const { user_id: userId, email, reason } = parsed.data
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      let targetUserId = userId
      let targetEmail = email

      if (!targetUserId && targetEmail) {
        const userResult = await query<{ user_id: string }>(
          `SELECT user_id FROM silver.user_account WHERE LOWER(email) = LOWER($1)`,
          [targetEmail],
          planeAPool,
        )
        if (!userResult.rows[0]) {
          reply.code(404)
          return { error: 'user_not_found' }
        }
        targetUserId = userResult.rows[0].user_id
      }

      if (!targetUserId) {
        reply.code(400)
        return { error: 'user_id_required' }
      }

      await query(
        `
        UPDATE silver.user_plan
        SET plan_code = 'free',
            status = 'active',
            enterprise_granted_at = NULL,
            enterprise_granted_by = NULL,
            enterprise_notes = NULL,
            stripe_subscription_id = NULL,
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [targetUserId],
        planeAPool,
      )

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.plan.revoked',
          entityType: 'user_plan',
          entityId: targetUserId,
          category: 'admin',
          severity: 'warning',
          metadata: {
            email: targetEmail,
            reason: reason ?? null,
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_plan_revoke_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      logger.info('admin_plan_revoked', {
        admin_id: adminId,
        target_user_id: targetUserId,
        target_email: targetEmail,
        reason,
      })

      return {
        success: true,
        user: {
          user_id: targetUserId,
          email: targetEmail,
          plan_code: 'free',
          status: 'active',
        },
      }
    } catch (error) {
      logger.error('admin_plan_revoke_failed', {
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
