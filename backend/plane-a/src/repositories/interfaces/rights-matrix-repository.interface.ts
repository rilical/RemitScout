export type RightsMatrixProviderRecord = {
  provider_id: string
}

export interface IRightsMatrixRepository {
  listActiveB2cProviders(): Promise<RightsMatrixProviderRecord[]>
  listActiveB2cProvidersByCountry(
    sourceCountry: string,
    destCountry: string,
  ): Promise<RightsMatrixProviderRecord[]>
}
