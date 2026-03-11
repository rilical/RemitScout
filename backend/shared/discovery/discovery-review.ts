/**
 * Discovery scan review — DB operations for listing, approving,
 * dismissing, and applying discovery scans.
 *
 * Canonical location: backend/shared/discovery/discovery-review.ts
 * Re-exported from plane-b for backward compatibility.
 */

import type { Pool, PoolClient } from 'pg'
import { createLogger } from '../logger'
import { NotFoundError, ValidationError } from '../errors'
import { listProviders } from '../provider-catalog'
import { applyDiscoveryResults, type ApplyResult } from './discovery-applier'
import type { DiscoveryResult } from './discovery-types'

const logger = createLogger('shared.discovery.review')

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>

export type DiscoveryScanReviewStatus =
  | 'pending_review'
  | 'approved'
  | 'automation_approved'
  | 'dismissed'
  | 'not_required'

export type DiscoveryScanApplyStatus =
  | 'not_requested'
  | 'pending_apply'
  | 'applying'
  | 'applied'
  | 'failed'
  | 'dismissed'
  | 'not_applicable'

export type DiscoveryScanRow = {
  id: number
  provider_id: string
  scan_type: string
  status: 'running' | 'completed' | 'failed' | 'partial'
  corridors_discovered: number | null
  delivery_methods_discovered: number | null
  promotions_detected: number | null
  errors_count: number | null
  result_json: DiscoveryResult | null
  diff_json: Record<string, unknown> | null
  duration_ms: number | null
  triggered_by: string | null
  correlation_id: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  review_status: DiscoveryScanReviewStatus
  approved_by: string | null
  approved_at: string | null
  apply_status: DiscoveryScanApplyStatus
  applied_at: string | null
  apply_errors_json: Array<Record<string, unknown>> | null
  apply_result_json: ApplyResult | null
}

export type DiscoveryApplyOutcome = {
  applied: boolean
  idempotent: boolean
  result: ApplyResult | null
  scan: DiscoveryScanRow
  errors: Array<Record<string, unknown>>
}

const DISCOVERY_SCAN_FIELDS = `
  id,
  provider_id,
  scan_type,
  status,
  corridors_discovered,
  delivery_methods_discovered,
  promotions_detected,
  errors_count,
  result_json,
  diff_json,
  duration_ms,
  triggered_by,
  correlation_id,
  started_at::text,
  completed_at::text,
  created_at::text,
  review_status,
  approved_by,
  approved_at::text,
  apply_status,
  applied_at::text,
  apply_errors_json,
  apply_result_json
`

const normalizeArray = (value: unknown): Array<Record<string, unknown>> | null => {
  return Array.isArray(value)
    ? value.filter((entry) => entry && typeof entry === 'object') as Array<Record<string, unknown>>
    : null
}

const normalizeScan = (row: Record<string, any>): DiscoveryScanRow => ({
  id: Number(row.id),
  provider_id: String(row.provider_id || ''),
  scan_type: String(row.scan_type || 'full'),
  status: row.status,
  corridors_discovered: row.corridors_discovered ?? null,
  delivery_methods_discovered: row.delivery_methods_discovered ?? null,
  promotions_detected: row.promotions_detected ?? null,
  errors_count: row.errors_count ?? null,
  result_json: (row.result_json ?? null) as DiscoveryResult | null,
  diff_json: (row.diff_json ?? null) as Record<string, unknown> | null,
  duration_ms: row.duration_ms ?? null,
  triggered_by: row.triggered_by ?? null,
  correlation_id: row.correlation_id ?? null,
  started_at: row.started_at ?? null,
  completed_at: row.completed_at ?? null,
  created_at: row.created_at ?? null,
  review_status: row.review_status,
  approved_by: row.approved_by ?? null,
  approved_at: row.approved_at ?? null,
  apply_status: row.apply_status,
  applied_at: row.applied_at ?? null,
  apply_errors_json: normalizeArray(row.apply_errors_json),
  apply_result_json: (row.apply_result_json ?? null) as ApplyResult | null,
})

const fetchScan = async (
  executor: Queryable,
  scanId: number,
  options: { forUpdate?: boolean } = {},
): Promise<DiscoveryScanRow | null> => {
  const lockClause = options.forUpdate ? ' FOR UPDATE' : ''
  const result = await executor.query(
    `SELECT ${DISCOVERY_SCAN_FIELDS}
       FROM silver.discovery_scan
      WHERE id = $1${lockClause}`,
    [scanId],
  )

  if (result.rows.length === 0) {
    return null
  }

  return normalizeScan(result.rows[0] as Record<string, any>)
}

export const getDiscoveryScanById = async (
  executor: Queryable,
  scanId: number,
): Promise<DiscoveryScanRow | null> => {
  return fetchScan(executor, scanId)
}

const ensureReviewableScan = (scan: DiscoveryScanRow): void => {
  if (!scan.result_json) {
    throw new ValidationError('Scan has no result data to apply', {
      details: [{ message: 'no_result_json', scanId: scan.id }],
    })
  }

  if (scan.status !== 'completed' && scan.status !== 'partial') {
    throw new ValidationError('Only completed or partial scans can be reviewed', {
      details: [{ message: 'invalid_scan_status', status: scan.status }],
    })
  }

  if (!listProviders().includes(scan.provider_id as any)) {
    throw new ValidationError('Discovery scan references a non-canonical provider', {
      details: [{ message: 'provider_not_in_catalog', providerId: scan.provider_id }],
    })
  }
}

const buildApplyErrors = (scanId: number, error: unknown): Array<Record<string, unknown>> => {
  return [{
    code: 'apply_failed',
    message: error instanceof Error ? error.message : String(error),
    scan_id: scanId,
    occurred_at: new Date().toISOString(),
  }]
}

export const approveDiscoveryScan = async (
  executor: Queryable,
  scanId: number,
  input: { approvedBy: string; mode?: 'operator' | 'automation' },
): Promise<DiscoveryScanRow> => {
  const scan = await fetchScan(executor, scanId)
  if (!scan) {
    throw new NotFoundError('Discovery scan not found', {
      details: [{ message: 'scan_not_found', scanId }],
    })
  }

  ensureReviewableScan(scan)

  if (scan.apply_status === 'applied') {
    return scan
  }
  if (scan.review_status === 'dismissed') {
    throw new ValidationError('Dismissed scans cannot be approved without a new discovery run', {
      details: [{ message: 'scan_dismissed', scanId }],
    })
  }

  const reviewStatus: DiscoveryScanReviewStatus = input.mode === 'automation'
    ? 'automation_approved'
    : 'approved'

  const updated = await executor.query(
    `UPDATE silver.discovery_scan
        SET review_status = $2,
            approved_by = $3,
            approved_at = NOW(),
            apply_status = CASE
              WHEN diff_json IS NULL OR diff_json = 'null'::jsonb THEN 'not_applicable'
              WHEN apply_status = 'applied' THEN apply_status
              ELSE 'pending_apply'
            END,
            apply_errors_json = CASE
              WHEN apply_status = 'failed' THEN NULL
              ELSE apply_errors_json
            END
      WHERE id = $1
      RETURNING ${DISCOVERY_SCAN_FIELDS}`,
    [scanId, reviewStatus, input.approvedBy],
  )

  return normalizeScan(updated.rows[0] as Record<string, any>)
}

export const dismissDiscoveryScan = async (
  executor: Queryable,
  scanId: number,
): Promise<DiscoveryScanRow> => {
  const scan = await fetchScan(executor, scanId)
  if (!scan) {
    throw new NotFoundError('Discovery scan not found', {
      details: [{ message: 'scan_not_found', scanId }],
    })
  }

  if (scan.apply_status === 'applied') {
    throw new ValidationError('Applied scans cannot be dismissed', {
      details: [{ message: 'scan_already_applied', scanId }],
    })
  }

  const updated = await executor.query(
    `UPDATE silver.discovery_scan
        SET diff_json = NULL,
            review_status = 'dismissed',
            approved_by = NULL,
            approved_at = NULL,
            apply_status = 'dismissed',
            apply_errors_json = NULL,
            apply_result_json = NULL
      WHERE id = $1
      RETURNING ${DISCOVERY_SCAN_FIELDS}`,
    [scanId],
  )

  return normalizeScan(updated.rows[0] as Record<string, any>)
}

export const applyDiscoveryScan = async (
  pool: Pool,
  scanId: number,
  input: { appliedBy: string },
): Promise<DiscoveryApplyOutcome> => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const scan = await fetchScan(client, scanId, { forUpdate: true })
    if (!scan) {
      throw new NotFoundError('Discovery scan not found', {
        details: [{ message: 'scan_not_found', scanId }],
      })
    }

    ensureReviewableScan(scan)

    if (scan.apply_status === 'applied') {
      await client.query('COMMIT')
      return {
        applied: true,
        idempotent: true,
        result: scan.apply_result_json,
        scan,
        errors: [],
      }
    }

    if (scan.review_status !== 'approved' && scan.review_status !== 'automation_approved' && scan.review_status !== 'not_required') {
      throw new ValidationError('Scan must be approved before apply', {
        details: [{ message: 'scan_not_approved', reviewStatus: scan.review_status }],
      })
    }

    await client.query(
      `UPDATE silver.discovery_scan
          SET apply_status = 'applying',
              apply_errors_json = NULL
        WHERE id = $1`,
      [scanId],
    )

    const applyResult = await applyDiscoveryResults(
      client,
      scan.provider_id,
      scan.result_json!,
      {
        discoveryScanId: scan.id,
        approvedBy: scan.approved_by ?? input.appliedBy,
      },
    )

    const updatedResult = await client.query(
      `UPDATE silver.discovery_scan
          SET diff_json = NULL,
              apply_status = 'applied',
              applied_at = NOW(),
              apply_errors_json = NULL,
              apply_result_json = $2
        WHERE id = $1
        RETURNING ${DISCOVERY_SCAN_FIELDS}`,
      [scanId, JSON.stringify(applyResult)],
    )

    await client.query('COMMIT')

    const updatedScan = normalizeScan(updatedResult.rows[0] as Record<string, any>)
    logger.info('discovery_scan_applied', {
      scanId,
      providerId: updatedScan.provider_id,
      appliedBy: input.appliedBy,
      capabilitiesUpserted: applyResult.capabilitiesUpserted,
    })

    return {
      applied: true,
      idempotent: false,
      result: applyResult,
      scan: updatedScan,
      errors: [],
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)

    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error
    }

    const errors = buildApplyErrors(scanId, error)
    await pool.query(
      `UPDATE silver.discovery_scan
          SET apply_status = 'failed',
              apply_errors_json = $2
        WHERE id = $1`,
      [scanId, JSON.stringify(errors)],
    )

    const scan = await fetchScan(pool, scanId)
    if (!scan) {
      throw error
    }

    logger.error('discovery_scan_apply_failed', {
      scanId,
      providerId: scan.provider_id,
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      applied: false,
      idempotent: false,
      result: null,
      scan,
      errors,
    }
  } finally {
    client.release()
  }
}
