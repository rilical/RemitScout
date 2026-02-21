import type { Pool } from 'pg';
import type { ILatestQuoteRepository, LatestQuoteAgeRecord, LatestQuoteUpsertInput } from '../interfaces/latest-quote-repository.interface';
export declare class LatestQuoteRepository implements ILatestQuoteRepository {
    private readonly pool;
    constructor(pool: Pool);
    getLatestCollectedAt(corridorId: string, amountBucket: number, payinMethod: string, payoutMethod: string, providerId: string): Promise<Date | null>;
    getLatestQuoteAgeMinutes(providerId: string, corridorId: string, amountBucket: number, payinMethod: string, payoutMethod: string): Promise<number | null>;
    loadFreshnessLagByCorridor(providerId: string, corridors: string[], amountBucket: number, payinMethod: string, payoutMethod: string): Promise<LatestQuoteAgeRecord[]>;
    upsertLatestQuote(input: LatestQuoteUpsertInput): Promise<void>;
}
