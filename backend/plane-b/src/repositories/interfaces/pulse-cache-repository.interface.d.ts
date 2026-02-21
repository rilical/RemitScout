import type { PulseCacheFilters } from '../../../../shared/pulse-types';
export type { PulseCacheFilters } from '../../../../shared/pulse-types';
export type PulseCacheEntryInput = {
    key: string;
    payload: string;
};
export type PulseCacheEntry = {
    key: string;
    payload: unknown;
    updated_at: Date;
};
export type PulseCorridorFilter = {
    corridor: string;
    corridor_id: string;
    from_country: string;
    to_country: string;
    send_currency: string;
    recv_currency: string;
    provider_count: number;
    last_updated: string | null;
};
export type PulseMethodFilter = {
    payin: string;
    payout: string;
};
export interface IPulseCacheRepository {
    upsertEntry(input: PulseCacheEntryInput): Promise<void>;
    aggregatePulseCacheData(filters: PulseCacheFilters): Promise<Map<string, unknown>>;
    listPulseCorridors(): Promise<PulseCorridorFilter[]>;
    listPulseMethods(filters: PulseCacheFilters): Promise<PulseMethodFilter[]>;
    getEntry(key: string): Promise<unknown | null>;
    invalidateEntry(key: string): Promise<void>;
}
