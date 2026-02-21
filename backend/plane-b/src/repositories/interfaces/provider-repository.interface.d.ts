export type ProviderInput = {
    providerId: string;
    displayName: string;
};
export interface IProviderRepository {
    upsertProvider(input: ProviderInput): Promise<void>;
}
