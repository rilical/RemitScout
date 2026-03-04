import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'

const logger = createLogger('plane-a.admin-discovery')

// ── Query/body schemas ──────────────────────────────────────────────

const listScansSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  providerId: z.string().min(1).optional(),
  status: z.enum(['running', 'completed', 'failed', 'partial']).optional(),
})

const scanIdParamSchema = z.object({
  scanId: z.coerce.number().int().positive(),
})

const pendingReviewsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

// ── Route module ────────────────────────────────────────────────────

export const adminDiscoveryRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool

  // ----------------------------------------------------------------
  // GET /admin/discovery/scans — List recent discovery scans
  // ----------------------------------------------------------------
  app.get('/admin/discovery/scans', { preHandler: requireAdmin() }, async (request) => {
    const parsed = listScansSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const { limit, providerId, status } = parsed.data

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (providerId) {
      conditions.push(`provider_id = $${paramIndex}`)
      params.push(providerId)
      paramIndex++
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    params.push(limit)
    const limitParam = `$${paramIndex}`

    const result = await pool.query(
      `SELECT id, provider_id, scan_type, status,
              corridors_discovered, delivery_methods_discovered,
              promotions_detected, errors_count, duration_ms,
              triggered_by, correlation_id,
              started_at, completed_at, created_at
       FROM silver.discovery_scan
       ${whereClause}
       ORDER BY started_at DESC
       LIMIT ${limitParam}`,
      params,
    )

    return { scans: result.rows }
  })

  // ----------------------------------------------------------------
  // GET /admin/discovery/scans/:scanId — Full scan details
  // ----------------------------------------------------------------
  app.get('/admin/discovery/scans/:scanId', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const { scanId } = paramsParsed.data

    const result = await pool.query(
      `SELECT id, provider_id, scan_type, status,
              corridors_discovered, delivery_methods_discovered,
              promotions_detected, errors_count,
              result_json, diff_json,
              duration_ms, triggered_by, correlation_id,
              started_at, completed_at, created_at
       FROM silver.discovery_scan
       WHERE id = $1`,
      [scanId],
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId }],
      })
    }

    return { scan: result.rows[0] }
  })

  // ----------------------------------------------------------------
  // GET /admin/discovery/pending-reviews — Scans with non-empty diffs
  // ----------------------------------------------------------------
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
              started_at, completed_at, created_at
       FROM silver.discovery_scan
       WHERE diff_json IS NOT NULL
         AND diff_json != 'null'::jsonb
         AND status IN ('completed', 'partial')
       ORDER BY completed_at DESC
       LIMIT $1`,
      [parsed.data.limit],
    )

    return { scans: result.rows }
  })

  // ----------------------------------------------------------------
  // POST /admin/discovery/scans/:scanId/approve — Apply approved changes
  // ----------------------------------------------------------------
  app.post('/admin/discovery/scans/:scanId/approve', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const { scanId } = paramsParsed.data
    const approvedBy = request.user?.user_id ?? 'unknown'

    // 1. Fetch the scan record
    const scanResult = await pool.query(
      `SELECT id, provider_id, status, result_json, diff_json
       FROM silver.discovery_scan
       WHERE id = $1`,
      [scanId],
    )

    if (scanResult.rows.length === 0) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId }],
      })
    }

    const scan = scanResult.rows[0]

    if (!scan.result_json) {
      throw new ValidationError('Scan has no result data to apply', {
        details: [{ message: 'no_result_json', scanId }],
      })
    }

    if (scan.status !== 'completed' && scan.status !== 'partial') {
      throw new ValidationError('Only completed or partial scans can be approved', {
        details: [{ message: 'invalid_scan_status', status: scan.status }],
      })
    }

    const resultJson = scan.result_json as {
      providerId?: string
      corridors?: Array<{
        sourceCountry: string
        destinationCountry: string
        sourceCurrency: string
        destinationCurrency: string
        corridorId: string
        payinMethods: string[]
        payoutMethods: string[]
      }>
      deliveryMethods?: Array<{
        corridorId: string | null
        normalizedPayin: string
        normalizedPayout: string
      }>
    }

    const providerId = scan.provider_id as string
    const corridors = resultJson.corridors ?? []
    const deliveryMethods = resultJson.deliveryMethods ?? []

    const applyResult = {
      providerId,
      rightsMatrixUpdated: false,
      sourceCountriesAdded: [] as string[],
      destinationCountriesAdded: [] as string[],
      capabilitiesUpserted: 0,
      corridorsWithNewMethods: [] as string[],
      errors: [] as string[],
    }

    // 2. Apply country expansions to rights_matrix
    if (corridors.length > 0) {
      try {
        const discoveredSources = new Set<string>()
        const discoveredDests = new Set<string>()

        for (const corridor of corridors) {
          discoveredSources.add(corridor.sourceCountry)
          discoveredDests.add(corridor.destinationCountry)
        }

        // Load current rights_matrix
        const currentRow = await pool.query(
          `SELECT source_countries, destination_countries
           FROM silver.rights_matrix
           WHERE provider_id = $1
           LIMIT 1`,
          [providerId],
        )

        const existingSources: string[] = currentRow.rows[0]?.source_countries ?? []
        const existingDests: string[] = currentRow.rows[0]?.destination_countries ?? []

        // Merge: union of existing + discovered
        const mergedSources = [...new Set([...existingSources, ...discoveredSources])].sort()
        const mergedDests = [...new Set([...existingDests, ...discoveredDests])].sort()

        // Compute what's new
        const existingSourceSet = new Set(existingSources)
        const existingDestSet = new Set(existingDests)
        const newSources = [...discoveredSources].filter((c) => !existingSourceSet.has(c)).sort()
        const newDests = [...discoveredDests].filter((c) => !existingDestSet.has(c)).sort()

        if (newSources.length > 0 || newDests.length > 0) {
          // Upsert with merged arrays
          await pool.query(
            `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
             VALUES ($1, $2, $3)
             ON CONFLICT (provider_id) DO UPDATE SET
               source_countries = $2,
               destination_countries = $3,
               last_audited_at = NOW(),
               updated_at = NOW()`,
            [providerId, mergedSources, mergedDests],
          )

          applyResult.rightsMatrixUpdated = true
          applyResult.sourceCountriesAdded = newSources
          applyResult.destinationCountriesAdded = newDests

          // Audit trail for source_countries
          if (newSources.length > 0) {
            await pool.query(
              `INSERT INTO silver.rights_matrix_audit_log
                 (provider_id, field_changed, previous_value, new_value, discovery_scan_id, approved_by)
               VALUES ($1, 'source_countries', $2, $3, $4, $5)`,
              [providerId, JSON.stringify(existingSources), JSON.stringify(mergedSources), scanId, approvedBy],
            )
          }

          // Audit trail for destination_countries
          if (newDests.length > 0) {
            await pool.query(
              `INSERT INTO silver.rights_matrix_audit_log
                 (provider_id, field_changed, previous_value, new_value, discovery_scan_id, approved_by)
               VALUES ($1, 'destination_countries', $2, $3, $4, $5)`,
              [providerId, JSON.stringify(existingDests), JSON.stringify(mergedDests), scanId, approvedBy],
            )
          }
        }
      } catch (err) {
        const msg = `rights_matrix update failed: ${err instanceof Error ? err.message : String(err)}`
        applyResult.errors.push(msg)
        logger.error('discovery_approve_rights_matrix_error', { providerId, scanId, error: msg })
      }
    }

    // 3. Apply delivery method updates to provider_corridor_capability
    if (deliveryMethods.length > 0) {
      // Group delivery methods by corridorId
      const byCorridorId = new Map<string, Array<{ normalizedPayin: string; normalizedPayout: string }>>()
      for (const method of deliveryMethods) {
        const cid = method.corridorId
        if (!cid) continue
        const existing = byCorridorId.get(cid) ?? []
        existing.push(method)
        byCorridorId.set(cid, existing)
      }

      for (const [corridorId, methods] of byCorridorId) {
        try {
          const discoveredPayins = new Set<string>()
          const discoveredPayouts = new Set<string>()
          for (const m of methods) {
            discoveredPayins.add(m.normalizedPayin)
            discoveredPayouts.add(m.normalizedPayout)
          }

          // Load existing capability for this corridor
          const existingRow = await pool.query(
            `SELECT payin_methods, payout_methods
             FROM silver.provider_corridor_capability
             WHERE provider_id = $1 AND corridor_id = $2
             LIMIT 1`,
            [providerId, corridorId],
          )

          const existingPayins: string[] = existingRow.rows[0]?.payin_methods ?? []
          const existingPayouts: string[] = existingRow.rows[0]?.payout_methods ?? []

          // Merge: union of existing + discovered
          const mergedPayins = [...new Set([...existingPayins, ...discoveredPayins])].sort()
          const mergedPayouts = [...new Set([...existingPayouts, ...discoveredPayouts])].sort()

          const existingPayinSet = new Set(existingPayins)
          const existingPayoutSet = new Set(existingPayouts)
          const hasNewPayins = [...discoveredPayins].some((m) => !existingPayinSet.has(m))
          const hasNewPayouts = [...discoveredPayouts].some((m) => !existingPayoutSet.has(m))

          // Upsert with merged methods
          await pool.query(
            `INSERT INTO silver.provider_corridor_capability
               (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
             VALUES ($1, $2, $3, $4, true, 'discovery', NOW())
             ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
               payin_methods = $3,
               payout_methods = $4,
               is_supported = true,
               source = CASE
                 WHEN silver.provider_corridor_capability.source = 'discovery' THEN 'discovery'
                 ELSE silver.provider_corridor_capability.source || '+discovery'
               END,
               last_verified_at = NOW(),
               updated_at = NOW()`,
            [providerId, corridorId, mergedPayins, mergedPayouts],
          )

          applyResult.capabilitiesUpserted++
          if (hasNewPayins || hasNewPayouts) {
            applyResult.corridorsWithNewMethods.push(corridorId)
          }
        } catch (err) {
          const msg = `corridor ${corridorId}: ${err instanceof Error ? err.message : String(err)}`
          applyResult.errors.push(msg)
          logger.warn('discovery_approve_corridor_error', { providerId, corridorId, scanId, error: msg })
        }
      }
    }

    // 4. Clear diff_json to remove from pending reviews queue
    await pool.query(
      `UPDATE silver.discovery_scan
       SET diff_json = NULL
       WHERE id = $1`,
      [scanId],
    )

    logger.info('discovery_scan_approved', {
      scanId,
      providerId,
      approvedBy,
      rightsMatrixUpdated: applyResult.rightsMatrixUpdated,
      sourceCountriesAdded: applyResult.sourceCountriesAdded.length,
      destinationCountriesAdded: applyResult.destinationCountriesAdded.length,
      capabilitiesUpserted: applyResult.capabilitiesUpserted,
      corridorsWithNewMethods: applyResult.corridorsWithNewMethods.length,
      errors: applyResult.errors.length,
    })

    return { result: applyResult }
  })

  // ----------------------------------------------------------------
  // POST /admin/discovery/scans/:scanId/dismiss — Dismiss scan without applying
  // ----------------------------------------------------------------
  app.post('/admin/discovery/scans/:scanId/dismiss', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const { scanId } = paramsParsed.data
    const dismissedBy = request.user?.user_id ?? 'unknown'

    // Verify the scan exists
    const scanResult = await pool.query(
      `SELECT id, provider_id, status
       FROM silver.discovery_scan
       WHERE id = $1`,
      [scanId],
    )

    if (scanResult.rows.length === 0) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId }],
      })
    }

    // Nullify diff_json to remove from pending reviews
    await pool.query(
      `UPDATE silver.discovery_scan
       SET diff_json = NULL
       WHERE id = $1`,
      [scanId],
    )

    logger.info('discovery_scan_dismissed', {
      scanId,
      providerId: scanResult.rows[0].provider_id,
      dismissedBy,
    })

    return { dismissed: true, scanId }
  })
}
