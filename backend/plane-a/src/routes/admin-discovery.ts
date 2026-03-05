import type { FastifyInstance } from 'fastify'
import type { PoolClient } from 'pg'
import { z } from 'zod'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { createLogger } from '../../../shared/logger'
import { requireAdmin } from '../plugins/auth-plugin'
import { DiscoveryScanRepository } from '../repositories'

const logger = createLogger('plane-a.admin-discovery')

// -- Query/body schemas ----------------------------------------------------------

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

// -- Route module ----------------------------------------------------------------

export const adminDiscoveryRoutes = async (app: FastifyInstance) => {
  const pool = app.container.pool
  const repo = new DiscoveryScanRepository(pool)

  // ----------------------------------------------------------------
  // GET /admin/discovery/scans -- List recent discovery scans
  // ----------------------------------------------------------------
  app.get('/admin/discovery/scans', { preHandler: requireAdmin() }, async (request) => {
    const parsed = listScansSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const scans = await repo.listScans(parsed.data)
    return { scans }
  })

  // ----------------------------------------------------------------
  // GET /admin/discovery/scans/:scanId -- Full scan details
  // ----------------------------------------------------------------
  app.get('/admin/discovery/scans/:scanId', { preHandler: requireAdmin() }, async (request) => {
    const paramsParsed = scanIdParamSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      throw new ValidationError('Invalid scan ID', {
        details: { error: 'bad_request', details: paramsParsed.error.issues },
      })
    }

    const scan = await repo.getScanById(paramsParsed.data.scanId)
    if (!scan) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId: paramsParsed.data.scanId }],
      })
    }

    return { scan }
  })

  // ----------------------------------------------------------------
  // GET /admin/discovery/pending-reviews -- Scans with non-empty diffs
  // ----------------------------------------------------------------
  app.get('/admin/discovery/pending-reviews', { preHandler: requireAdmin() }, async (request) => {
    const parsed = pendingReviewsSchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      throw new ValidationError('Invalid request', {
        details: { error: 'bad_request', details: parsed.error.issues },
      })
    }

    const scans = await repo.listPendingReviews(parsed.data.limit)
    return { scans }
  })

  // ----------------------------------------------------------------
  // POST /admin/discovery/scans/:scanId/approve -- Apply approved changes
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

    // All writes are wrapped in a transaction to prevent partial application.
    const client: PoolClient = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Fetch the scan record inside the transaction for consistency
      const scan = await repo.getScanForApproval(scanId, client)

      if (!scan) {
        await client.query('ROLLBACK')
        throw new NotFoundError('Discovery scan not found', {
          details: [{ message: 'scan_not_found', scanId }],
        })
      }

      if (!scan.result_json) {
        await client.query('ROLLBACK')
        throw new ValidationError('Scan has no result data to apply', {
          details: [{ message: 'no_result_json', scanId }],
        })
      }

      if (scan.status !== 'completed' && scan.status !== 'partial') {
        await client.query('ROLLBACK')
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
        const discoveredSources = new Set<string>()
        const discoveredDests = new Set<string>()

        for (const corridor of corridors) {
          discoveredSources.add(corridor.sourceCountry)
          discoveredDests.add(corridor.destinationCountry)
        }

        const currentRow = await repo.getRightsMatrixCountries(providerId, client)

        const existingSources: string[] = currentRow?.source_countries ?? []
        const existingDests: string[] = currentRow?.destination_countries ?? []

        const mergedSources = [...new Set([...existingSources, ...discoveredSources])].sort()
        const mergedDests = [...new Set([...existingDests, ...discoveredDests])].sort()

        const existingSourceSet = new Set(existingSources)
        const existingDestSet = new Set(existingDests)
        const newSources = [...discoveredSources].filter((c) => !existingSourceSet.has(c)).sort()
        const newDests = [...discoveredDests].filter((c) => !existingDestSet.has(c)).sort()

        if (newSources.length > 0 || newDests.length > 0) {
          try {
            await repo.upsertRightsMatrix(providerId, mergedSources, mergedDests, client)

            applyResult.rightsMatrixUpdated = true
            applyResult.sourceCountriesAdded = newSources
            applyResult.destinationCountriesAdded = newDests

            if (newSources.length > 0) {
              await repo.insertRightsMatrixAuditLog(
                providerId,
                'source_countries',
                JSON.stringify(existingSources),
                JSON.stringify(mergedSources),
                scanId,
                approvedBy,
                client,
              )
            }

            if (newDests.length > 0) {
              await repo.insertRightsMatrixAuditLog(
                providerId,
                'destination_countries',
                JSON.stringify(existingDests),
                JSON.stringify(mergedDests),
                scanId,
                approvedBy,
                client,
              )
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            logger.error('discovery_approve_rights_matrix_error', {
              scanId,
              providerId,
              error: message,
            })
            applyResult.errors.push(`rights_matrix: ${message}`)
          }
        }
      }

      // 3. Apply delivery method updates to provider_corridor_capability
      if (deliveryMethods.length > 0) {
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

            const existingRow = await repo.getCorridorCapabilityMethods(providerId, corridorId, client)

            const existingPayins: string[] = existingRow?.payin_methods ?? []
            const existingPayouts: string[] = existingRow?.payout_methods ?? []

            const mergedPayins = [...new Set([...existingPayins, ...discoveredPayins])].sort()
            const mergedPayouts = [...new Set([...existingPayouts, ...discoveredPayouts])].sort()

            const existingPayinSet = new Set(existingPayins)
            const existingPayoutSet = new Set(existingPayouts)
            const hasNewPayins = [...discoveredPayins].some((m) => !existingPayinSet.has(m))
            const hasNewPayouts = [...discoveredPayouts].some((m) => !existingPayoutSet.has(m))

            await repo.upsertCorridorCapability(providerId, corridorId, mergedPayins, mergedPayouts, client)

            applyResult.capabilitiesUpserted++
            if (hasNewPayins || hasNewPayouts) {
              applyResult.corridorsWithNewMethods.push(corridorId)
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            logger.error('discovery_approve_capability_error', {
              scanId,
              providerId,
              corridorId,
              error: message,
            })
            applyResult.errors.push(`corridor_capability[${corridorId}]: ${message}`)
          }
        }
      }

      // 4. Clear diff_json to remove from pending reviews queue
      await repo.clearDiffJson(scanId, client)

      await client.query('COMMIT')

      logger.info('discovery_scan_approved', {
        scanId,
        providerId,
        approvedBy,
        rightsMatrixUpdated: applyResult.rightsMatrixUpdated,
        sourceCountriesAdded: applyResult.sourceCountriesAdded.length,
        destinationCountriesAdded: applyResult.destinationCountriesAdded.length,
        capabilitiesUpserted: applyResult.capabilitiesUpserted,
        corridorsWithNewMethods: applyResult.corridorsWithNewMethods.length,
      })

      return { result: applyResult }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
  })

  // ----------------------------------------------------------------
  // POST /admin/discovery/scans/:scanId/dismiss -- Dismiss scan without applying
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
    const scan = await repo.getScanForDismissal(scanId)

    if (!scan) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId }],
      })
    }

    // Nullify diff_json to remove from pending reviews
    await repo.clearDiffJson(scanId)

    logger.info('discovery_scan_dismissed', {
      scanId,
      providerId: scan.provider_id,
      dismissedBy,
    })

    return { dismissed: true, scanId }
  })
}
