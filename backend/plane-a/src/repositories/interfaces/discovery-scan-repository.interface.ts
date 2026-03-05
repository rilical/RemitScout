import type { PoolClient } from 'pg'

export type DiscoveryScanListRecord = {
  id: number
  provider_id: string
  scan_type: string
  status: string
  corridors_discovered: number | null
  delivery_methods_discovered: number | null
  promotions_detected: number | null
  errors_count: number | null
  duration_ms: number | null
  triggered_by: string | null
  correlation_id: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export type DiscoveryScanDetailRecord = DiscoveryScanListRecord & {
  result_json: unknown
  diff_json: unknown
}

export type DiscoveryScanPendingReviewRecord = DiscoveryScanListRecord & {
  diff_json: unknown
}

export type DiscoveryScanApproveRecord = {
  id: number
  provider_id: string
  status: string
  result_json: unknown
  diff_json: unknown
}

export type DiscoveryScanDismissRecord = {
  id: number
  provider_id: string
  status: string
}

export type RightsMatrixCountriesRecord = {
  source_countries: string[] | null
  destination_countries: string[] | null
}

export type CorridorCapabilityMethodsRecord = {
  payin_methods: string[] | null
  payout_methods: string[] | null
}

export type ListScansFilters = {
  providerId?: string
  status?: string
  limit: number
}

export interface IDiscoveryScanRepository {
  listScans(filters: ListScansFilters): Promise<DiscoveryScanListRecord[]>

  getScanById(scanId: number): Promise<DiscoveryScanDetailRecord | null>

  listPendingReviews(limit: number): Promise<DiscoveryScanPendingReviewRecord[]>

  getScanForApproval(scanId: number, client?: PoolClient): Promise<DiscoveryScanApproveRecord | null>

  getScanForDismissal(scanId: number): Promise<DiscoveryScanDismissRecord | null>

  getRightsMatrixCountries(providerId: string, client?: PoolClient): Promise<RightsMatrixCountriesRecord | null>

  upsertRightsMatrix(
    providerId: string,
    sourceCountries: string[],
    destinationCountries: string[],
    client?: PoolClient,
  ): Promise<void>

  insertRightsMatrixAuditLog(
    providerId: string,
    fieldChanged: string,
    previousValue: string,
    newValue: string,
    discoveryScanId: number,
    approvedBy: string,
    client?: PoolClient,
  ): Promise<void>

  getCorridorCapabilityMethods(
    providerId: string,
    corridorId: string,
    client?: PoolClient,
  ): Promise<CorridorCapabilityMethodsRecord | null>

  upsertCorridorCapability(
    providerId: string,
    corridorId: string,
    payinMethods: string[],
    payoutMethods: string[],
    client?: PoolClient,
  ): Promise<void>

  clearDiffJson(scanId: number, client?: PoolClient): Promise<void>
}
