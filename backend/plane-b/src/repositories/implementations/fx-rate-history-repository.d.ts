import type { Pool } from 'pg';
import type { FxRateHistoryInput, FxRateHistoryRecord, IFxRateHistoryRepository } from '../interfaces/fx-rate-history-repository.interface';
export declare class FxRateHistoryRepository implements IFxRateHistoryRepository {
    private readonly pool;
    constructor(pool: Pool);
    getHistory(baseCurrency: string, quoteCurrency: string, startDate: string, endDate: string): Promise<FxRateHistoryRecord[]>;
    getLatestHistory(baseCurrency: string, quoteCurrency: string, days: number): Promise<FxRateHistoryRecord[]>;
    upsertHistory(records: FxRateHistoryInput[]): Promise<void>;
}
