export type CountryInput = {
    code: string;
    name: string;
    currency: string;
};
export interface ICountriesRepository {
    upsertCountry(input: CountryInput): Promise<void>;
}
