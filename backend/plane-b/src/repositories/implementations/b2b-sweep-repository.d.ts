import type { Pool } from 'pg';
import type { B2bSweepRunInput, B2bSweepRunRecord, B2bSweepRunStatus, B2bSweepRunSummary, B2bSweepTaskInsertOptions, B2bSweepTaskInput, B2bSweepTaskKey, B2bSweepTaskRecord, B2bSweepTaskStatus, IB2bSweepRepository } from '../interfaces/b2b-sweep-repository.interface';
export declare class B2bSweepRepository implements IB2bSweepRepository {
    private readonly pool;
    constructor(pool: Pool);
    createSweepRun(input: B2bSweepRunInput): Promise<string>;
    updateSweepRunStatus(runId: string, status: B2bSweepRunStatus, finishedAt?: Date | null): Promise<void>;
    updateSweepRunTotals(runId: string, corridorsTotal: number, providersTotal: number): Promise<void>;
    getLatestRunByTier(priorityTier: string): Promise<B2bSweepRunRecord | null>;
    getActiveRunByTier(priorityTier: string): Promise<B2bSweepRunRecord | null>;
    insertSweepTasks(runId: string, tasks: B2bSweepTaskInput[], options?: B2bSweepTaskInsertOptions): Promise<void>;
    loadPendingTasks(runId: string, limit: number): Promise<B2bSweepTaskRecord[]>;
    markTasksEnqueued(runId: string, keys: B2bSweepTaskKey[]): Promise<void>;
    markTaskProcessing(runId: string, key: B2bSweepTaskKey): Promise<void>;
    markTasksProcessingBatch(runId: string, keys: B2bSweepTaskKey[]): Promise<void>;
    markTaskFinished(runId: string, key: B2bSweepTaskKey, status: B2bSweepTaskStatus, errorReason?: string | null): Promise<void>;
    markTasksFinishedBatch(runId: string, keys: B2bSweepTaskKey[], status: B2bSweepTaskStatus, errorReason?: string | null): Promise<void>;
    getRunSummary(runId: string): Promise<B2bSweepRunSummary>;
}
