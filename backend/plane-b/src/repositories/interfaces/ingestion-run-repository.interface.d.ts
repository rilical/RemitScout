export type IngestionRunInsertInput = {
    providerId: string;
    collectorType: string;
    startedAt: Date;
    finishedAt: Date;
    status: string;
};
export type IngestionRunDurationRecord = {
    provider_id: string;
    duration_minutes: number;
    finished_at: string;
    status: string;
};
export interface IIngestionRunRepository {
    insertRun(input: IngestionRunInsertInput): Promise<string>;
    updateRunStatus(runId: string, status: string, errorCode: string | null): Promise<void>;
    getLastSweepAgeSeconds(providerId: string, collectorType: string): Promise<number | null>;
    loadLatestSweepDurations(): Promise<IngestionRunDurationRecord[]>;
}
