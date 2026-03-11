import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import {
  getDiscoveryScanById,
  approveDiscoveryScan,
  dismissDiscoveryScan,
  applyDiscoveryScan,
} from '../../../shared/discovery/discovery-review'
import { requireAdmin } from '../plugins/auth-plugin'
import { getRequestContext, logAuditEvent } from '../services/audit-log'

const logger = createLogger('plane-a.admin-discovery')

// NOTE: This dynamically imports from scripts/lib/ which is outside plane-a.
// Scripts are allowed to be imported by planes per architecture rules (they
// run as ECS tasks within a specific plane's context).
const loadProviderCertificationModule = async () => {
  const modulePath = '../../../scripts/lib/' + 'provider-certification'
  return await import(modulePath)
}

const listScansSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  providerId: z.string().min(1).optional(),
  status: z.enum(['running', 'completed', 'failed', 'partial']).optional(),
  reviewStatus: z.enum(['pending_review', 'approved', 'automation_approved', 'dismissed', 'not_required']).optional(),
  applyStatus: z.enum(['not_requested', 'pending_apply', 'applying', 'applied', 'failed', 'dismissed', 'not_applicable']).optional(),
})

const scanIdParamSchema = z.object({
  scanId: z.coerce.number().int().positive(),
})

const runIdParamSchema = z.object({
  runId: z.string().min(1),
})

const pendingReviewsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

const approveBodySchema = z.object({
  mode: z.enum(['operator', 'automation']).default('operator'),
}).partial()

const triggerCertificationSchema = z.object({
  providerIds: z.array(z.string().min(1)).max(100).optional(),
  planeABaseUrl: z.string().url().optional(),
  method: z.enum(['bank', 'cash', 'wallet', 'airtime', 'home', 'card']).optional(),
  amount: z.coerce.number().positive().max(100000).optional(),
  windowHours: z.coerce.number().int().min(1).max(168).optional(),
  reviewOnly: z.coerce.boolean().optional(),
  notes: z.string().max(2000).optional(),
})

const getActorId = (request: any): string => request.user?.email ?? request.user?.user_id ?? 'unknown'

export const adminDiscoveryRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool

  app.get('/admin/discovery/scans', { preHandler: requireAdmin() }, async (request) => {
    const parsed = listScansSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const { limit, providerId, status, reviewStatus, applyStatus } = parsed.data
    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (providerId) {
      conditions.push(`provider_id = $${paramIndex++}`)
      params.push(providerId)
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    if (reviewStatus) {
      conditions.push(`review_status = $${paramIndex++}`)
      params.push(reviewStatus)
    }
    if (applyStatus) {
      conditions.push(`apply_status = $${paramIndex++}`)
      params.push(applyStatus)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit)
    const result = await pool.query(
      `SELECT id, provider_id, scan_type, status,
              corridors_discovered, delivery_methods_discovered,
              promotions_detected, errors_count, duration_ms,
              triggered_by, correlation_id,
              review_status, approved_by, approved_at::text,
              apply_status, applied_at::text, apply_errors_json,
              started_at::text, completed_at::text, created_at::text
         FROM silver.discovery_scan
         ${whereClause}
        ORDER BY started_at DESC
        LIMIT $${paramIndex}`,
      params,
    )

    return { scans: result.rows }
  })

  app.get('/admin/discovery/scans/:scanId', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const scan = await getDiscoveryScanById(pool, paramsParsed.data.scanId)
    if (!scan) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId: paramsParsed.data.scanId }],
      })
    }

    return { scan }
  })

  app.get('/admin/discovery/pending-reviews', { preHandler: requireAdmin() }, async (request) => {
    const parsed = pendingReviewsSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const result = await pool.query(
      `SELECT id, provider_id, scan_type, status,
              corridors_discovered, delivery_methods_discovered,
              promotions_detected, errors_count,
              diff_json, duration_ms, triggered_by,
              review_status, approved_by, approved_at::text,
              apply_status, applied_at::text, apply_errors_json,
              started_at::text, completed_at::text, created_at::text
         FROM silver.discovery_scan
        WHERE diff_json IS NOT NULL
          AND diff_json != 'null'::jsonb
          AND status IN ('completed', 'partial')
          AND review_status != 'dismissed'
          AND apply_status != 'applied'
        ORDER BY completed_at DESC NULLS LAST, id DESC
        LIMIT $1`,
      [parsed.data.limit],
    )

    return { scans: result.rows }
  })

  app.post('/admin/discovery/scans/:scanId/approve', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }
    const bodyParsed = approveBodySchema.safeParse(request.body ?? {})
    if (!bodyParsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: bodyParsed.error.issues },
      })
    }

    const actorId = getActorId(request)
    const scan = await approveDiscoveryScan(pool, paramsParsed.data.scanId, {
      approvedBy: actorId,
      mode: bodyParsed.data.mode ?? 'operator',
    })

    await logAuditEvent(pool, {
      actorId,
      actorType: 'admin',
      actorRole: request.user?.role ?? undefined,
      action: 'discovery.scan.approved',
      entityType: 'discovery_scan',
      entityId: String(scan.id),
      resourceType: 'provider',
      resourceId: scan.provider_id,
      category: 'admin',
      severity: 'warning',
      reason: `review_status=${scan.review_status}`,
      afterSnapshot: {
        review_status: scan.review_status,
        apply_status: scan.apply_status,
        approved_by: scan.approved_by,
        approved_at: scan.approved_at,
      },
      metadata: {
        mode: bodyParsed.data.mode ?? 'operator',
      },
      ...getRequestContext(request),
    })

    logger.info('discovery_scan_review_approved', {
      scanId: scan.id,
      providerId: scan.provider_id,
      approvedBy: actorId,
      mode: bodyParsed.data.mode ?? 'operator',
    })

    return { approved: true, scan }
  })

  app.post('/admin/discovery/scans/:scanId/apply', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const actorId = getActorId(request)
    const outcome = await applyDiscoveryScan(pool, paramsParsed.data.scanId, {
      appliedBy: actorId,
    })

    await logAuditEvent(pool, {
      actorId,
      actorType: 'admin',
      actorRole: request.user?.role ?? undefined,
      action: outcome.applied ? 'discovery.scan.applied' : 'discovery.scan.apply_failed',
      entityType: 'discovery_scan',
      entityId: String(outcome.scan.id),
      resourceType: 'provider',
      resourceId: outcome.scan.provider_id,
      category: 'admin',
      severity: outcome.applied ? 'warning' : 'error',
      reason: outcome.applied ? `apply_status=${outcome.scan.apply_status}` : 'apply_failed',
      afterSnapshot: {
        apply_status: outcome.scan.apply_status,
        applied_at: outcome.scan.applied_at,
        apply_errors_json: outcome.scan.apply_errors_json,
      },
      metadata: {
        idempotent: outcome.idempotent,
        result: outcome.result,
        errors: outcome.errors,
      },
      ...getRequestContext(request),
    })

    return outcome
  })

  app.post('/admin/discovery/scans/:scanId/dismiss', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const actorId = getActorId(request)
    const scan = await dismissDiscoveryScan(pool, paramsParsed.data.scanId)

    await logAuditEvent(pool, {
      actorId,
      actorType: 'admin',
      actorRole: request.user?.role ?? undefined,
      action: 'discovery.scan.dismissed',
      entityType: 'discovery_scan',
      entityId: String(scan.id),
      resourceType: 'provider',
      resourceId: scan.provider_id,
      category: 'admin',
      severity: 'warning',
      reason: 'review_dismissed',
      afterSnapshot: {
        review_status: scan.review_status,
        apply_status: scan.apply_status,
      },
      ...getRequestContext(request),
    })

    logger.info('discovery_scan_dismissed', {
      scanId: scan.id,
      providerId: scan.provider_id,
      dismissedBy: actorId,
    })

    return { dismissed: true, scan }
  })

  app.get('/admin/discovery/certifications/runs', { preHandler: requireAdmin() }, async (request) => {
    const parsed = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }).safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const result = await pool.query(
      `SELECT run_id,
              environment,
              status,
              triggered_by,
              requested_by,
              catalog_count,
              provider_count,
              certified_count,
              degraded_count,
              blocked_count,
              review_only,
              notes,
              created_at::text,
              completed_at::text
         FROM silver.provider_certification_run
        ORDER BY created_at DESC
        LIMIT $1`,
      [parsed.data.limit],
    )

    return { runs: result.rows }
  })

  app.get('/admin/discovery/certifications/runs/:runId', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = runIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid run ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const runResult = await pool.query(
      `SELECT run_id,
              environment,
              status,
              triggered_by,
              requested_by,
              catalog_count,
              provider_count,
              certified_count,
              degraded_count,
              blocked_count,
              review_only,
              notes,
              artifact_manifest_json,
              error_json,
              created_at::text,
              completed_at::text
         FROM silver.provider_certification_run
        WHERE run_id = $1`,
      [paramsParsed.data.runId],
    )

    if (runResult.rows.length === 0) {
      throw new NotFoundError('Certification run not found', {
        details: [{ message: 'run_not_found', runId: paramsParsed.data.runId }],
      })
    }

    const results = await pool.query(
      `SELECT provider_id,
              status,
              evidence_confidence,
              evidence_lane,
              summary,
              drift_reasons,
              artifact_pointers_json,
              evidence_json,
              discovery_scan_id,
              created_at::text
         FROM silver.provider_certification_result
        WHERE run_id = $1
        ORDER BY provider_id ASC`,
      [paramsParsed.data.runId],
    )

    return {
      run: runResult.rows[0],
      results: results.rows,
    }
  })

  app.post('/admin/discovery/certifications/runs', { preHandler: requireAdmin() }, async (request, reply) => {
    const parsed = triggerCertificationSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const actorId = getActorId(request)
    const { runProviderCertification } = await loadProviderCertificationModule()
    const run = await runProviderCertification({
      providerIds: parsed.data.providerIds,
      planeABaseUrl: parsed.data.planeABaseUrl,
      method: parsed.data.method,
      amount: parsed.data.amount,
      windowHours: parsed.data.windowHours,
      reviewOnly: parsed.data.reviewOnly ?? true,
      requestedBy: actorId,
      triggeredBy: 'manual',
      notes: parsed.data.notes,
      pool,
    })

    await logAuditEvent(pool, {
      actorId,
      actorType: 'admin',
      actorRole: request.user?.role ?? undefined,
      action: 'provider.certification.triggered',
      entityType: 'provider_certification_run',
      entityId: run.run_id,
      resourceType: 'provider_control_plane',
      resourceId: run.run_id,
      category: 'admin',
      severity: 'warning',
      reason: `status=${run.status}`,
      afterSnapshot: {
        provider_count: run.provider_count,
        certified_count: run.certified_count,
        degraded_count: run.degraded_count,
        blocked_count: run.blocked_count,
      },
      metadata: {
        review_only: run.review_only,
        method: parsed.data.method ?? 'bank',
      },
      ...getRequestContext(request),
    })

    reply.code(201)
    return run
  })
}
