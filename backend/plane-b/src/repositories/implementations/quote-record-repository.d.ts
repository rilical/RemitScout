import type { Pool } from 'pg';
import type { IQuoteRecordRepository, QuoteBaselineRecord, QuoteRecordInsertInput, QuoteRecordPersistInput } from '../interfaces/quote-record-repository.interface';
import type { LatestQuoteUpsertInput } from '../interfaces/latest-quote-repository.interface';
export declare class QuoteRecordRepository implements IQuoteRecordRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertQuoteRecord(input: QuoteRecordInsertInput): Promise<void>;
    insertQuoteAndUpsertLatest(input: {
        quote: QuoteRecordPersistInput;
        latest: LatestQuoteUpsertInput;
    }): Promise<void>;
    getBaselineStats(corridorId: string, providerId: string): Promise<QuoteBaselineRecord | null>;
}
