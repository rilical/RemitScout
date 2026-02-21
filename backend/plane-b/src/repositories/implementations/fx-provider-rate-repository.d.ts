import type { Pool } from 'pg';
import type { FxProviderRateInput, IFxProviderRateRepository } from '../interfaces/fx-provider-rate-repository.interface';
export declare class FxProviderRateRepository implements IFxProviderRateRepository {
    private readonly pool;
    constructor(pool: Pool);
    upsertRate(input: FxProviderRateInput): Promise<void>;
}
