import type { Pool } from 'pg';
/**
 * Common run options passed through the provider registry to collectors.
 */
export type ProviderRunOptions = {
    pool: Pool;
    collectorType: string;
    corridors: string[];
    amountBuckets: number[];
    payinMethod: string;
    payoutMethod: string;
    locale?: string;
    delayMs?: number;
    jitterMs?: number;
    rateLimitBackoffMs?: number;
    rateLimitJitterMs?: number;
    rateLimitMaxRetries?: number;
    corridorDelayMs?: number;
    corridorJitterMs?: number;
    freshnessSloMinutes?: number;
    freshnessSloEnabled?: boolean;
    rpmOverride?: number;
    perCorridorRpmOverride?: number;
    closePool?: boolean;
};
export type ProviderRegistryEntry = {
    providerId: string;
    displayName: string;
    supportedCorridors: string[];
    baseRates: {
        rpm: number;
        perCorridorRpm: number;
    };
    run: (options: ProviderRunOptions) => Promise<boolean>;
};
export type ProviderDefinition = Omit<ProviderRegistryEntry, 'run'> & {
    runCollector: (options: ProviderRunOptions) => Promise<boolean>;
};
export declare const buildProviderRegistry: (definitions: ProviderDefinition[]) => ProviderRegistryEntry[];
export declare const validateProviderRegistry: (registry: ProviderRegistryEntry[]) => void;
