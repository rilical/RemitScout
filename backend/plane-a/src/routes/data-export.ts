import type { FastifyInstance } from 'fastify'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getPool, query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { sendJsonMessage } from '../../../shared/sqs'
import { requireAuth } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { ExportJobRepository, type ExportJobType } from '../repositories'

const logger = createLogger('plane-a.data-export')
const planeAPool = getPool(config.db.planeAUrl)
const exportJobRepository = new ExportJobRepository(planeAPool)
const s3Client = new S3Client({})

const getBucket = () => config.storage.exports?.bucket || ''

const enqueueExportJob = async (jobId: string, jobType: ExportJobType, userId: string) => {
  const queueMode = config.queues.exports?.mode ?? 'off'
  const queueUrl = config.queues.exports?.url ?? ''
  const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)

  if (!queueEnabled) {
    if (queueMode === 'queue') {
      logger.warn('export_queue_missing', { queue_url_set: Boolean(queueUrl) })
    }
    return
  }

  try {
    await sendJsonMessage(queueUrl, { jobId, jobType, userId })
  } catch (error) {
    logger.warn('export_queue_enqueue_failed', {
      job_id: jobId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const dataExportRoutes = async (app: FastifyInstance) => {
  app.post('/data/export', { preHandler: requireAuth() }, async (request, reply) => {
    const user = request.user!

    try {
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
    const jobId = String(request.params.id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== user.user_id || job.job_type !== 'gdpr_export') {
        reply.code(404)
        return { error: 'not_found' }
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
    const jobId = String(request.params.id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== user.user_id || job.job_type !== 'gdpr_export') {
        reply.code(404)
        return { error: 'not_found' }
      }
      if (job.status !== 'done' || !job.s3_key) {
        reply.code(409)
        return { error: 'export_not_ready' }
      }
      if (job.expires_at && job.expires_at.getTime() < Date.now()) {
        reply.code(410)
        return { error: 'export_expired' }
      }

      const bucket = getBucket()
      if (!bucket) {
        reply.code(500)
        return { error: 'exports_bucket_not_configured' }
      }

      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: job.s3_key,
        }),
        { expiresIn: 900 },
      )

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
        url,
        expiresIn: 900,
      }
    } catch (error) {
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
