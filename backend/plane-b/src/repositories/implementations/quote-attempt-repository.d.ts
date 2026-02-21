import type { Pool } from 'pg';
import type { IQuoteAttemptRepository, QuoteAttemptInput } from '../interfaces/quote-attempt-repository.interface';
export declare class QuoteAttemptRepository implements IQuoteAttemptRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertAttempt(input: QuoteAttemptInput): Promise<void>;
}
