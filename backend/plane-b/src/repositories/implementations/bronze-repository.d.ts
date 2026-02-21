import type { Pool } from 'pg';
import type { BronzeWriteInput, FailedAttemptInput, IBronzeRepository } from '../interfaces/bronze-repository.interface';
export declare class BronzeRepository implements IBronzeRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertPayload(input: BronzeWriteInput): Promise<number | null>;
    recordFailedAttempt(input: FailedAttemptInput): Promise<void>;
}
