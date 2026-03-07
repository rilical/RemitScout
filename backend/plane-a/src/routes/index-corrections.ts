import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { ValidationError } from '../../../shared/errors'
import { getRequestContext, logAuditEvent } from '../services/audit-log'

const logger = createLogger('plane-a.index-corrections')

const listSchema = z.object({
  corridor_id: z.string().min(3).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

const createSchema = z.object({
  corridor_id: z.string().min(3),
  amount_bucket: z.number().positive(),
  method_profile: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  field_name: z.string().min(1),
  old_value: z.number().nullable(),
  new_value: z.number().nullable(),
  reason: z.string().min(1).max(1000),
  methodology_version: z.string().nullable().optional(),
})

const approveSchema = z.object({
  approved_by: z.unknown().optional(),
}).passthrough()

type IndexCorrectionRecord = {
  correction_id: string
  corridor_id: string
  amount_bucket: number
  method_profile: string
  date: string
  field_name: string
  old_value: number | null
  new_value: number | null
  reason: string
  corrected_by: string
  methodology_version: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export const indexCorrectionRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool } = app.container

  app.get(
    '/indices/corrections',
    { preHandler: requireAdmin() },
    async (request) => {
      const parsed = listSchema.safeParse(request.query)
      if (!parsed.success) {
        throw new ValidationError('Invalid request', {
          details: { error: 'bad_request', details: parsed.error.issues },
        })
      }

      const { corridor_id, limit = 50, offset = 0 } = parsed.data

      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (corridor_id) {
        conditions.push(`corridor_id = $${paramIndex++}`)
        params.push(corridor_id)
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      params.push(limit, offset)
      const limitParam = paramIndex++
      const offsetParam = paramIndex++

      const result = await query<IndexCorrectionRecord>(
        `SELECT * FROM gold_export.index_correction
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        params,
        planeAPool,
      )

      const countResult = await query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM gold_export.index_correction ${whereClause}`,
        corridor_id ? [corridor_id] : [],
        planeAPool,
      )

      return {
        corrections: result.rows.map((r) => ({
          correctionId: r.correction_id,
          corridorId: r.corridor_id,
          amountBucket: r.amount_bucket,
          methodProfile: r.method_profile,
          date: r.date,
          fieldName: r.field_name,
          oldValue: r.old_value,
          newValue: r.new_value,
          reason: r.reason,
          correctedBy: r.corrected_by,
          methodologyVersion: r.methodology_version,
          approvedBy: r.approved_by,
          approvedAt: r.approved_at,
          createdAt: r.created_at,
        })),
        total: countResult.rows[0]?.count ?? 0,
        limit,
        offset,
      }
    },
  )

  app.post(
    '/indices/corrections',
    { preHandler: requireAdmin() },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body)
      if (!parsed.success) {
        throw new ValidationError('Invalid request', {
          details: { error: 'bad_request', details: parsed.error.issues },
        })
      }

      const actorId = request.user?.user_id ?? 'unknown'
      const correctedBy = request.user?.email ?? actorId
      const client = await planeAPool.connect()

      try {
        await client.query('BEGIN')

        const result = await query<IndexCorrectionRecord>(
          `INSERT INTO gold_export.index_correction
           (corridor_id, amount_bucket, method_profile, date,
            field_name, old_value, new_value, reason,
            corrected_by, methodology_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING correction_id,
                     corridor_id,
                     amount_bucket,
                     method_profile,
                     date::text,
                     field_name,
                     old_value,
                     new_value,
                     reason,
                     corrected_by,
                     methodology_version,
                     approved_by,
                     approved_at::text,
                     created_at::text`,
          [
            parsed.data.corridor_id,
            parsed.data.amount_bucket,
            parsed.data.method_profile,
            parsed.data.date,
            parsed.data.field_name,
            parsed.data.old_value,
            parsed.data.new_value,
            parsed.data.reason,
            correctedBy,
            parsed.data.methodology_version ?? null,
          ],
          client,
        )

        const created = result.rows[0]
        await logAuditEvent(client, {
          actorId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'indices.correction.created',
          entityType: 'index_correction',
          entityId: created.correction_id,
          resourceType: 'gold_index',
          resourceId: created.corridor_id,
          category: 'admin',
          severity: 'warning',
          reason: created.reason,
          afterSnapshot: {
            corridor_id: created.corridor_id,
            amount_bucket: created.amount_bucket,
            method_profile: created.method_profile,
            date: created.date,
            field_name: created.field_name,
            old_value: created.old_value,
            new_value: created.new_value,
            corrected_by: created.corrected_by,
            methodology_version: created.methodology_version,
          },
          metadata: {
            approved_by: created.approved_by,
            approved_at: created.approved_at,
            created_at: created.created_at,
          },
          ...getRequestContext(request),
        })

        await client.query('COMMIT')

        logger.info('index_correction_created', {
          correctionId: created.correction_id,
          corridorId: created.corridor_id,
          fieldName: created.field_name,
          correctedBy,
        })

        reply.code(201)
        return {
          correctionId: created.correction_id,
          status: 'pending_approval',
        }
      } catch (error) {
        await client.query('ROLLBACK')
        logger.error('index_correction_create_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      } finally {
        client.release()
      }
    },
  )

  app.post(
    '/indices/corrections/:correctionId/approve',
    { preHandler: requireAdmin() },
    async (request) => {
      const { correctionId } = request.params as { correctionId: string }
      const parsed = approveSchema.safeParse(request.body)
      if (!parsed.success) {
        throw new ValidationError('Invalid request', {
          details: { error: 'bad_request', details: parsed.error.issues },
        })
      }

      const actorId = request.user?.user_id ?? 'unknown'
      const approvedBy = request.user?.email ?? actorId
      const client = await planeAPool.connect()

      try {
        await client.query('BEGIN')

        const result = await query<IndexCorrectionRecord>(
          `UPDATE gold_export.index_correction
           SET approved_by = $1, approved_at = NOW()
           WHERE correction_id = $2 AND approved_by IS NULL
           RETURNING correction_id,
                     corridor_id,
                     amount_bucket,
                     method_profile,
                     date::text,
                     field_name,
                     old_value,
                     new_value,
                     reason,
                     corrected_by,
                     methodology_version,
                     approved_by,
                     approved_at::text,
                     created_at::text`,
          [approvedBy, correctionId],
          client,
        )

        if (result.rows.length === 0) {
          await client.query('ROLLBACK')
          return {
            error: 'not_found_or_already_approved',
            message: 'Correction not found or already approved.',
          }
        }

        const approved = result.rows[0]
        await logAuditEvent(client, {
          actorId,
          actorType: 'admin',
          actorRole: request.user?.role ?? undefined,
          action: 'indices.correction.approved',
          entityType: 'index_correction',
          entityId: approved.correction_id,
          resourceType: 'gold_index',
          resourceId: approved.corridor_id,
          category: 'admin',
          severity: 'warning',
          reason: approved.reason,
          beforeSnapshot: {
            approved_by: null,
            approved_at: null,
          },
          afterSnapshot: {
            approved_by: approved.approved_by,
            approved_at: approved.approved_at,
          },
          metadata: {
            corridor_id: approved.corridor_id,
            field_name: approved.field_name,
            corrected_by: approved.corrected_by,
          },
          ...getRequestContext(request),
        })

        await client.query('COMMIT')

        logger.info('index_correction_approved', {
          correctionId: approved.correction_id,
          approvedBy: approved.approved_by,
        })

        return {
          correctionId: approved.correction_id,
          status: 'approved',
          approvedBy: approved.approved_by,
        }
      } catch (error) {
        await client.query('ROLLBACK')
        logger.error('index_correction_approve_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      } finally {
        client.release()
      }
    },
  )
}
