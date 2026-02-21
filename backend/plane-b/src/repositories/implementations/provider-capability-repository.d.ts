import type { Pool } from 'pg';
import type { IProviderCapabilityRepository, ProviderCapabilityInput, ProviderCapabilityRecord, ProviderCorridorPriorityRecord, ProviderCorridorRecord, ProviderUnsupportedCorridorRecord } from '../interfaces/provider-capability-repository.interface';
export declare class ProviderCapabilityRepository implements IProviderCapabilityRepository {
    private readonly pool;
    constructor(pool: Pool);
    getCapability(providerId: string, corridorId: string): Promise<ProviderCapabilityRecord | null>;
    getCapabilitiesForCorridor(corridorId: string): Promise<ProviderCapabilityRecord[]>;
    loadAllSupportedCapabilities(): Promise<ProviderCapabilityRecord[]>;
    loadObservedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>;
    loadUnsupportedCorridors(providerId: string): Promise<ProviderCorridorRecord[]>;
    loadUnsupportedCorridorsWithAge(providerId: string): Promise<ProviderUnsupportedCorridorRecord[]>;
    upsertCapability(input: ProviderCapabilityInput): Promise<void>;
    markCorridorUnsupported(providerId: string, corridorId: string, source: string): Promise<void>;
    loadCoverageCorridors(minProviders: number): Promise<ProviderCorridorRecord[]>;
    loadPriorityCorridors(providerId: string, tierVersion?: string): Promise<ProviderCorridorPriorityRecord[]>;
}
