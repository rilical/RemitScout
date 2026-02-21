import type { Pool } from 'pg';
import type { IFxRateRefreshRepository, FxRateRefreshRequestRecord } from '../interfaces/fx-rate-refresh-repository.interface';
import { type FxRateRefreshStatusValue } from '../types/fx-rate-refresh-status';
export declare class FxRateRefreshRepository implements IFxRateRefreshRepository {
    private readonly pool;
    constructor(pool: Pool);
    claimPendingRequests(limit: number, maxRetries: number): Promise<FxRateRefreshRequestRecord[]>;
    claimRequestById(requestId: string, maxRetries: number, retryCount?: number): Promise<FxRateRefreshRequestRecord | null>;
    markRequestClaimed(requestId: string, retryCount?: number): Promise<void>;
    markRequestStatus(requestId: string, status: FxRateRefreshStatusValue, errorMessage: string | null): Promise<void>;
    markRequestFailed(requestId: string, errorMessage: string | null, retryCountOverride?: number): Promise<void>;
    retryFailedRequests(minAgeSeconds: number): Promise<number>;
    getQueueDepth(): Promise<number>;
    cleanupRequests(statuses: FxRateRefreshStatusValue[], olderThanHours: number): Promise<number>;
}
