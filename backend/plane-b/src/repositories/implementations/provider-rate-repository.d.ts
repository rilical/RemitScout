import type { Pool } from 'pg';
import type { IProviderRateRepository, ProviderRateConfigInput, ProviderRateConfigRecord } from '../interfaces/provider-rate-repository.interface';
export declare class ProviderRateRepository implements IProviderRateRepository {
    private readonly pool;
    constructor(pool: Pool);
    getRates(providerId: string): Promise<ProviderRateConfigRecord | null>;
    upsertRates(input: ProviderRateConfigInput): Promise<void>;
}
