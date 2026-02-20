import type { FastifyInstance } from 'fastify'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { requireAuth } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { NotFoundError } from '../../../shared/errors'
import {
  enqueueExportJob,
  getExportPipelineStatus,
  getSignedExportDownload,
} from './exports.service'

const logger = createLogger('plane-a.data-export')

export const dataExportRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const exportJobRepository = repositories.exportJob

  app.post('/data/export', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
      const pipeline = getExportPipelineStatus()
      if (!pipeline.ok) {
        reply.code(503)
        return {
          error: pipeline.error,
          message: pipeline.message,
        }
      }

      const recent = await query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM silver.export_job
         WHERE user_id = $1
           AND job_type = 'gdpr_export'
           AND created_at >= NOW() - INTERVAL '24 hours'`,
        [user.user_id],
        planeAPool,
      )
      const count = parseInt(recent.rows[0]?.count || '0', 10)
      if (count > 0) {
        reply.code(429)
        return { error: 'rate_limited', message: 'GDPR export already requested in last 24 hours.' }
      }

      const job = await exportJobRepository.create({
        user_id: user.user_id,
        job_type: 'gdpr_export',
        params: { requestedAt: new Date().toISOString() },
      })

      await enqueueExportJob(job.id, job.job_type, user.user_id)

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'data.export',
          entityType: 'export_job',
          entityId: job.id,
          afterSnapshot: {
            job_type: job.job_type,
            status: job.status,
            params: job.params,
          },
          category: 'compliance',
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
        job: {
          id: job.id,
          status: job.status,
          jobType: job.job_type,
          createdAt: job.created_at.toISOString(),
        },
      }
    } catch (error) {
      logger.error('gdpr_export_create_failed', {
        user_id: user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/data/export/:id', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const jobId = String((request.params as { id: string }).id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== user.user_id || job.job_type !== 'gdpr_export') {
                throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }

      return {
        success: true,
        job: {
          id: job.id,
          status: job.status,
          createdAt: job.created_at.toISOString(),
          startedAt: job.started_at ? job.started_at.toISOString() : null,
          finishedAt: job.finished_at ? job.finished_at.toISOString() : null,
          expiresAt: job.expires_at ? job.expires_at.toISOString() : null,
          error: job.error,
        },
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('gdpr_export_status_failed', {
        user_id: user.user_id,
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/data/export/:id/download', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!
    const jobId = String((request.params as { id: string }).id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== user.user_id || job.job_type !== 'gdpr_export') {
                throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }
      if (job.status !== 'done' || !job.s3_key) {
        reply.code(409)
        return { error: 'export_not_ready' }
      }
      if (job.expires_at && job.expires_at.getTime() < Date.now()) {
        reply.code(410)
        return { error: 'export_expired' }
      }

      const signed = await getSignedExportDownload(job.s3_key)
      if (!signed) {
        reply.code(500)
        return { error: 'exports_bucket_not_configured' }
      }

      try {
        await logAuditEvent(planeAPool, {
          actorId: user.user_id,
          actorType: 'user',
          actorRole: user.role ?? undefined,
          action: 'data.export',
          entityType: 'export_job',
          entityId: job.id,
          metadata: {
            job_type: job.job_type,
            s3_key: job.s3_key,
          },
          category: 'compliance',
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
        url: signed.url,
        expiresIn: signed.expiresIn,
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('gdpr_export_download_failed', {
        user_id: user.user_id,
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
