import type { Pool } from 'pg';
import type { IQuoteRefreshRepository, QuoteRefreshRequestRecord } from '../interfaces/quote-refresh-repository.interface';
import { type QuoteRefreshStatusValue } from '../types/quote-refresh-status';
export declare class QuoteRefreshRepository implements IQuoteRefreshRepository {
    private readonly pool;
    constructor(pool: Pool);
    claimPendingRequests(limit: number, maxRetries: number): Promise<QuoteRefreshRequestRecord[]>;
    claimRequestById(requestId: string, maxRetries: number, retryCount?: number): Promise<QuoteRefreshRequestRecord | null>;
    markRequestStatus(requestId: string, status: QuoteRefreshStatusValue, errorMessage: string | null): Promise<void>;
    markRequestFailed(requestId: string, errorMessage: string | null, retryCountOverride?: number): Promise<void>;
    retryFailedRequests(minAgeSeconds: number): Promise<number>;
    getQueueDepth(): Promise<number>;
    cleanupRequests(statuses: QuoteRefreshStatusValue[], olderThanHours: number): Promise<number>;
}
