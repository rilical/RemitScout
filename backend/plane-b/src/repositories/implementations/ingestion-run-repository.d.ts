import type { Pool } from 'pg';
import type { IIngestionRunRepository, IngestionRunDurationRecord, IngestionRunInsertInput } from '../interfaces/ingestion-run-repository.interface';
export declare class IngestionRunRepository implements IIngestionRunRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertRun(input: IngestionRunInsertInput): Promise<string>;
    updateRunStatus(runId: string, status: string, errorCode: string | null): Promise<void>;
    getLastSweepAgeSeconds(providerId: string, collectorType: string): Promise<number | null>;
    loadLatestSweepDurations(): Promise<IngestionRunDurationRecord[]>;
}
