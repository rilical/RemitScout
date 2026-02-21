import type { Pool } from 'pg';
import type { IRightsMatrixRepository, RightsMatrixCountrySupportInput, RightsMatrixEntryRecord, RightsMatrixGovernanceInput, RightsMatrixIndexPermissionsInput, RightsMatrixQualityMetricsInput, RightsMatrixStatusRecord, RightsMatrixStoplistRecord, RightsMatrixUpsertInput } from '../interfaces/rights-matrix-repository.interface';
export declare class RightsMatrixRepository implements IRightsMatrixRepository {
    private readonly pool;
    constructor(pool: Pool);
    pauseProvider(providerId: string, notes: string): Promise<void>;
    getProviderStatus(providerId: string): Promise<RightsMatrixStatusRecord | null>;
    setProviderActive(providerId: string): Promise<void>;
    loadProviderRights(): Promise<RightsMatrixEntryRecord[]>;
    upsertProviderRights(input: RightsMatrixUpsertInput): Promise<void>;
    upsertProviderCountrySupport(input: RightsMatrixCountrySupportInput): Promise<void>;
    loadStoplistStatuses(): Promise<RightsMatrixStoplistRecord[]>;
    updateIndexPermissions(input: RightsMatrixIndexPermissionsInput): Promise<void>;
    updateGovernance(input: RightsMatrixGovernanceInput): Promise<void>;
    updateQualityMetrics(input: RightsMatrixQualityMetricsInput): Promise<void>;
    loadProvidersEligibleForIndex(indexType: 'rvi' | 'rci' | 'teer'): Promise<RightsMatrixEntryRecord[]>;
}
