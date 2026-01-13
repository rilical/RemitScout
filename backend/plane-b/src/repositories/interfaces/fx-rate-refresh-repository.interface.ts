import type { FxRateRefreshStatusValue } from '../types/fx-rate-refresh-status'

export type FxRateRefreshRequestRecord = {
  request_id: string
  base_currency: string
  quote_currency: string
  retry_count: number
}

export interface IFxRateRefreshRepository {
  claimPendingRequests(limit: number, maxRetries: number): Promise<FxRateRefreshRequestRecord[]>
  claimRequestById(
    requestId: string,
    maxRetries: number,
    retryCount?: number,
  ): Promise<FxRateRefreshRequestRecord | null>
  markRequestStatus(
    requestId: string,
    status: FxRateRefreshStatusValue,
    errorMessage: string | null,
  ): Promise<void>
  markRequestFailed(
    requestId: string,
    errorMessage: string | null,
    retryCountOverride?: number,
  ): Promise<void>
  retryFailedRequests(minAgeSeconds: number): Promise<number>
  getQueueDepth(): Promise<number>
  cleanupRequests(statuses: FxRateRefreshStatusValue[], olderThanHours: number): Promise<number>
}
