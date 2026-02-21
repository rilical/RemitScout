import type { Pool } from 'pg';
import type { ICorridorVolatilityRepository, CorridorVolatilityRecord } from '../interfaces/corridor-volatility-repository.interface';
export declare class CorridorVolatilityRepository implements ICorridorVolatilityRepository {
    private readonly pool;
    constructor(pool: Pool);
    getVolatilityScore(corridorId: string): Promise<CorridorVolatilityRecord | null>;
    getVolatilityScores(corridorIds: string[]): Promise<Map<string, CorridorVolatilityRecord>>;
    calculateVolatilityScore(corridorId: string): Promise<CorridorVolatilityRecord | null>;
    upsertVolatilityForCorridors(corridorIds: string[]): Promise<number>;
}
