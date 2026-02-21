import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { generateApiKeyToken, hashApiKey } from '../services/api-keys'
import { getInstitutionalClientScopes } from '../services/institutional-clients'
import { sendAdminWebhook } from '../services/admin-webhooks'
import { ValidationError, NotFoundError } from '../../../shared/errors'

const logger = createLogger('plane-a.admin-institutional')

const listQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked']).optional(),
})

const createSchema = z.object({
  name: z.string().min(1).max(200),
  client_prefix: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Prefix must be alphanumeric, dash, or underscore'),
  tier: z.enum(['trial', 'standard', 'premium']),
  corridors_allowed: z.array(z.string()).nullable().optional(),
  rate_limit_rpm: z.number().int().min(0).default(60),
  rate_limit_daily: z.number().int().min(0).default(10000),
  contract_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  contract_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  nda_signed_at: z.string().nullable().optional(),
  report_schedule: z.enum(['weekly', 'monthly', 'none']).default('none'),
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tier: z.enum(['trial', 'standard', 'premium']).optional(),
  corridors_allowed: z.array(z.string()).nullable().optional(),
  rate_limit_rpm: z.number().int().min(0).optional(),
  rate_limit_daily: z.number().int().min(0).optional(),
  contract_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  contract_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  report_schedule: z.enum(['weekly', 'monthly', 'none']).optional(),
})

const statusSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked']),
  reason: z.string().max(500).optional(),
})

type InstitutionalClientRow = {
  id: string
  name: string
  client_prefix: string
  tier: string
  corridors_allowed: string[] | null
  rate_limit_rpm: number
  rate_limit_daily: number
  status: string
  nda_signed_at: string | null
  contract_start: string | null
  contract_end: string | null
  report_schedule: string
  created_at: string
  updated_at: string
}

export const adminInstitutionalRoutes = async (app: FastifyInstance) => {
  const planeAPool = app.container.pool

  // List all clients
  app.get('/admin/institutional/clients', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    try {
      const filters: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (parsed.data.status) {
        filters.push(`status = $${paramIndex}`)
        params.push(parsed.data.status)
        paramIndex++
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

      const result = await query<InstitutionalClientRow>(
        `
        SELECT
          id, name, client_prefix, tier, corridors_allowed,
          rate_limit_rpm, rate_limit_daily, status,
          nda_signed_at::text, contract_start::text, contract_end::text,
          report_schedule, created_at::text, updated_at::text
        FROM public.institutional_client
        ${whereClause}
        ORDER BY created_at DESC
        `,
        params,
        planeAPool,
      )

      const summary = await query<{ status: string; count: number }>(
        `
        SELECT status, COUNT(*)::int AS count
        FROM public.institutional_client
        GROUP BY status
        `,
        [],
        planeAPool,
      )

      const tierSummary = await query<{ tier: string; count: number }>(
        `
        SELECT tier, COUNT(*)::int AS count
        FROM public.institutional_client
        WHERE status = 'active'
        GROUP BY tier
        `,
        [],
        planeAPool,
      )

      const statusCounts: Record<string, number> = {}
      for (const row of summary.rows) {
        statusCounts[row.status] = row.count
      }

      const tierCounts: Record<string, number> = {}
      for (const row of tierSummary.rows) {
        tierCounts[row.tier] = row.count
      }

      return {
        summary: {
          active: statusCounts.active ?? 0,
          suspended: statusCounts.suspended ?? 0,
          revoked: statusCounts.revoked ?? 0,
          trial: tierCounts.trial ?? 0,
          standard: tierCounts.standard ?? 0,
          premium: tierCounts.premium ?? 0,
        },
        clients: result.rows,
      }
    } catch (error) {
      logger.error('admin_institutional_list_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  // Get single client with usage + export history
  app.get('/admin/institutional/clients/:id', { preHandler: requireAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const clientResult = await query<InstitutionalClientRow>(
        `
        SELECT
          id, name, client_prefix, tier, corridors_allowed,
          rate_limit_rpm, rate_limit_daily, status,
          nda_signed_at::text, contract_start::text, contract_end::text,
          report_schedule, created_at::text, updated_at::text
        FROM public.institutional_client
        WHERE id = $1
        `,
        [id],
        planeAPool,
      )

      if (!clientResult.rows[0]) {
        throw new NotFoundError('Not found', { details: { error: 'client_not_found' } })
      }

      const client = clientResult.rows[0]

      // 30-day usage summary by endpoint
      const usageResult = await query<{ endpoint: string; count: number }>(
        `
        SELECT endpoint, COUNT(*)::int AS count
        FROM public.api_usage_log
        WHERE client_id = $1
          AND timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY endpoint
        ORDER BY count DESC
        `,
        [id],
        planeAPool,
      )

      const totalRequests = usageResult.rows.reduce((sum, row) => sum + row.count, 0)

      // Recent export history
      const exportResult = await query<{
        id: string
        export_date: string
        export_kind: string
        row_count: number
        created_at: string
      }>(
        `
        SELECT id, export_date::text, export_kind, row_count, created_at::text
        FROM public.institutional_export_log
        WHERE client_id = $1
        ORDER BY export_date DESC
        LIMIT 10
        `,
        [id],
        planeAPool,
      )

      const scopes = getInstitutionalClientScopes(client.tier as 'trial' | 'standard' | 'premium')

      return {
        client,
        usage: {
          total_requests_30d: totalRequests,
          by_endpoint: usageResult.rows,
        },
        exports: exportResult.rows,
        scopes,
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('admin_institutional_detail_failed', {
        error: error instanceof Error ? error.message : String(error),
        client_id: id,
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  // Create client + generate API key
  app.post('/admin/institutional/clients', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const adminId = request.user?.user_id ?? 'unknown'
    const data = parsed.data

    try {
      const token = generateApiKeyToken(32)
      const keyHash = hashApiKey(token)

      const result = await query<InstitutionalClientRow>(
        `
        INSERT INTO public.institutional_client (
          name, client_prefix, api_key_hash, tier,
          corridors_allowed, rate_limit_rpm, rate_limit_daily,
          status, nda_signed_at, contract_start, contract_end, report_schedule
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11)
        RETURNING
          id, name, client_prefix, tier, corridors_allowed,
          rate_limit_rpm, rate_limit_daily, status,
          nda_signed_at::text, contract_start::text, contract_end::text,
          report_schedule, created_at::text, updated_at::text
        `,
        [
          data.name,
          data.client_prefix,
          keyHash,
          data.tier,
          data.corridors_allowed ?? null,
          data.rate_limit_rpm,
          data.rate_limit_daily,
          data.nda_signed_at ?? null,
          data.contract_start ?? null,
          data.contract_end ?? null,
          data.report_schedule,
        ],
        planeAPool,
      )

      const client = result.rows[0]

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.institutional_client.created',
          entityType: 'institutional_client',
          entityId: client.id,
          category: 'admin',
          severity: 'info',
          metadata: {
            name: data.name,
            client_prefix: data.client_prefix,
            tier: data.tier,
          },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_institutional_create_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      logger.info('admin_institutional_client_created', {
        admin_id: adminId,
        client_id: client.id,
        client_prefix: data.client_prefix,
      })
      void sendAdminWebhook({
        title: 'Institutional client created',
        event: 'institutional_client_created',
        actorId: adminId,
        metadata: {
          client_id: client.id,
          client_prefix: data.client_prefix,
          tier: data.tier,
        },
      })

      return {
        success: true,
        client,
        api_key: token,
      }
    } catch (error) {
      logger.error('admin_institutional_create_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  // Update client fields
  app.patch('/admin/institutional/clients/:id', { preHandler: requireAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const adminId = request.user?.user_id ?? 'unknown'
    const data = parsed.data

    try {
      const setClauses: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`)
        params.push(data.name)
        paramIndex++
      }
      if (data.tier !== undefined) {
        setClauses.push(`tier = $${paramIndex}`)
        params.push(data.tier)
        paramIndex++
      }
      if (data.corridors_allowed !== undefined) {
        setClauses.push(`corridors_allowed = $${paramIndex}`)
        params.push(data.corridors_allowed)
        paramIndex++
      }
      if (data.rate_limit_rpm !== undefined) {
        setClauses.push(`rate_limit_rpm = $${paramIndex}`)
        params.push(data.rate_limit_rpm)
        paramIndex++
      }
      if (data.rate_limit_daily !== undefined) {
        setClauses.push(`rate_limit_daily = $${paramIndex}`)
        params.push(data.rate_limit_daily)
        paramIndex++
      }
      if (data.contract_start !== undefined) {
        setClauses.push(`contract_start = $${paramIndex}`)
        params.push(data.contract_start)
        paramIndex++
      }
      if (data.contract_end !== undefined) {
        setClauses.push(`contract_end = $${paramIndex}`)
        params.push(data.contract_end)
        paramIndex++
      }
      if (data.report_schedule !== undefined) {
        setClauses.push(`report_schedule = $${paramIndex}`)
        params.push(data.report_schedule)
        paramIndex++
      }

      if (setClauses.length === 0) {
        throw new ValidationError('Invalid request', { details: { error: 'no_fields_to_update' } })
      }

      setClauses.push('updated_at = NOW()')
      params.push(id)

      const result = await query<InstitutionalClientRow>(
        `
        UPDATE public.institutional_client
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id, name, client_prefix, tier, corridors_allowed,
          rate_limit_rpm, rate_limit_daily, status,
          nda_signed_at::text, contract_start::text, contract_end::text,
          report_schedule, created_at::text, updated_at::text
        `,
        params,
        planeAPool,
      )

      if (!result.rows[0]) {
        throw new NotFoundError('Not found', { details: { error: 'client_not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.institutional_client.updated',
          entityType: 'institutional_client',
          entityId: id,
          category: 'admin',
          severity: 'info',
          metadata: { fields_updated: Object.keys(data) },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_institutional_update_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      return { success: true, client: result.rows[0] }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error
      logger.error('admin_institutional_update_failed', {
        error: error instanceof Error ? error.message : String(error),
        client_id: id,
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  // Change client status (suspend / revoke / reactivate)
  app.post('/admin/institutional/clients/:id/status', { preHandler: requireAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = statusSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', { details: { error: 'bad_request', details: parsed.error.issues } })
    }

    const adminId = request.user?.user_id ?? 'unknown'
    const { status, reason } = parsed.data

    try {
      const result = await query<InstitutionalClientRow>(
        `
        UPDATE public.institutional_client
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING
          id, name, client_prefix, tier, corridors_allowed,
          rate_limit_rpm, rate_limit_daily, status,
          nda_signed_at::text, contract_start::text, contract_end::text,
          report_schedule, created_at::text, updated_at::text
        `,
        [status, id],
        planeAPool,
      )

      if (!result.rows[0]) {
        throw new NotFoundError('Not found', { details: { error: 'client_not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: `admin.institutional_client.status_changed`,
          entityType: 'institutional_client',
          entityId: id,
          category: 'admin',
          severity: status === 'revoked' ? 'warning' : 'info',
          metadata: { new_status: status, reason: reason ?? null },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_institutional_status_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      logger.info('admin_institutional_status_changed', {
        admin_id: adminId,
        client_id: id,
        new_status: status,
      })
      void sendAdminWebhook({
        title: 'Institutional client status changed',
        event: 'institutional_client_status_changed',
        actorId: adminId,
        metadata: {
          client_id: id,
          new_status: status,
          reason: reason ?? null,
        },
      })

      return { success: true, client: result.rows[0] }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('admin_institutional_status_change_failed', {
        error: error instanceof Error ? error.message : String(error),
        client_id: id,
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  // Rotate API key
  app.post('/admin/institutional/clients/:id/rotate-key', { preHandler: requireAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const adminId = request.user?.user_id ?? 'unknown'

    try {
      const token = generateApiKeyToken(32)
      const keyHash = hashApiKey(token)

      const result = await query<{ id: string; name: string; client_prefix: string }>(
        `
        UPDATE public.institutional_client
        SET api_key_hash = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, client_prefix
        `,
        [keyHash, id],
        planeAPool,
      )

      if (!result.rows[0]) {
        throw new NotFoundError('Not found', { details: { error: 'client_not_found' } })
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: adminId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'admin.institutional_client.key_rotated',
          entityType: 'institutional_client',
          entityId: id,
          category: 'security',
          severity: 'warning',
          metadata: { client_prefix: result.rows[0].client_prefix },
          ...getRequestContext(request),
        })
      } catch (auditError) {
        logger.warn('admin_institutional_rotate_audit_failed', {
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }

      logger.info('admin_institutional_key_rotated', {
        admin_id: adminId,
        client_id: id,
      })
      void sendAdminWebhook({
        title: 'Institutional API key rotated',
        event: 'institutional_api_key_rotated',
        actorId: adminId,
        metadata: {
          client_id: id,
          client_prefix: result.rows[0].client_prefix,
        },
      })

      return {
        success: true,
        client_id: id,
        api_key: token,
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('admin_institutional_rotate_failed', {
        error: error instanceof Error ? error.message : String(error),
        client_id: id,
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
