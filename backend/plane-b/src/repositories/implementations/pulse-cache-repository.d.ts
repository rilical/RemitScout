import type { Pool } from 'pg';
import type { IPulseCacheRepository, PulseCacheEntryInput, PulseCacheFilters, PulseCorridorFilter, PulseMethodFilter } from '../interfaces/pulse-cache-repository.interface';
export declare class PulseCacheRepository implements IPulseCacheRepository {
    private readonly pool;
    constructor(pool: Pool);
    upsertEntry(input: PulseCacheEntryInput): Promise<void>;
    listPulseCorridors(): Promise<PulseCorridorFilter[]>;
    listPulseMethods(filters: PulseCacheFilters): Promise<PulseMethodFilter[]>;
    aggregatePulseCacheData(filters: PulseCacheFilters): Promise<Map<string, unknown>>;
    getEntry(key: string): Promise<unknown | null>;
    invalidateEntry(key: string): Promise<void>;
}
