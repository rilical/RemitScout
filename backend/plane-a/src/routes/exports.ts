import type { FastifyInstance } from 'fastify'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { NotFoundError, ValidationError } from '../../../shared/errors'
import { requireEntitlement } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'
import { getErrorMessage } from '../types/errors'
import { apiKeyAccessConfig } from './api-key-access'
import {
  enqueueExportJob,
  getAuditActorId,
  getExportPipelineStatus,
  getSignedExportDownload,
  mapExportJob,
  resolveActor,
  resolveCreateExport,
} from './exports.service'
import {
  exportCreateSchema,
  exportJobParamsSchema,
  exportListSchema,
} from './exports.schema'
import {
  checkAndIncrementExportLimit,
  decrementExportCounter,
} from './exports-limit'

const logger = createLogger('plane-a.exports')
const retailExportsApiKeyConfig = {
  config: apiKeyAccessConfig({ audience: 'retail', requiredScope: 'exports:read' }),
}

export const exportsRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const exportJobRepository = repositories.exportJob

  app.post('/exports', { preHandler: requireEntitlement('exports'), ...retailExportsApiKeyConfig }, async (request, reply) => {
    const parsed = exportCreateSchema.safeParse(request.body)
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    if (parsed.data.dataType === 'indices') {
      const entitlements = request.entitlementsContext?.entitlements
      if (!entitlements?.indices_exports_enabled) {
        reply.code(403)
        return {
          error: 'indices_export_enterprise_only',
          message: 'TEER, RCI, and RVI exports require an Enterprise plan.',
        }
      }
    }

    const actor = resolveActor(request, reply)
    if (!actor) return

    const pipeline = await getExportPipelineStatus()
    if (!pipeline.ok) {
      reply.code(503)
      return {
        error: pipeline.error,
        message: pipeline.message,
      }
    }

    const { jobType, params } = resolveCreateExport(request, parsed.data)

    const maxActive = config.exports?.maxActivePerUser ?? 2

    // --- Distributed limit check (Redis) with DB fallback ---
    const redisLimit = await checkAndIncrementExportLimit(actor.userId, maxActive)
    if (redisLimit.limited) {
      reply.code(429)
      return {
        error: 'export_limit_reached',
        active: redisLimit.currentCount,
        maxActive,
      }
    }

    // Track whether we incremented Redis so we can roll back on failure.
    const redisIncremented = redisLimit.redisAvailable

    try {
      // Belt-and-suspenders: always verify against the DB as a secondary check.
      // When Redis is down this is the only guard; when Redis is up it catches
      // any drift between the counter and actual DB state.
      const activeCount = await exportJobRepository.countByUserAndStatus(actor.userId)
      if (activeCount >= maxActive) {
        // Roll back the Redis increment — DB says we are already at the limit.
        if (redisIncremented) {
          await decrementExportCounter(actor.userId)
        }
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
          actorId: getAuditActorId(actor),
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
      // Roll back the Redis increment on any failure so the counter stays
      // accurate even if the DB insert or SQS enqueue fails.
      if (redisIncremented) {
        await decrementExportCounter(actor.userId)
      }
      logger.error('export_job_create_failed', {
        user_id: actor.userId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/exports', { preHandler: requireEntitlement('exports'), ...retailExportsApiKeyConfig }, async (request, reply) => {
    const parsed = exportListSchema.safeParse(request.query)
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
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
        jobs: filtered.map(mapExportJob),
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

  app.get('/exports/:id', { preHandler: requireEntitlement('exports'), ...retailExportsApiKeyConfig }, async (request, reply) => {
    const actor = resolveActor(request, reply)
    if (!actor) return

    const parsedParams = exportJobParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      throw new ValidationError('Invalid request', { details: { error: 'invalid_export_id' } })
    }

    const jobId = parsedParams.data.id

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== actor.userId) {
        throw new NotFoundError('Not found', { details: { error: 'not_found' } })
      }

      return {
        success: true,
        job: mapExportJob(job),
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('export_job_get_failed', {
        user_id: actor.userId,
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'internal_error' }
    }
  })

  app.get('/exports/:id/download', { preHandler: requireEntitlement('exports'), ...retailExportsApiKeyConfig }, async (request, reply) => {
    const actor = resolveActor(request, reply)
    if (!actor) return

    const parsedParams = exportJobParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      throw new ValidationError('Invalid request', { details: { error: 'invalid_export_id' } })
    }

    const jobId = parsedParams.data.id

    try {
      const job = await exportJobRepository.getById(jobId)
      if (!job || job.user_id !== actor.userId) {
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
        const metadata: Record<string, unknown> = {
          job_type: job.job_type,
          s3_key: job.s3_key,
        }
        if (actor.apiKeyId) {
          metadata.api_key_id = actor.apiKeyId
          metadata.user_id = actor.userId
        }

        await logAuditEvent(planeAPool, {
          actorId: getAuditActorId(actor),
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
        url: signed.url,
        expiresIn: signed.expiresIn,
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
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
