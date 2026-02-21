import type { Pool } from 'pg';
import type { CorridorInput, ICorridorRepository } from '../interfaces/corridor-repository.interface';
export declare class CorridorRepository implements ICorridorRepository {
    private readonly pool;
    constructor(pool: Pool);
    insertIfMissing(input: CorridorInput): Promise<void>;
    upsertCorridor(input: CorridorInput): Promise<void>;
}
