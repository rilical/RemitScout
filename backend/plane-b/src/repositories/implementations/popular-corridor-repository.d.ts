import type { Pool, PoolClient } from 'pg';
import type { IPopularCorridorRepository, PopularCorridorAggregationRow, PopularCorridorInput } from '../interfaces/popular-corridor-repository.interface';
export declare class PopularCorridorRepository implements IPopularCorridorRepository {
    private readonly pool;
    constructor(pool: Pool | PoolClient);
    clearAll(): Promise<void>;
    insertCorridor(input: PopularCorridorInput): Promise<void>;
    aggregatePopularCorridors(maxResults?: number): Promise<PopularCorridorAggregationRow[]>;
}
