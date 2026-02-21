import type { Pool } from 'pg';
import type { FreshnessReportBatch, IFreshnessReportRepository } from '../interfaces/freshness-report-repository.interface';
export declare class FreshnessReportRepository implements IFreshnessReportRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertBatch(input: FreshnessReportBatch): Promise<void>;
}
