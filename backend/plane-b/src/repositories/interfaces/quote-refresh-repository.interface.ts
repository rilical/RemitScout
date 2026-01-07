import type { QuoteRefreshStatusValue } from '../types/quote-refresh-status'

export type QuoteRefreshRequestRecord = {
  request_id: string
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin_method: string
  payout_method: string
  retry_count: number
}

export interface IQuoteRefreshRepository {
  claimPendingRequests(limit: number, maxRetries: number): Promise<QuoteRefreshRequestRecord[]>
  markRequestStatus(
    requestId: string,
    status: QuoteRefreshStatusValue,
    errorMessage: string | null,
  ): Promise<void>
  markRequestFailed(
    requestId: string,
    errorMessage: string | null,
    retryCountOverride?: number,
  ): Promise<void>
  retryFailedRequests(minAgeSeconds: number): Promise<number>
  getQueueDepth(): Promise<number>
  cleanupRequests(statuses: QuoteRefreshStatusValue[], olderThanHours: number): Promise<number>
}



