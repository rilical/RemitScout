import type { Pool } from 'pg';
import type { IProviderRepository, ProviderInput } from '../interfaces/provider-repository.interface';
export declare class ProviderRepository implements IProviderRepository {
    private readonly pool;
    constructor(pool: Pool);
    upsertProvider(input: ProviderInput): Promise<void>;
}
