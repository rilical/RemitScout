import type { Pool } from 'pg';
import { type CacheTtlResult, type VolatilityTier } from '../../../shared/volatility-service';
export declare class VolatilityService {
    private readonly service;
    private readonly repo;
    constructor(pool: Pool);
    getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult>;
    getCacheTtlForCorridors(corridorIds: string[]): Promise<Map<string, CacheTtlResult>>;
    refreshCacheForCorridors(corridorIds: string[]): Promise<number>;
}
export type { CacheTtlResult, VolatilityTier };
