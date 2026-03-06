import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAdmin, requireSuperAdmin } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { sendAdminWebhook } from '../services/admin-webhooks'
import { AppError, ValidationError, NotFoundError } from '../../../shared/errors'

const logger = createLogger('plane-a.admin')

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

type PlanMutationResult = {
  user_id: string
  email: string | null
  plan_code: string
  status: string
}

type UserRoleRecord = {
  user_id: string
  email: string | null
  app_role: string
  created_at: string
  last_seen_at: string | null
  privacy_analytics_enabled: boolean
  privacy_personalization_enabled: boolean
}

export const adminRoutes = async (app: FastifyInstance) => {
  const planeAPool = app.container.pool
  const userAccountRepository = app.container.repositories.userAccount

  app.get('/admin/users', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    try {
      const users = await userAccountRepository.listAdminUsers(
        parsed.data.query,
        parsed.data.limit ?? 50,
      )
      return { users }
    } catch (error) {
      if (error instanceof AppError) throw error
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
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
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
      const limitParam = `$${paramIndex}`
      params.push(limit)
      paramIndex++

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
        LIMIT ${limitParam}
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
      if (error instanceof AppError) throw error
      logger.error('admin_plans_fetch_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/admin/plans/grant', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = planGrantSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const { user_id: userId, email, plan_code: planCode, notes } = parsed.data
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      const client = await planeAPool.connect()
      let updatedPlan: PlanMutationResult | null = null

      try {
        await client.query('BEGIN')

        let targetUserResult
        if (userId) {
          targetUserResult = await query<{ user_id: string; email: string | null }>(
            `SELECT user_id, email FROM silver.user_account WHERE user_id = $1`,
            [userId],
            client,
          )
        } else if (email) {
          targetUserResult = await query<{ user_id: string; email: string | null }>(
            `SELECT user_id, email FROM silver.user_account WHERE LOWER(email) = LOWER($1)`,
            [email],
            client,
          )
        } else {
          throw new ValidationError('Invalid request', { details: { error: 'user_id_required' } })
        }

        const targetUser = targetUserResult.rows[0]
        if (!targetUser) {
          throw new NotFoundError('Not found', {
            details: {
              error: 'user_not_found',
              message: email ? `No user found with email: ${email}` : undefined,
            },
          })
        }

        const isEnterprise = planCode === 'enterprise'
        await query(
          `
          INSERT INTO silver.user_plan (user_id, plan_code, status)
          VALUES ($1, 'free', 'active')
          ON CONFLICT (user_id) DO NOTHING
          `,
          [targetUser.user_id],
          client,
        )

        const updateResult = await query<PlanMutationResult>(
          `
          UPDATE silver.user_plan p
          SET plan_code = $2,
              status = 'active',
              enterprise_granted_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
              enterprise_granted_by = CASE WHEN $3 THEN $4::uuid ELSE NULL END,
              enterprise_notes = CASE WHEN $3 THEN $5 ELSE NULL END,
              updated_at = NOW()
          FROM silver.user_account u
          WHERE p.user_id = $1
            AND u.user_id = p.user_id
          RETURNING p.user_id, u.email, p.plan_code, p.status
          `,
          [targetUser.user_id, planCode, isEnterprise, adminId, notes ?? null],
          client,
        )
        updatedPlan = updateResult.rows[0] ?? null
        if (!updatedPlan) {
          throw new NotFoundError('Not found', { details: { error: 'user_not_found' } })
        }

        await logAuditEvent(client, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.plan.granted',
          entityType: 'user_plan',
          entityId: updatedPlan.user_id,
          category: 'admin',
          severity: 'info',
          metadata: {
            plan_code: updatedPlan.plan_code,
            email: updatedPlan.email,
            notes: notes ?? null,
          },
          ...getRequestContext(request),
        })

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      logger.info('admin_plan_granted', {
        admin_id: adminId,
        target_user_id: updatedPlan?.user_id,
        target_email: updatedPlan?.email,
        plan_code: planCode,
      })
      if (planCode === 'enterprise') {
        void sendAdminWebhook({
          title: 'Enterprise access granted',
          event: 'enterprise_access_granted',
          actorId: adminId,
          metadata: {
            user_id: updatedPlan?.user_id,
            email: updatedPlan?.email,
            plan_code: planCode,
          },
        })
      }

      return {
        success: true,
        user: {
          user_id: updatedPlan?.user_id,
          email: updatedPlan?.email,
          plan_code: updatedPlan?.plan_code,
          status: updatedPlan?.status,
        },
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      logger.error('admin_plan_grant_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.post('/admin/plans/revoke', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = z.object({
      user_id: z.string().uuid().optional(),
      email: z.string().email().optional(),
      reason: z.string().max(500).optional(),
    }).refine((data) => Boolean(data.user_id || data.email), {
      message: 'user_id_or_email_required',
    }).safeParse(request.body ?? {})

    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const { user_id: userId, email, reason } = parsed.data
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      const client = await planeAPool.connect()
      let updatedPlan: PlanMutationResult | null = null

      try {
        await client.query('BEGIN')

        let targetUserResult
        if (userId) {
          targetUserResult = await query<{ user_id: string; email: string | null }>(
            `SELECT user_id, email FROM silver.user_account WHERE user_id = $1`,
            [userId],
            client,
          )
        } else if (email) {
          targetUserResult = await query<{ user_id: string; email: string | null }>(
            `SELECT user_id, email FROM silver.user_account WHERE LOWER(email) = LOWER($1)`,
            [email],
            client,
          )
        } else {
          throw new ValidationError('Invalid request', { details: { error: 'user_id_required' } })
        }

        const targetUser = targetUserResult.rows[0]
        if (!targetUser) {
          throw new NotFoundError('Not found', { details: { error: 'user_not_found' } })
        }

        await query(
          `
          INSERT INTO silver.user_plan (user_id, plan_code, status)
          VALUES ($1, 'free', 'active')
          ON CONFLICT (user_id) DO NOTHING
          `,
          [targetUser.user_id],
          client,
        )

        const updateResult = await query<PlanMutationResult>(
          `
          UPDATE silver.user_plan p
          SET plan_code = 'free',
              status = 'active',
              enterprise_granted_at = NULL,
              enterprise_granted_by = NULL,
              enterprise_notes = NULL,
              stripe_subscription_id = NULL,
              updated_at = NOW()
          FROM silver.user_account u
          WHERE p.user_id = $1
            AND u.user_id = p.user_id
          RETURNING p.user_id, u.email, p.plan_code, p.status
          `,
          [targetUser.user_id],
          client,
        )
        updatedPlan = updateResult.rows[0] ?? null
        if (!updatedPlan) {
          throw new NotFoundError('Not found', { details: { error: 'user_not_found' } })
        }

        await logAuditEvent(client, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.plan.revoked',
          entityType: 'user_plan',
          entityId: updatedPlan.user_id,
          category: 'admin',
          severity: 'warning',
          metadata: {
            email: updatedPlan.email,
            reason: reason ?? null,
          },
          ...getRequestContext(request),
        })

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      logger.info('admin_plan_revoked', {
        admin_id: adminId,
        target_user_id: updatedPlan?.user_id,
        target_email: updatedPlan?.email,
        reason,
      })
      void sendAdminWebhook({
        title: 'Enterprise access revoked',
        event: 'enterprise_access_revoked',
        actorId: adminId,
        metadata: {
          user_id: updatedPlan?.user_id,
          email: updatedPlan?.email,
          reason: reason ?? null,
        },
      })

      return {
        success: true,
        user: {
          user_id: updatedPlan?.user_id,
          email: updatedPlan?.email,
          plan_code: 'free',
          status: 'active',
        },
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      logger.error('admin_plan_revoke_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.patch('/admin/users/role', { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const parsed = roleSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
            throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const { user_id: userId, email, role } = parsed.data
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      const client = await planeAPool.connect()
      let updated: UserRoleRecord | null = null

      try {
        await client.query('BEGIN')

        updated = userId
          ? (await query<UserRoleRecord>(
              `
              UPDATE silver.user_account
              SET app_role = $2,
                  last_seen_at = NOW()
              WHERE user_id = $1
              RETURNING user_id,
                        email,
                        app_role,
                        created_at::text,
                        last_seen_at::text,
                        privacy_analytics_enabled,
                        privacy_personalization_enabled
              `,
              [userId, role],
              client,
            )).rows[0] ?? null
          : (await query<UserRoleRecord>(
              `
              UPDATE silver.user_account
              SET app_role = $2,
                  last_seen_at = NOW()
              WHERE LOWER(email) = LOWER($1)
              RETURNING user_id,
                        email,
                        app_role,
                        created_at::text,
                        last_seen_at::text,
                        privacy_analytics_enabled,
                        privacy_personalization_enabled
              `,
              [email!, role],
              client,
            )).rows[0] ?? null

        if (!updated) {
          throw new NotFoundError('Not found', { details: { error: 'not_found' } })
        }

        await logAuditEvent(client, {
          actorId: adminId,
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

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

      return { user: updated }
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('admin_role_update_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
