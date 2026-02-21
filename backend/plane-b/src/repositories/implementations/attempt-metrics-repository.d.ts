import type { Pool } from 'pg';
import type { AttemptMetricsInput, AttemptMetricsRecord, IAttemptMetricsRepository } from '../interfaces/attempt-metrics-repository.interface';
export declare class AttemptMetricsRepository implements IAttemptMetricsRepository {
    private readonly pool;
    constructor(pool: Pool);
    getMetrics(providerId: string, locale: string): Promise<AttemptMetricsRecord | null>;
    upsertMetrics(input: AttemptMetricsInput): Promise<void>;
}
