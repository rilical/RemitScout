export type RightsMatrixProviderRecord = {
  provider_id: string
}

export type RightsMatrixIndexPermissionRecord = {
  provider_id: string
  allowed_in_teer?: boolean | null
  allowed_in_rci?: boolean | null
  allowed_in_rvi?: boolean | null
  allowed_collect?: boolean | null
  allowed_b2c?: boolean | null
  stoplist_status?: string | null
}

export interface IRightsMatrixRepository {
  listActiveB2cProviders(): Promise<RightsMatrixProviderRecord[]>
  listActiveB2cProvidersByCountry(
    sourceCountry: string,
    destCountry: string,
  ): Promise<RightsMatrixProviderRecord[]>
  listIndexPermissionsByProviders(
    providerIds: string[],
  ): Promise<RightsMatrixIndexPermissionRecord[]>
}
