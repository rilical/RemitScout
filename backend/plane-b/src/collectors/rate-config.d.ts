import type { Pool } from 'pg';
export type ProviderRates = {
    rpm: number;
    perCorridorRpm: number;
    source: 'default' | 'db' | 'override' | 'redis_penalty';
};
type ProviderRateDefaults = {
    rpm: number;
    perCorridorRpm: number;
};
type ProviderRateOverrides = {
    rpm?: number;
    perCorridorRpm?: number;
};
export declare const resolveProviderRates: (pool: Pool, providerId: string, defaults: ProviderRateDefaults, overrides?: ProviderRateOverrides) => Promise<ProviderRates>;
export declare const persistProviderRates: (pool: Pool, providerId: string, rates: {
    rpm: number;
    perCorridorRpm: number;
}) => Promise<void>;
export {};
