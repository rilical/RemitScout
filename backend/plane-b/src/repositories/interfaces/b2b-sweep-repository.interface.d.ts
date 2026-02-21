export type B2bSweepRunStatus = 'planned' | 'running' | 'completed' | 'failed';
export type B2bSweepTaskStatus = 'pending' | 'processing' | 'success' | 'failed' | 'skipped';
export type B2bSweepRunInput = {
    priorityTier: string;
    cadenceMinutes: number;
    targetMinutes: number;
    observationMode: boolean;
    corridorsTotal: number;
    providersTotal: number;
    status?: B2bSweepRunStatus;
};
export type B2bSweepTaskInput = {
    corridorId: string;
    providerId: string;
    collectorType: string;
    priorityTier: string;
    amountBucket: number;
    payinMethod: string;
    payoutMethod: string;
};
export type B2bSweepTaskKey = {
    providerId: string;
    corridorId: string;
    amountBucket: number;
    payinMethod: string;
    payoutMethod: string;
};
export type B2bSweepRunSummary = {
    remaining: number;
    failed: number;
};
export type B2bSweepRunRecord = {
    runId: string;
    priorityTier: string;
    status: B2bSweepRunStatus;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
};
export type B2bSweepTaskRecord = B2bSweepTaskInput & {
    status: B2bSweepTaskStatus;
    enqueuedAt: Date | null;
};
export type B2bSweepTaskInsertOptions = {
    enqueuedAt?: Date | null;
};
export interface IB2bSweepRepository {
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
