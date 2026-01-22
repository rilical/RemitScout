import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { sendJsonMessage } from '../../../shared/sqs'
import { requireEntitlement } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import {
  ExportJobRepository,
  type ExportJobType,
} from '../repositories'

const logger = createLogger('plane-a.exports')
const planeAPool = getPool(config.db.planeAUrl)
const exportJobRepository = new ExportJobRepository(planeAPool)

const s3Client = new S3Client({})

const exportCreateSchema = z.object({
  dataType: z.enum(['history', 'watchlist', 'alerts', 'all']),
  format: z.enum(['csv', 'pdf']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  itemIds: z.array(z.string()).optional(),
})

const exportListSchema = z.object({
  status: z.enum(['queued', 'running', 'done', 'failed']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

const toDateOrNull = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const exportJobTypeMap: Record<string, Record<string, ExportJobType>> = {
  history: { csv: 'history_csv', pdf: 'history_pdf' },
  watchlist: { csv: 'watchlist_csv', pdf: 'watchlist_pdf' },
  alerts: { csv: 'alerts_csv', pdf: 'alerts_pdf' },
  all: { csv: 'all_csv', pdf: 'all_pdf' },
}

const resolveActor = (
  request: FastifyRequest,
  reply: FastifyReply,
): { userId: string; actorType: 'user' | 'api_key'; actorRole?: string; apiKeyId?: string } | null => {
  if (request.user) {
    return {
      userId: request.user.user_id,
      actorType: 'user',
      actorRole: request.user.role ?? undefined,
    }
  }
  if (request.apiKey) {
    return {
      userId: request.apiKey.user_id,
      actorType: 'api_key',
      apiKeyId: request.apiKey.key_id,
    }
  }
  reply.code(401)
  reply.send({ error: 'unauthorized' })
  return null
}

const getBucket = () => config.storage.exports?.bucket || ''

const getQueueConfig = () => {
  const queueMode = config.queues.exports?.mode ?? 'off'
  const queueUrl = config.queues.exports?.url ?? ''
  const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)
  return { queueMode, queueUrl, queueEnabled }
}

const getExportPipelineStatus = () => {
  const { queueMode, queueUrl, queueEnabled } = getQueueConfig()
  if (!queueEnabled) {
    return {
      ok: false,
      error: 'exports_queue_disabled',
      message: queueMode === 'off'
        ? 'Exports are disabled in this environment.'
        : 'Exports queue is missing a URL.',
      meta: { queueMode, queueUrlSet: Boolean(queueUrl) },
    }
  }

  const bucket = getBucket()
  if (!bucket) {
    return {
      ok: false,
      error: 'exports_bucket_not_configured',
      message: 'Exports bucket is not configured.',
      meta: { queueMode, queueUrlSet: Boolean(queueUrl) },
    }
  }

  return { ok: true }
}

const enqueueExportJob = async (jobId: string, jobType: ExportJobType, userId: string) => {
  const { queueMode, queueUrl, queueEnabled } = getQueueConfig()

  if (!queueEnabled) {
    if (queueMode === 'queue') {
      logger.warn('export_queue_missing', { queue_url_set: Boolean(queueUrl) })
    }
    return
  }

  try {
    await sendJsonMessage(queueUrl, {
      jobId,
      jobType,
      userId,
    })
  } catch (error) {
    logger.warn('export_queue_enqueue_failed', {
      job_id: jobId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const exportsRoutes = async (app: FastifyInstance) => {
  app.post('/exports', { preHandler: requireEntitlement('exports') }, async (request, reply) => {
    const parsed = exportCreateSchema.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const actor = resolveActor(request, reply)
    if (!actor) return
    const pipeline = getExportPipelineStatus()
    if (!pipeline.ok) {
      reply.code(503)
      return {
        error: pipeline.error,
        message: pipeline.message,
      }
    }
    const { dataType, format } = parsed.data
    const jobType = exportJobTypeMap[dataType][format]
    const dateFrom = toDateOrNull(parsed.data.dateFrom)
    const dateTo = toDateOrNull(parsed.data.dateTo)

    if (parsed.data.dateFrom && !dateFrom) {
      reply.code(400)
      return { error: 'invalid_date', field: 'dateFrom' }
    }
    if (parsed.data.dateTo && !dateTo) {
      reply.code(400)
      return { error: 'invalid_date', field: 'dateTo' }
    }

    const params: Record<string, unknown> = {
      dataType,
      format,
    }
    if (dateFrom) {
      params.dateFrom = dateFrom.toISOString()
    }
    if (dateTo) {
      params.dateTo = dateTo.toISOString()
    }
    if (parsed.data.itemIds?.length) {
      params.itemIds = parsed.data.itemIds
    }

    try {
      const activeCount = await exportJobRepository.countByUserAndStatus(actor.userId)
      const maxActive = config.exports?.maxActivePerUser ?? 2
      if (activeCount >= maxActive) {
        reply.code(429)
        return {
          error: 'export_limit_reached',
          active: activeCount,
          maxActive,
        }
      }

      const job = await exportJobRepository.create({
        user_id: actor.userId,
        job_type: jobType,
        params,
      })

      await enqueueExportJob(job.id, job.job_type, actor.userId)

      try {
        await logAuditEvent(planeAPool, {
          actorId: actor.actorType === 'api_key' ? actor.apiKeyId ?? actor.userId : actor.userId,
          actorType: actor.actorType,
          actorRole: actor.actorRole,
          action: 'export.request',
          entityType: 'export_job',
          entityId: job.id,
          afterSnapshot: {
            job_type: job.job_type,
            status: job.status,
            params,
          },
          metadata: actor.apiKeyId ? { api_key_id: actor.apiKeyId, user_id: actor.userId } : undefined,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: actor.userId,
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
      logger.error('export_job_create_failed', {
        user_id: actor.userId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/exports', { preHandler: requireEntitlement('exports') }, async (request, reply) => {
    const parsed = exportListSchema.safeParse(request.query)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'bad_request', details: parsed.error.issues }
    }

    const actor = resolveActor(request, reply)
    if (!actor) return
    const limit = parsed.data.limit ?? 50
    const offset = parsed.data.offset ?? 0

    try {
      const jobs = await exportJobRepository.listByUserId(actor.userId, limit, offset)
      const filtered = parsed.data.status
        ? jobs.filter((job) => job.status === parsed.data.status)
        : jobs

      return {
        success: true,
        jobs: filtered.map((job) => ({
          id: job.id,
          jobType: job.job_type,
          status: job.status,
          createdAt: job.created_at.toISOString(),
          startedAt: job.started_at ? job.started_at.toISOString() : null,
          finishedAt: job.finished_at ? job.finished_at.toISOString() : null,
          expiresAt: job.expires_at ? job.expires_at.toISOString() : null,
          error: job.error,
        })),
      }
    } catch (error) {
      logger.error('export_job_list_failed', {
        user_id: actor.userId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/exports/:id', { preHandler: requireEntitlement('exports') }, async (request, reply) => {
    const actor = resolveActor(request, reply)
    if (!actor) return
    const jobId = String((request.params as { id: string }).id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== actor.userId) {
        reply.code(404)
        return { error: 'not_found' }
      }

      return {
        success: true,
        job: {
          id: job.id,
          jobType: job.job_type,
          status: job.status,
          createdAt: job.created_at.toISOString(),
          startedAt: job.started_at ? job.started_at.toISOString() : null,
          finishedAt: job.finished_at ? job.finished_at.toISOString() : null,
          expiresAt: job.expires_at ? job.expires_at.toISOString() : null,
          error: job.error,
        },
      }
    } catch (error) {
      logger.error('export_job_get_failed', {
        user_id: actor.userId,
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/exports/:id/download', { preHandler: requireEntitlement('exports') }, async (request, reply) => {
    const actor = resolveActor(request, reply)
    if (!actor) return
    const jobId = String((request.params as { id: string }).id)

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== actor.userId) {
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
        const metadata: Record<string, unknown> = {
          job_type: job.job_type,
          s3_key: job.s3_key,
        }
        if (actor.apiKeyId) {
          metadata.api_key_id = actor.apiKeyId
          metadata.user_id = actor.userId
        }

        await logAuditEvent(planeAPool, {
          actorId: actor.actorType === 'api_key' ? actor.apiKeyId ?? actor.userId : actor.userId,
          actorType: actor.actorType,
          actorRole: actor.actorRole,
          action: 'export.download',
          entityType: 'export_job',
          entityId: job.id,
          metadata,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: actor.userId,
          error: getErrorMessage(error),
        })
      }

      return {
        success: true,
        url,
        expiresIn: 900,
      }
    } catch (error) {
      logger.error('export_job_download_failed', {
        user_id: actor.userId,
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })
}
