import type { Pool } from 'pg';
import type { CountryInput, ICountriesRepository } from '../interfaces/countries-repository.interface';
export declare class CountriesRepository implements ICountriesRepository {
    private readonly pool;
    constructor(pool: Pool);
    upsertCountry(input: CountryInput): Promise<void>;
}
