import type { Pool } from 'pg';
import type { CorridorPriorityRecord, ICorridorPriorityRepository } from '../interfaces/corridor-priority-repository.interface';
export declare class CorridorPriorityRepository implements ICorridorPriorityRepository {
    private readonly pool;
    constructor(pool: Pool);
    getProxyTier(corridorId: string): Promise<CorridorPriorityRecord | null>;
}
