import type { FastifyReply, FastifyRequest } from 'fastify'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../../../shared/config'
import { EXPORTS_MAX_WINDOW_DAYS_HARD_CAP } from '../../../shared/constants'
import { ValidationError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import { sendJsonMessage } from '../../../shared/sqs'
import type { ExportJobRow, ExportJobType } from '../repositories'
import {
  getInclusiveWindowDays,
  resolveExportJobType,
  toDateFromOrNull,
  toDateToOrNull,
  type ExportCreatePayload,
} from './exports.schema'

const logger = createLogger('plane-a.exports')
const s3Client = new S3Client({})
const DOWNLOAD_URL_TTL_SECONDS = 900

export type ExportActor = {
  userId: string
  actorType: 'user' | 'api_key'
  actorRole?: string
  apiKeyId?: string
}

type QueueConfig = {
  queueMode: string
  queueUrl: string
  queueEnabled: boolean
}

type ExportPipelineError = {
  ok: false
  error: string
  message: string
  meta: {
    queueMode: string
    queueUrlSet: boolean
  }
}

export type ExportPipelineStatus = { ok: true } | ExportPipelineError

const getBucket = () => config.storage.exports?.bucket || ''

const getQueueConfig = (): QueueConfig => {
  const queueMode = config.queues.exports?.mode ?? 'off'
  const queueUrl = config.queues.exports?.url ?? ''
  const queueEnabled = queueMode !== 'off' && Boolean(queueUrl)
  return { queueMode, queueUrl, queueEnabled }
}

export const resolveActor = (
  request: FastifyRequest,
  reply: FastifyReply,
): ExportActor | null => {
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

export const getExportPipelineStatus = (): ExportPipelineStatus => {
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

const resolveEffectiveMaxDays = (request: FastifyRequest) => {
  const exportMaxDays = request.entitlementsContext?.entitlements.exports_max_days ?? null
  const planMaxDays = typeof exportMaxDays === 'number' && exportMaxDays > 0
    ? exportMaxDays
    : null

  // Always enforce a hard cap even if a plan reports "unlimited".
  return Math.max(
    1,
    Math.min(
      EXPORTS_MAX_WINDOW_DAYS_HARD_CAP,
      planMaxDays ?? EXPORTS_MAX_WINDOW_DAYS_HARD_CAP,
    ),
  )
}

export const resolveCreateExport = (
  request: FastifyRequest,
  payload: ExportCreatePayload,
): { jobType: ExportJobType; params: Record<string, unknown> } => {
  const jobType = resolveExportJobType(payload.dataType, payload.format)

  if (payload.format === 'parquet') {
    const parquetEnabled = config.exports?.parquetEnabled ?? false
    const entitlements = request.entitlementsContext?.entitlements
    const bulkExportEnabled = Boolean(entitlements?.bulk_export)

    if (!parquetEnabled) {
      throw new ValidationError('Invalid request', { details: { error: 'parquet_not_enabled' } })
    }
    if (!bulkExportEnabled) {
      throw new ValidationError('Invalid request', { details: { error: 'parquet_not_allowed' } })
    }
  }

  const effectiveMaxDays = resolveEffectiveMaxDays(request)
  const dateFrom = toDateFromOrNull(payload.dateFrom)
  const dateTo = toDateToOrNull(payload.dateTo)

  if (payload.dateFrom && !dateFrom) {
    throw new ValidationError('Invalid request', {
      details: { error: 'invalid_date', field: 'dateFrom' },
    })
  }
  if (payload.dateTo && !dateTo) {
    throw new ValidationError('Invalid request', {
      details: { error: 'invalid_date', field: 'dateTo' },
    })
  }

  const requiresDateRange = payload.dataType === 'history'
    || payload.dataType === 'all'
    || payload.dataType === 'indices'
  if (requiresDateRange && (!dateFrom || !dateTo)) {
    throw new ValidationError('Invalid request', {
      details: { error: 'export_date_range_required', allowedDays: effectiveMaxDays },
    })
  }

  if (payload.dataType === 'indices' && (!payload.corridorIds || payload.corridorIds.length === 0)) {
    throw new ValidationError('Invalid request', {
      details: {
        error: 'indices_corridor_required',
        message: 'Corridor IDs are required for TEER/RCI/RVI exports.',
      },
    })
  }

  if (dateFrom && dateTo) {
    if (dateFrom.getTime() > dateTo.getTime()) {
      throw new ValidationError('Invalid request', { details: { error: 'invalid_date_range' } })
    }

    const windowDays = getInclusiveWindowDays(dateFrom, dateTo)
    if (windowDays > effectiveMaxDays) {
      throw new ValidationError('Invalid request', {
        details: {
          error: 'export_window_exceeds_plan_limit',
          allowedDays: effectiveMaxDays,
          windowDays,
        },
      })
    }
  }

  const params: Record<string, unknown> = {
    dataType: payload.dataType,
    format: payload.format,
  }

  if (request.apiKey) {
    params.exportAudience = 'institutional'
  }
  if (dateFrom) {
    params.dateFrom = dateFrom.toISOString()
  }
  if (dateTo) {
    params.dateTo = dateTo.toISOString()
  }
  if (payload.itemIds?.length) {
    params.itemIds = payload.itemIds
  }
  if (payload.corridorIds?.length) {
    params.corridorIds = payload.corridorIds
  }

  return { jobType, params }
}

export const enqueueExportJob = async (
  jobId: string,
  jobType: ExportJobType,
  userId: string,
) => {
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

export const mapExportJob = (job: ExportJobRow) => ({
  id: job.id,
  jobType: job.job_type,
  status: job.status,
  createdAt: job.created_at.toISOString(),
  startedAt: job.started_at ? job.started_at.toISOString() : null,
  finishedAt: job.finished_at ? job.finished_at.toISOString() : null,
  expiresAt: job.expires_at ? job.expires_at.toISOString() : null,
  error: job.error,
})

export const getAuditActorId = (actor: ExportActor): string => {
  if (actor.actorType === 'api_key') {
    return actor.apiKeyId ?? actor.userId
  }
  return actor.userId
}

export const getSignedExportDownload = async (
  s3Key: string,
): Promise<{ url: string; expiresIn: number } | null> => {
  const bucket = getBucket()
  if (!bucket) {
    return null
  }

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  )

  return {
    url,
    expiresIn: DOWNLOAD_URL_TTL_SECONDS,
  }
}
