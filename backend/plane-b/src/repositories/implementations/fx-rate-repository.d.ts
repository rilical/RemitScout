import type { Pool } from 'pg';
import type { FxRateAggregationRow, FxRateInput, FxRateRecord, FxRateWithHistory, IFxRateRepository } from '../interfaces/fx-rate-repository.interface';
export declare class FxRateRepository implements IFxRateRepository {
    private readonly pool;
    constructor(pool: Pool);
    upsertRate(input: FxRateInput): Promise<void>;
    aggregateFxRates(): Promise<FxRateAggregationRow[]>;
    getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null>;
    getRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRateRecord[]>;
    getRateWithHistory(baseCurrency: string, quoteCurrency: string, days: number): Promise<FxRateWithHistory>;
}
