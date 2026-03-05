import type { Pool, PoolClient } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IDiscoveryScanRepository,
  ListScansFilters,
  DiscoveryScanListRecord,
  DiscoveryScanDetailRecord,
  DiscoveryScanPendingReviewRecord,
  DiscoveryScanApproveRecord,
  DiscoveryScanDismissRecord,
  RightsMatrixCountriesRecord,
  CorridorCapabilityMethodsRecord,
} from '../interfaces/discovery-scan-repository.interface'

export class DiscoveryScanRepository implements IDiscoveryScanRepository {
  constructor(private readonly pool: Pool) {}

  async listScans(filters: ListScansFilters): Promise<DiscoveryScanListRecord[]> {
    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (filters.providerId) {
      conditions.push(`provider_id = $${paramIndex}`)
      params.push(filters.providerId)
      paramIndex++
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    params.push(filters.limit)
    const limitParam = `$${paramIndex}`

    const result = await query<DiscoveryScanListRecord>(
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
      this.pool,
    )
    return result.rows
  }

  async getScanById(scanId: number): Promise<DiscoveryScanDetailRecord | null> {
    const result = await query<DiscoveryScanDetailRecord>(
      `SELECT id, provider_id, scan_type, status,
              corridors_discovered, delivery_methods_discovered,
              promotions_detected, errors_count,
              result_json, diff_json,
              duration_ms, triggered_by, correlation_id,
              started_at, completed_at, created_at
       FROM silver.discovery_scan
       WHERE id = $1`,
      [scanId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async listPendingReviews(limit: number): Promise<DiscoveryScanPendingReviewRecord[]> {
    const result = await query<DiscoveryScanPendingReviewRecord>(
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
      [limit],
      this.pool,
    )
    return result.rows
  }

  async getScanForApproval(scanId: number, client?: PoolClient): Promise<DiscoveryScanApproveRecord | null> {
    const result = await query<DiscoveryScanApproveRecord>(
      `SELECT id, provider_id, status, result_json, diff_json
       FROM silver.discovery_scan
       WHERE id = $1
       ${client ? 'FOR UPDATE' : ''}`,
      [scanId],
      client ?? this.pool,
    )
    return result.rows[0] ?? null
  }

  async getScanForDismissal(scanId: number): Promise<DiscoveryScanDismissRecord | null> {
    const result = await query<DiscoveryScanDismissRecord>(
      `SELECT id, provider_id, status
       FROM silver.discovery_scan
       WHERE id = $1`,
      [scanId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async getRightsMatrixCountries(providerId: string, client?: PoolClient): Promise<RightsMatrixCountriesRecord | null> {
    const result = await query<RightsMatrixCountriesRecord>(
      `SELECT source_countries, destination_countries
       FROM silver.rights_matrix
       WHERE provider_id = $1
       LIMIT 1`,
      [providerId],
      client ?? this.pool,
    )
    return result.rows[0] ?? null
  }

  async upsertRightsMatrix(
    providerId: string,
    sourceCountries: string[],
    destinationCountries: string[],
    client?: PoolClient,
  ): Promise<void> {
    await query(
      `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider_id) DO UPDATE SET
         source_countries = $2,
         destination_countries = $3,
         last_audited_at = NOW(),
         updated_at = NOW()`,
      [providerId, sourceCountries, destinationCountries],
      client ?? this.pool,
    )
  }

  async insertRightsMatrixAuditLog(
    providerId: string,
    fieldChanged: string,
    previousValue: string,
    newValue: string,
    discoveryScanId: number,
    approvedBy: string,
    client?: PoolClient,
  ): Promise<void> {
    await query(
      `INSERT INTO silver.rights_matrix_audit_log
         (provider_id, field_changed, previous_value, new_value, discovery_scan_id, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [providerId, fieldChanged, previousValue, newValue, discoveryScanId, approvedBy],
      client ?? this.pool,
    )
  }

  async getCorridorCapabilityMethods(
    providerId: string,
    corridorId: string,
    client?: PoolClient,
  ): Promise<CorridorCapabilityMethodsRecord | null> {
    const result = await query<CorridorCapabilityMethodsRecord>(
      `SELECT payin_methods, payout_methods
       FROM silver.provider_corridor_capability
       WHERE provider_id = $1 AND corridor_id = $2
       LIMIT 1`,
      [providerId, corridorId],
      client ?? this.pool,
    )
    return result.rows[0] ?? null
  }

  async upsertCorridorCapability(
    providerId: string,
    corridorId: string,
    payinMethods: string[],
    payoutMethods: string[],
    client?: PoolClient,
  ): Promise<void> {
    await query(
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
      [providerId, corridorId, payinMethods, payoutMethods],
      client ?? this.pool,
    )
  }

  async clearDiffJson(scanId: number, client?: PoolClient): Promise<void> {
    await query(
      `UPDATE silver.discovery_scan
       SET diff_json = NULL
       WHERE id = $1`,
      [scanId],
      client ?? this.pool,
    )
  }
}
